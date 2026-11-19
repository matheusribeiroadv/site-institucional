/**
 * Cadastro dos e-books do site → planilha do Google (Apps Script).
 *
 * Recebe o formulário da página do guia e grava em 3 abas desta planilha:
 *   - Downloads:     todo mundo que baixou (com a prova do consentimento). NÃO vai para o funil de vendas.
 *   - Contatos:      só quem marcou "Quero falar com a equipe", no formato do modelo de contatos do LuviAdv.
 *   - Oportunidades: as mesmas pessoas, no formato do modelo de oportunidades do LuviAdv.
 * Quem pediu contato vai também para as planilhas de importação do escritório (uma planilha por arquivo,
 * como o LuviAdv exige): Contatos_Leads e CRM_Leads. As colunas são casadas pelo NOME do cabeçalho.
 * Importação no LuviAdv: baixar cada uma em .xlsx, primeiro Contatos_Leads, depois CRM_Leads.
 * Nomes de pessoas: caixa alta, sem acento e sem caractere especial (padrão do escritório).
 *
 * Propriedades do script (Configurações do projeto › Propriedades do script) — NUNCA no código, o repositório é público:
 *   - TURNSTILE_SECRET: chave secreta do anti-robô (Cloudflare Turnstile);
 *   - CONTATOS_LEADS_ID e CRM_LEADS_ID: o código de cada planilha (o trecho do endereço entre /d/ e /edit).
 * Depois de configurar ou mudar essas planilhas, rode `conferirListas` no editor.
 *
 * Instalação e manutenção: README do site, seção "E-book e cadastro".
 * Se mudar o texto de uma caixa de consentimento no site, mude também em TEXTOS (e crie uma versão nova).
 */

const CONFIG = {
  // OBRIGATÓRIO para importar Contatos: nome EXATO da empresa cadastrada no LuviAdv
  EMPRESA_LUVIADV: 'MRA ADVOGADOS E ASSOCIADOS',
  FUNIL: 'FUNIL EVERTON COMERCIAL',
  ETAPA: 'NOVA LEAD',
  // opcionais: precisam existir no LuviAdv com o mesmo nome (senão a importação recusa)
  RESPONSAVEL: '',
  ORIGEM_CONTATO: '',
  ETIQUETAS_OPORTUNIDADE: '',          // ex.: 'ebook|site' (as etiquetas precisam estar ativas no LuviAdv)
  TAGS_CONTATO: 'ebook, site',
  TIPO_PESSOA: 'PF',
  // versão da Política de Privacidade em vigor (atualize quando a política mudar)
  POLITICA: 'Política de Privacidade de 17/11/2026',
  MESES_GUARDA: 12,                     // quem só baixou é apagado depois disso (quem assinou a newsletter fica)
  FUSO: 'America/Sao_Paulo',
  // e-books aceitos: identificador enviado pelo site → nome que aparece na planilha e no LuviAdv
  EBOOKS: { 'renegociacao-dividas-rurais': 'Renegociação de Dívidas Rurais' },
};

// Textos EXATOS das caixas de consentimento, por versão (o site informa qual versão mostrou).
const TEXTOS = {
  v1: {
    ebook: 'Concordo com o uso do meu nome e e-mail para receber este guia, conforme a Política de Privacidade.',
    newsletter: 'Quero receber novos artigos do blog por e-mail.',
    contato: 'Quero falar com a equipe sobre o tema e autorizo o contato pelo WhatsApp informado.',
  },
};

// Colunas. Contatos e Oportunidades seguem os modelos do LuviAdv (mesma ordem e mesmos nomes);
// as colunas que começam com "_" são de controle desta planilha. `_na_planilha_luviadv` diz se a
// pessoa entrou em Contatos_Leads/CRM_Leads ("Sim") ou o erro (aí, copie a linha à mão).
const CONTROLE = ['_registrado_em', '_na_planilha_luviadv'];
const LISTAS = { Contatos: 'CONTATOS_LEADS_ID', Oportunidades: 'CRM_LEADS_ID' };
const CAB = {
  Downloads: ['data_hora', 'ebook', 'nome', 'email', 'newsletter', 'pediu_contato', 'whatsapp',
    'consentimentos', 'politica', 'pagina'],
  Contatos: ['empresa', 'nome', 'apelido', 'tipo_pessoa', 'é_lead', 'é_cliente', 'é_fornecedor', 'é_parceiro',
    'email', 'telefone', 'telefone_secundario', 'cargo', 'profissao', 'cpf', 'cnpj', 'identidade', 'razao_social',
    'nome_fantasia', 'estado_civil', 'sexo', 'nascimento', 'pais', 'estado', 'municipio', 'cep', 'endereco',
    'bairro', 'responsavel', 'perfil', 'origem', 'valor_divida', 'tags', 'observacoes'],
  Oportunidades: ['contato_telefone', 'contato_nome', 'titulo', 'funil', 'etapa', 'status', 'valor', 'responsavel',
    'produto', 'etiqueta', 'categoria', 'empresa', 'motivo_perda', 'observacoes', 'criado_em', 'etapa_desde',
    'atualizado_em', 'ganha_em'],
};

/* =========================== Funções puras (testáveis) =========================== */

// texto limpo: sem caracteres de controle, espaços normais, tamanho máximo e sem virar fórmula na planilha
function limpo(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

// nome de pessoa no padrão do escritório: "João D'Ávila-Çé" → "JOAO D AVILA CE"
function nomePadrao(v) {
  return String(v == null ? '' : v).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z ]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
}

// cabeçalho comparável: "É_Lead " → "e_lead"
function chaveCab(h) {
  return String(h == null ? '' : h).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toLowerCase().replace(/\s+/g, '_');
}

// encaixa `valores` (na ordem de `nossoCab`) nas colunas de `cabDestino`, pelo nome.
// Recusa se o destino não tiver quase todas as colunas do modelo (planilha errada ou cabeçalho mudado).
function alinharPorCabecalho(cabDestino, nossoCab, valores) {
  const pos = {};
  nossoCab.forEach((c, i) => { pos[chaveCab(c)] = i; });
  const linha = cabDestino.map(h => (chaveCab(h) in pos ? valores[pos[chaveCab(h)]] : ''));
  const achadas = cabDestino.filter(h => chaveCab(h) in pos).length;
  if (achadas < Math.ceil(nossoCab.length * 0.8)) {
    throw new Error(`cabeçalho diferente do modelo (${achadas} de ${nossoCab.length} colunas reconhecidas)`);
  }
  return linha;
}

// chaves para achar a mesma pessoa: telefone = DDD + 8 últimos dígitos (com ou sem o 9, com ou sem +55)
function chaveTel(v) {
  let d = String(v == null ? '' : v).replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  return d.length === 10 || d.length === 11 ? d.slice(0, 2) + d.slice(-8) : '';
}
function chaveEmail(v) {
  return String(v == null ? '' : v).trim().toLowerCase();
}

// a pessoa ({tel, email}) aparece em `linhas` (colunas achadas pelo nome em `cab`)? `filtro` opcional por linha
function achaPessoa(cab, linhas, pessoa, filtro) {
  const k = cab.map(chaveCab);
  const iTel = ['telefone', 'telefone_secundario', 'contato_telefone'].map(c => k.indexOf(c)).filter(i => i >= 0);
  const iEmail = k.indexOf('email');
  return linhas.some(l => (!filtro || filtro(l)) && (
    (pessoa.tel && iTel.some(i => chaveTel(l[i]) === pessoa.tel)) ||
    (pessoa.email && iEmail >= 0 && chaveEmail(l[iEmail]) === pessoa.email)));
}

// WhatsApp brasileiro → "(62) 99999-0000"; null se inválido
function telefoneBR(v) {
  let d = String(v == null ? '' : v).replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  if (/^(\d)\1+$/.test(d)) return null;
  const n = d.slice(2);
  return `(${d.slice(0, 2)}) ${n.length === 9 ? n.slice(0, 5) + '-' + n.slice(5) : n.slice(0, 4) + '-' + n.slice(4)}`;
}

function validar(d) {
  if (!d || typeof d !== 'object') return { ok: false, erro: 'dados' };
  const textos = TEXTOS[d.textos];
  const ebook = CONFIG.EBOOKS[d.ebook];
  if (!textos || !ebook) return { ok: false, erro: 'ebook' };
  const nome = limpo(d.nome, 120);
  if (nome.replace(/[^A-Za-zÀ-ÿ]/g, '').length < 3) return { ok: false, erro: 'nome' };
  const email = limpo(d.email, 254).toLowerCase();
  if (!/^[^\s@'"<>]+@[^\s@'"<>]+\.[a-z]{2,}$/i.test(email)) return { ok: false, erro: 'email' };
  if (d.aceite !== true) return { ok: false, erro: 'aceite' };
  const contato = d.contato === true;
  let whatsapp = '';
  if (contato) {
    whatsapp = telefoneBR(d.whatsapp);
    if (!whatsapp) return { ok: false, erro: 'whatsapp' };
  }
  return {
    ok: true,
    dados: {
      ebookId: d.ebook, ebook, nome, email, contato, whatsapp, textos,
      newsletter: d.newsletter === true,
      pagina: limpo(d.pagina, 200),
    },
  };
}

function porCabecalho(cab, valores) {
  return cab.map(c => (c in valores ? valores[c] : ''));
}

// monta as linhas das 3 abas; `fmt(data, padrão)` formata datas no fuso do escritório
function montarLinhas(v, agora, fmt) {
  const dataHora = fmt(agora, 'dd/MM/yyyy HH:mm:ss');
  const data = fmt(agora, 'dd/MM/yyyy');
  const aceitos = [v.textos.ebook];
  if (v.newsletter) aceitos.push(v.textos.newsletter);
  if (v.contato) aceitos.push(v.textos.contato);
  const consentimentos = aceitos.map(t => `"${t}"`).join(' | ');
  const nome = nomePadrao(v.nome);   // padrão do escritório: caixa alta, sem acento nem caractere especial
  const linhas = {
    Downloads: porCabecalho(CAB.Downloads, {
      data_hora: dataHora, ebook: v.ebook, nome, email: v.email,
      newsletter: v.newsletter ? 'Sim' : 'Não', pediu_contato: v.contato ? 'Sim' : 'Não',
      whatsapp: v.whatsapp, consentimentos, politica: CONFIG.POLITICA, pagina: v.pagina,
    }),
  };
  if (v.contato) {
    const obs = `Pediu contato pelo site ao baixar o e-book "${v.ebook}" em ${fmt(agora, 'dd/MM/yyyy HH:mm')}. ` +
      `Texto aceito: "${v.textos.contato}". E-mail: ${v.email}.`;
    linhas.Contatos = porCabecalho(CAB.Contatos, {
      empresa: CONFIG.EMPRESA_LUVIADV, nome, tipo_pessoa: CONFIG.TIPO_PESSOA,
      'é_lead': 'Sim', 'é_cliente': 'Não', 'é_fornecedor': 'Não', 'é_parceiro': 'Não',
      email: v.email, telefone: v.whatsapp, responsavel: CONFIG.RESPONSAVEL, origem: CONFIG.ORIGEM_CONTATO,
      tags: CONFIG.TAGS_CONTATO, observacoes: obs,
    });
    linhas.Oportunidades = porCabecalho(CAB.Oportunidades, {
      contato_telefone: v.whatsapp, contato_nome: nome, titulo: `E-book: ${v.ebook}`,
      funil: CONFIG.FUNIL, etapa: CONFIG.ETAPA, status: 'aberta', responsavel: CONFIG.RESPONSAVEL,
      etiqueta: CONFIG.ETIQUETAS_OPORTUNIDADE, observacoes: obs,
      criado_em: data, etapa_desde: data, atualizado_em: data,
    });
  }
  return linhas;   // Contatos/Oportunidades sem as colunas de controle (o doPost acrescenta)
}

// "dd/MM/yyyy HH:mm[:ss]" → Date (para a limpeza)
function lerData(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(s || ''));
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}

// linhas (índice 0 = 1ª linha de dados) que devem ser apagadas
function linhasVencidas(aba, valores, agora, meses) {
  const limite = new Date(agora.getFullYear(), agora.getMonth() - meses, agora.getDate());
  const iData = aba === 'Downloads' ? 0 : CAB[aba].length;   // Downloads: data_hora; demais: _registrado_em
  const out = [];
  valores.forEach((l, i) => {
    const dt = lerData(l[iData]);
    if (!dt || dt >= limite) return;
    if (aba === 'Downloads' && l[CAB.Downloads.indexOf('newsletter')] === 'Sim') return;   // newsletter: até cancelar
    out.push(i);
  });
  return out;
}

/* =========================== Planilha (Apps Script) =========================== */

// Confere o passe anti-robô na Cloudflare. Sem chave configurada, RECUSA (falha fechada).
function captchaValido(token) {
  const segredo = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET');
  if (!segredo || !token || String(token).length > 2048) return false;
  const r = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'post', payload: { secret: segredo, response: String(token) }, muteHttpExceptions: true,
  });
  if (r.getResponseCode() !== 200) return false;
  return JSON.parse(r.getContentText()).success === true;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json({ ok: true, servico: 'cadastro de e-books MRA' });
}

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.site) return json({ ok: true });                    // campo-armadilha preenchido: robô (finge sucesso)
    const r = validar(d);
    if (!r.ok) return json(r);
    if (!captchaValido(d.captcha)) return json({ ok: false, erro: 'captcha' });
    // trava contra enxurrada (40 / 10 min): conta só envios que já passaram no anti-robô,
    // para que ninguém consiga esgotá-la mandando lixo direto ao endereço
    const cache = CacheService.getScriptCache();
    const fluxo = Number(cache.get('fluxo') || 0);
    if (fluxo >= 40) return json({ ok: false, erro: 'limite' });
    cache.put('fluxo', String(fluxo + 1), 600);
    const v = r.dados;
    const chave = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,
      [v.email, v.ebookId, v.contato, v.newsletter].join('|')));
    if (cache.get(chave)) return json({ ok: true });         // clique duplo / reenvio: não duplica linhas
    const agora = new Date();
    const linhas = montarLinhas(v, agora, (dt, p) => Utilities.formatDate(dt, CONFIG.FUSO, p));
    const registrado = Utilities.formatDate(agora, CONFIG.FUSO, 'dd/MM/yyyy HH:mm:ss');
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      // 1º as planilhas de importação (se falharem, o cadastro fica registrado aqui com o erro).
      // Quem já está nelas ou já foi enviado antes NÃO vai de novo (evita contato e oportunidade duplicados).
      let situacao = '';
      if (linhas.Contatos) {
        const onde = procurarPessoa({ tel: chaveTel(v.whatsapp), email: chaveEmail(v.email) });
        situacao = onde.length ? `Repetido — já estava em ${onde.join(' e ')}; não reenviado` : enviarListas(linhas);
      }
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      Object.keys(linhas).forEach(aba => {
        const l = aba === 'Downloads' ? linhas[aba] : linhas[aba].concat([registrado, situacao]);
        const sh = ss.getSheetByName(aba);
        sh.getRange(sh.getLastRow() + 1, 1, 1, l.length).setNumberFormat('@').setValues([l]);
      });
    } finally {
      lock.releaseLock();
    }
    cache.put(chave, '1', 600);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, erro: 'interno' });
  }
}

/** Rode UMA vez, pelo editor (Executar › configurar): cria as abas, o menu e a limpeza diária. */
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(CONFIG.FUSO);
  Object.keys(CAB).forEach(aba => {
    const cab = aba === 'Downloads' ? CAB[aba] : CAB[aba].concat(CONTROLE);
    const sh = ss.getSheetByName(aba) || ss.insertSheet(aba);
    sh.getRange(1, 1, sh.getMaxRows(), cab.length).setNumberFormat('@');   // tudo como texto: o LuviAdv recebe igual
    sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  ['Página1', 'Sheet1', 'Planilha1'].forEach(n => {
    const sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'limpar').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('limpar').timeBased().everyDays(1).atHour(3).create();
}

// 1ª aba da planilha de importação (Contatos_Leads ou CRM_Leads) e o seu cabeçalho
function abaDaLista(aba) {
  const id = PropertiesService.getScriptProperties().getProperty(LISTAS[aba]);
  if (!id) throw new Error(`falta a propriedade ${LISTAS[aba]}`);
  const sh = SpreadsheetApp.openById(id.trim()).getSheets()[0];
  if (sh.getLastColumn() < 1) throw new Error(`a planilha de ${aba} está sem cabeçalho`);
  return { sh, cab: sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] };
}

// onde a pessoa já está: no histórico desta planilha (só o que chegou às listas, "Sim") e em
// Contatos_Leads/CRM_Leads (inclusive leads de outras origens ainda não importados)
function procurarPessoa(pessoa) {
  const onde = [];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(LISTAS).forEach(aba => {
    const sh = ss.getSheetByName(aba);
    const n = CAB[aba].length;
    if (sh && sh.getLastRow() >= 2) {
      const vals = sh.getRange(1, 1, sh.getLastRow(), n + CONTROLE.length).getValues();
      if (achaPessoa(CAB[aba], vals.slice(1), pessoa, l => l[n + 1] === 'Sim')) onde.push(`histórico de ${aba}`);
    }
    try {
      const { sh: lista, cab } = abaDaLista(aba);
      if (lista.getLastRow() >= 2 &&
          achaPessoa(cab, lista.getRange(2, 1, lista.getLastRow() - 1, cab.length).getValues(), pessoa)) {
        onde.push(lista.getParent().getName());
      }
    } catch (e) { /* planilha indisponível: o enviarListas registra o erro */ }
  });
  return onde;
}

// grava a pessoa em Contatos_Leads e CRM_Leads; devolve "Sim" ou o erro (para a coluna de controle)
function enviarListas(linhas) {
  const erros = [];
  Object.keys(LISTAS).forEach(aba => {
    try {
      const { sh, cab } = abaDaLista(aba);
      const l = alinharPorCabecalho(cab, CAB[aba], linhas[aba]);
      sh.getRange(sh.getLastRow() + 1, 1, 1, l.length).setNumberFormat('@').setValues([l]);
    } catch (e) {
      console.error(aba, e);
      erros.push(`${aba}: ${e.message}`);
    }
  });
  return erros.length ? 'ERRO — copiar à mão. ' + erros.join('; ') : 'Sim';
}

/**
 * Rode pelo editor (Executar › conferirListas) depois de configurar CONTATOS_LEADS_ID e CRM_LEADS_ID:
 * pede a autorização para abrir as duas planilhas e confere os cabeçalhos, SEM gravar nada.
 */
function conferirListas() {
  Object.keys(LISTAS).forEach(aba => {
    const { sh, cab } = abaDaLista(aba);
    alinharPorCabecalho(cab, CAB[aba], CAB[aba]);
    const faltam = CAB[aba].filter(c => !cab.map(chaveCab).includes(chaveCab(c)));
    console.log(`${aba}: OK — "${sh.getParent().getName()}" › aba "${sh.getName()}"` +
      (faltam.length ? ` (colunas do modelo que não existem lá e ficarão de fora: ${faltam.join(', ')})` : ''));
  });
}

/** Roda todo dia (gatilho criado por configurar): aplica o prazo de guarda e apaga arquivos temporários
 *  que sobraram da exportação antiga (menu MRA, já removido). */
function limpar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const agora = new Date();
  Object.keys(CAB).forEach(aba => {
    const sh = ss.getSheetByName(aba);
    if (!sh || sh.getLastRow() < 2) return;
    const largura = aba === 'Downloads' ? CAB[aba].length : CAB[aba].length + CONTROLE.length;
    const valores = sh.getRange(2, 1, sh.getLastRow() - 1, largura).getValues();
    linhasVencidas(aba, valores, agora, CONFIG.MESES_GUARDA).reverse().forEach(i => sh.deleteRow(i + 2));
  });
  const props = PropertiesService.getScriptProperties();
  const temp = JSON.parse(props.getProperty('temporarios') || '[]');
  const ficam = temp.filter(t => {
    if (Date.now() - t.em < 2 * 864e5) return true;
    try { DriveApp.getFileById(t.id).setTrashed(true); } catch (e) { /* já apagado */ }
    return false;
  });
  props.setProperty('temporarios', JSON.stringify(ficam));
}
