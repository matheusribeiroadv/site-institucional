# Site — Matheus Ribeiro Advogados

Site institucional do escritório (Direito Bancário do Agronegócio), no ar em
**https://matheusribeiroadv.com.br**.

É um site **estático** (HTML, CSS e JavaScript puros, sem etapa de build), hospedado na
**Netlify**, que publica automaticamente cada push na branch `main` deste repositório.

---

## Estrutura de pastas

```
├─ public/                    ← TUDO o que vai para o site (a Netlify publica só esta pasta)
│  ├─ index.html              página inicial
│  ├─ privacidade.html        Política de Privacidade (LGPD)
│  ├─ 404.html                página de "não encontrado"
│  ├─ blog/                   lista de artigos (index.html) e um .html por artigo
│  ├─ assets/
│  │  ├─ css/main.css         estilos do site inteiro
│  │  ├─ css/article.css      páginas de leitura (blog, artigos, privacidade) e cartões do blog
│  │  ├─ js/main.js           interações da página inicial (menu, formulário, carrossel…)
│  │  ├─ js/pages.js          interações das páginas internas (menu, ano no rodapé)
│  │  ├─ js/transicoes.js     transição entre páginas e o logo que se desenha (no <head> de todas as páginas, menos a 404)
│  │  ├─ js/ebook.js          cadastro da página do guia em PDF (libera o download)
│  │  ├─ docs/                guias em PDF (e-books) — fora do Google; o acesso é pelo cadastro
│  │  ├─ img/marca/           logo MRA, favicons e imagem de compartilhamento (og-image-mra.jpg)
│  │  ├─ img/site/            fotos da página inicial (topo, escritório)
│  │  ├─ img/equipe/          fotos da equipe (um arquivo por pessoa)
│  │  ├─ img/blog/            capas dos artigos
│  │  └─ vendor/              bibliotecas de terceiros (anime.js — animações de rolagem)
│  ├─ _redirects              redirecionamentos (www, /avaliar, favicon, endereços antigos)
│  ├─ robots.txt · sitemap.xml
├─ tools/preview.js           servidor da prévia local
├─ tools/apps-script/         script da planilha de cadastros dos e-books (roda no Google, não no site)
├─ netlify.toml               configuração da Netlify (pasta publicada, cache, segurança)
├─ package.json               atalho "npm run preview"
├─ imagens/                   (só no computador) fotos originais e logos em alta
└─ drafts/                    (só no computador) rascunhos de artigos
```

`imagens/` e `drafts/` estão no `.gitignore`: **nunca** vão para o GitHub nem para o site.

---

## Prévia local

Requer [Node.js](https://nodejs.org) instalado.

```
npm run preview
```

Abra **http://localhost:8080**. O terminal também mostra um endereço para abrir no
**celular** (mesma rede Wi-Fi). Se o celular não abrir, o firewall do Windows pode estar
bloqueando o Node.js.

---

## Como publicar

1. No **GitHub Desktop**, revise as alterações, escreva um resumo e clique em **Commit to main**.
2. Clique em **Push origin**. A Netlify publica em ~30 segundos.

**Créditos da Netlify (plano gratuito):** 300 créditos por mês, e cada publicação custa 15.
O que conta é cada **push**, não cada commit: junte várias mudanças e faça um push só.
Se os créditos acabarem, a Netlify **pausa o site** até o mês renovar. O saldo fica em
Netlify → equipe → *Usage & billing*.

**Desfazer uma publicação:** Netlify → *Deploys* → escolha o deploy anterior → **Publish deploy**.

---

## Tarefas comuns

### Publicar um novo artigo
1. Duplique um artigo existente em `public/blog/` e dê um nome descritivo ao arquivo
   (ex.: `banco-penhora-terra-produtor-rural.html`). O endereço da página é esse nome
   **sem o `.html`** (ex.: `/blog/banco-penhora-terra-produtor-rural`).
2. No novo arquivo, atualize: `<title>`, `meta description`, `canonical`, as tags `og:*`,
   o JSON-LD (`headline`, `description`, `datePublished`, `@id`), a data visível e o texto.
   Mantenha o `<article data-toc>`: o índice lateral "Nesta página" é montado sozinho a partir
   dos títulos `<h2>` do texto (aparece com 3 ou mais seções, em telas a partir de 1200px).
3. Capa: coloque a imagem em `public/assets/img/blog/` (WebP, ~1200px de largura).
4. Em `public/blog/index.html`:
   - o artigo novo entra na placa de destaque (`.post-destaque`): troque link, capa, categoria, título, resumo e data;
   - o artigo que estava em destaque desce para "Artigos anteriores": duplique o modelo `.post-linha`
     (o mais novo fica em cima);
   - no topo, atualize o índice: o total em `.blog-total` e a contagem de cada tema (um tema novo vira um `<li>`).
5. Atualize a placa do bloco "Do nosso Blog" em `public/index.html` (mesma estrutura do destaque, com `<h3>`).
6. Inclua o endereço em `public/sitemap.xml`, com `<lastmod>` (data de publicação), e
   atualize o `<lastmod>` da linha do `/blog/` para a mesma data.
7. Revise o texto com as **regras de conteúdo** abaixo antes de publicar.
8. Depois do deploy, no Search Console: cole o endereço do artigo em **Inspeção de URL** e
   clique em **Solicitar indexação**. Faça o mesmo com `/blog/`.

**Capa "viajando":** ao clicar num card do blog, a imagem cresce até virar a capa do artigo (e volta no "voltar").
Não há passo extra: o par é achado sozinho, desde que o card tenha a `<img>` **dentro** do link para o artigo
e a capa do artigo mantenha `class="article-cover"` (como nos modelos atuais).

**Um endereço só por página:** use o endereço **sem `.html`** em todo lugar (canonical,
`og:url`, JSON-LD, sitemap e links internos), em minúsculas e com hífens. O arquivo
continua sendo `.html`; só o endereço é que não leva a extensão.

**Tabelas nos artigos:** no celular (até 560px) cada linha da tabela vira um bloco, e cada `<td>` precisa de
`data-label="Nome da coluna"` (é o rótulo que aparece em cima do valor). Exemplo em `blog/mp-1376-renegociacao-dividas-rurais.html`.

### Trocar uma imagem
Use sempre um **nome de arquivo novo** (ex.: `og-image-2027.jpg`) e atualize as referências.
As imagens ficam guardadas no navegador dos visitantes por 30 dias. Com o mesmo nome,
quem já visitou o site pode continuar vendo a antiga.

Algumas imagens têm **versões por tamanho de tela** (para o site abrir rápido no celular).
Ao trocar, gere todas:
| Imagem | Arquivos | Onde é referenciada |
|---|---|---|
| Foto do topo (fachada) | `site/hero-fachada.webp` (2400px, **com** a placa MRA; computador, texto centralizado), `hero-fachada-sem-placa.webp` (2200px; tablet e telas estreitas/altas, texto à esquerda) e `hero-fachada-mobile.webp` (foto vertical sem a placa, 619×1500) | `main.css` (`.hero-bg` e a media query `(min-width:1025px) and (min-aspect-ratio:5/4)`) e os 3 `preload` no `<head>` do `index.html` |
| Foto de Nossa Essência (escritório completo) | `site/escritorio/essencia-recepcao-1800.webp` e `-900.webp` | `srcset` no `index.html` (`.ess-foto`) |
| Percurso "Nosso espaço" | `site/escritorio/percurso-<parada>-1600.webp` e `-900.webp` (fachada, recepcao, espera) | `index.html` (`.slide`, com `data-full` = foto de 1600 para a tela cheia) |
| Fachada do Contato | `site/escritorio/fachada-frente.webp` (900px) | `index.html` (`.contato-local`) |
| Textura das placas de bronze | `site/textura-grao.webp` (riscos de metal escovado) e `site/textura-patina.webp` (manchas) | variáveis `--plate-grain` e `--plate-patina` no `main.css` (cards, Nossa Essência, contato, blog, menu do celular, rodapé). São imagens prontas de propósito: a versão anterior, gerada pelo navegador (SVG com filtro de ruído), travava a rolagem no celular |

**Incluir uma parada no percurso "Nosso espaço"** (ex.: uma foto nova do escritório):
1. Gere a foto em 1600px e 900px de largura (`percurso-<nome>-1600.webp` / `-900.webp`) em `site/escritorio/`.
2. No `index.html`, dentro de `#espaco`: um `<li>` com o botão da parada em `.paradas`, um `<figure class="slide">`
   no `.palco` (copie um existente e troque foto, título e legenda) e um botão em `.pontos`.
3. Atualize o `--n` do `<div class="tour" ...>` (número de paradas) e os números "01 / 03" do contador.
   O resto (fio de progresso, tela cheia, celular) se ajusta sozinho.
| Imagem de compartilhamento (WhatsApp/redes) | `marca/og-image-mra.jpg` (1200×630) | `og:image` de cada página e JSON-LD |
| Logo | `marca/mra-monograma.svg` (vetor: MRA + barra, degradê cobre) no rodapé; no cabeçalho e na 404 o mesmo desenho vai **embutido no HTML** (`<svg class="brand-mark">` / `class="err-mark"`), para poder ser animado; `marca/logo-mra.png` (o mesmo monograma em PNG) só nos dados estruturados | rodapé: tag `<img>`; cabeçalho: as 8 páginas e a 404 (ver "Logo que se desenha" abaixo); JSON-LD |
| Ícones | `marca/favicon-mra.svg` (aba do navegador: letras MRA sem fundo, pretas no tema claro e champanhe no escuro), `favicon-mra-32.png` e `-48.png` (pretas sem fundo: Safari, Google e `/favicon.ico`), `favicon-mra-180.png` (iPhone: MRA no bronze, porque o iPhone pinta de preto o fundo transparente); há também `favicon-mra-512.png` (MRA no bronze, para redes e Perfil da Empresa) | `<head>` de cada página e `_redirects` |
| Árvore da marca | `marca/arvore-mra.webp` (760px, cobre de uma cor só) e `arvore-mra-400.webp` (400px) | a de 760px fica atrás da missão (`.missao-arvore`); a de 400px aparece no canto dos cards de área ao passar o mouse (`.area-card::after` no `main.css`) |

Os originais ficam em `imagens/escritorio-mra-2026-11/`, só no computador: fotos do escritório (sem compressão),
`00-logo-mra-cobre-vetor.svg` (vetor da gráfica), `00-arvore-mra.png` e `00-logo-mra-png.png` (versão antiga, não usar).

Sobre a logo:
- O desenho certo é o do **vetor da gráfica** (`MRA_arquivos_grafica`), igual ao letreiro da fachada: traço grosso, R aberto à esquerda, A em ponta.
- O PNG enviado em 06/11 é um redesenho diferente (traço fino, R fechado).
- No site vai só o monograma (MRA + barra), sem a linha de baixo, porque:
  - o vetor diz "ADVOGADOS **E** ASSOCIADOS", e o nome oficial e o letreiro usam "**&**";
  - no cabeçalho essa linha ficaria com ~3px de altura.
- O nome completo está no `alt` das imagens (e no `aria-label` do logo embutido).
- Cor: o degradê do PDF CMYK da gráfica (#E2AB77 → #C6884E → #A36C39 → #CC925B, na diagonal).

### Logo que se desenha e transição entre páginas
- **Logo:** na primeira página aberta em cada aba, o contorno do M, R, A e da barra é traçado e o cobre preenche
  no fim (~2,5s); nas páginas seguintes ele já aparece pronto. Na 404 o logo grande se desenha sempre.
  Cada letra é um `<path pathLength="1">` dentro do `<svg>` embutido. **Se o logo mudar**, troque o SVG
  embutido nas 8 páginas com cabeçalho e na 404 (mantendo um `<path>` por letra + a barra) e o arquivo do rodapé.
- **Transição:** ao trocar de página, ela esmaece rápido; cabeçalho e botão do WhatsApp ficam parados, e a capa
  do artigo "viaja" desde o card. Funciona no Chrome, Edge e Safari recentes; no Firefox a página abre como sempre.
- Quem ativou "reduzir movimento"/"efeitos de animação desligados" no aparelho não vê nenhum dos dois (de propósito).
- Código: `assets/js/transicoes.js` e os blocos "Monograma se desenhando" e "Transição entre páginas" do `main.css`.
  Cuidado: cada `view-transition-name` só pode existir **uma vez por página**, senão o navegador cancela a transição.

### Equipe
- Fotos em `public/assets/img/equipe/<nome>.webp`, com cartões em `public/index.html` (seção "Quem Somos").
- **Ocultar alguém temporariamente:** envolva o `<li>` da pessoa em um comentário HTML, com
  linhas de início e fim bem visíveis (veja o exemplo "CARD OCULTO TEMPORARIAMENTE" no
  `index.html`). Não use `hidden`: o carrossel continuaria passando pelo card escondido.

### E-book e cadastro (guia em PDF)
Página: `public/guia-renegociacao-dividas-rurais.html` · PDF: `public/assets/docs/guia-renegociacao-dividas-rurais.pdf`.
Para baixar, a pessoa informa nome e e-mail e marca a caixa obrigatória. Há duas caixas opcionais: receber artigos
por e-mail e "falar com a equipe" (que pede o WhatsApp). Os dados vão para uma **planilha do Google** do escritório,
que tem três abas:

| Aba | Quem entra | Para quê |
|---|---|---|
| Downloads | todo mundo | prova do consentimento (data, hora, texto exato das caixas) e lista da newsletter |
| Contatos | só quem pediu contato | histórico, no formato do modelo de contatos do LuviAdv |
| Oportunidades | só quem pediu contato | histórico, no formato do modelo de oportunidades do LuviAdv (`FUNIL EVERTON COMERCIAL` › `NOVA LEAD`) |

Quem pediu contato vai **também** para as planilhas de importação do escritório, que são arquivos separados
(o LuviAdv importa uma planilha por arquivo): **Contatos_Leads** e **CRM_Leads**. O script grava na 1ª aba de
cada uma, casando as colunas **pelo nome do cabeçalho** (a ordem não importa). Se uma delas falhar, o cadastro
continua registrado aqui e a coluna `_na_planilha_luviadv` mostra o erro: copie a linha à mão.
Nomes de pessoas são gravados em **caixa alta, sem acento e sem caractere especial** ("João D'Ávila" → "JOAO D AVILA").

**Duplicidade:** antes de enviar, o script procura a pessoa pelo **WhatsApp** (DDD + 8 últimos dígitos, então
com ou sem o 9 e com ou sem +55 dá no mesmo) **ou pelo e-mail**. Ele procura em Contatos_Leads e CRM_Leads
(inclusive leads de outras origens ainda não importados) e no histórico desta planilha (abas Contatos e
Oportunidades, só as linhas com "Sim"). Se achar, não reenvia, e `_na_planilha_luviadv` fica "Repetido — já
estava em …". A aba Downloads registra **todo** cadastro, inclusive repetido, porque cada um é uma prova de
consentimento. O histórico vale pelo prazo de guarda (12 meses): quem voltar depois disso é enviado de novo.

**Regra da OAB:** quem **só baixou** não vai para o funil e **não recebe contato da equipe**, nem oferta de
serviço (Provimento 205, Anexo Único). Só quem marcou "falar com a equipe" pode ser procurado.

**Anti-robô (Cloudflare Turnstile):** cada cadastro precisa de um "passe" da Cloudflare, conferido pelo script da
planilha. Sem passe válido, o cadastro é recusado, inclusive quando alguém envia direto ao endereço do script, sem
passar pela página. Para o visitante, a verificação quase sempre é invisível. Ela só carrega quando a pessoa começa
a preencher o formulário.

**Criar as chaves do anti-robô** (uma vez; é gratuito):
1. Crie uma conta em dash.cloudflare.com, com o e-mail do escritório.
2. No menu, abra **Turnstile › Add widget**. Em nome, use "Site MRA — e-books".
3. Em **Hostnames**, inclua `matheusribeiroadv.com.br`. Se o domínio mudar, inclua também o novo.
4. Em **Widget mode**, escolha **Managed**. Clique em **Create**.
5. Copie a **Site Key** (pública): ela vai em `data-turnstile="…"` no `<form id="ebookForm">` da página do guia.
6. Copie a **Secret Key** (secreta): ela vai **só** no Apps Script (passo 4 abaixo). Nunca coloque no código nem
   no GitHub, porque o repositório é público.

**Instalar a planilha** (uma vez, na conta Google do escritório; uns 10 minutos):
1. Em drive.google.com: **Novo › Planilhas Google**. Dê o nome "Cadastros do site — e-books".
2. Na planilha: **Extensões › Apps Script**. Apague o conteúdo e cole todo o arquivo `tools/apps-script/ebook-cadastro.gs`.
3. No topo do código, confira `EMPRESA_LUVIADV: 'MRA ADVOGADOS E ASSOCIADOS'`. Tem de ser o nome **exato** da empresa cadastrada
   no LuviAdv (o modelo de contatos exige). Salve (ícone de disquete).
4. No editor, abra a engrenagem **Configurações do projeto**. Em **Propriedades do script**, clique em
   **Adicionar propriedade**. Em Propriedade, escreva `TURNSTILE_SECRET`. Em Valor, cole a Secret Key da Cloudflare.
   Salve. Sem ela, o script recusa todos os cadastros.
   Adicione também `CONTATOS_LEADS_ID` e `CRM_LEADS_ID`: o código de cada planilha de importação, que é o trecho
   do endereço dela entre `/d/` e `/edit`.
5. Na barra de cima, escolha a função `configurar` e clique em **Executar**. Autorize com a conta do escritório.
   Se aparecer "o Google não verificou este app", clique em **Avançado › Acessar**: o app é o próprio script.
   A permissão de "conectar a serviço externo" é para conferir o passe na Cloudflare.
   Depois, execute `conferirListas`: ela pede a permissão para abrir Contatos_Leads e CRM_Leads e confere os
   cabeçalhos, sem gravar nada. O resultado aparece no **Registro de execução**: "Contatos: OK" e "Oportunidades: OK".
6. **Implantar › Nova implantação**. Em tipo, escolha **App da Web**. Executar como: **Eu**. Quem pode acessar:
   **Qualquer pessoa**. Clique em **Implantar** e copie o endereço que termina em `/exec`.
   "Qualquer pessoa" é necessário: quem envia é o navegador do visitante. O endereço só **recebe** cadastros; não
   dá para ler a planilha por ele.
7. Cole esse endereço em `data-endpoint="…"` no `<form id="ebookForm">` da página do guia.
8. Teste: abra o endereço `/exec` no navegador (deve aparecer `{"ok":true,…}`). Depois faça um cadastro na
   prévia local (`npm run preview`) e confira a linha na planilha. Apague as linhas de teste. Na prévia, o endereço
   é `localhost`: para testar com as chaves reais, inclua `localhost` nos Hostnames do Turnstile e retire depois.
9. Compartilhe a planilha **só** com quem precisa, nunca com "qualquer pessoa com o link".

Se o código do script mudar: cole a versão nova e salve. Depois vá em **Implantar › Gerenciar implantações** e
clique no lápis. Em Versão, escolha **Nova versão** e clique em Implantar. O endereço `/exec` continua o mesmo.

**Importar no LuviAdv** (do jeito que o escritório já faz):
1. Abra **Contatos_Leads** › **Arquivo › Fazer download › Microsoft Excel (.xlsx)** › importe no LuviAdv como **contatos**.
2. Depois, **CRM_Leads** › mesmo caminho › importe como **oportunidades**. O LuviAdv exige que o contato já
   exista; o vínculo entre os dois é o telefone.

Se mudar o cabeçalho ou trocar uma dessas planilhas, atualize a propriedade e rode `conferirListas` de novo.

**Guarda e cancelamento (LGPD):**
- Todo dia, de madrugada, a planilha apaga quem **só baixou** há mais de 12 meses. Quem assinou a newsletter
  fica até cancelar.
- Pedido de cancelamento ou exclusão (pelo e-mail do escritório): apague as linhas da pessoa nas três abas, em
  Contatos_Leads e CRM_Leads e, se for o caso, no LuviAdv.

**Textos das caixas = prova do consentimento:** a página e o script (`TEXTOS.v1`) precisam ter o **mesmo** texto.
Para mudar um texto:
1. Crie `v2` em `TEXTOS` no script.
2. Troque `data-textos="v1"` por `"v2"` na página.
3. Reimplante o script.

Quando a Política de Privacidade mudar, atualize também `POLITICA` no script.

**Antes de publicar a página do guia:**
1. Aprovação do Dr. Matheus para o e-book e para a nova versão da Política de Privacidade. Publique as duas juntas.
2. Planilha instalada, com `data-endpoint` e `data-turnstile` preenchidos na página e `TURNSTILE_SECRET` no script.
   Sem o endereço, a página avisa que o cadastro não está configurado.
3. Retire a linha `<meta name="robots" content="noindex" />` da página e inclua o endereço
   `/guia-renegociacao-dividas-rurais` no `sitemap.xml`.
4. Crie links para a página: no fim do artigo da MP 1.376 e no blog.

**Atualizar o e-book** (por exemplo, quando a lei for sancionada):
1. Troque o PDF em `assets/docs/` **com o mesmo nome**. A pasta não tem cache longo, então os visitantes recebem
   a versão nova logo.
2. Atualize a data na página do guia ("Atualizado em…") e no aviso final.

### Onde ficam os dados que mudam
| O quê | Onde |
|---|---|
| WhatsApp / telefone ((62) 98225-4519) | links `wa.me/556282254519` (sem o 9, como o WhatsApp registrou o número) em `public/index.html`, `public/blog/index.html`, em cada artigo e página de área, no rodapé e no menu do celular de todas as páginas; escrito **com o 9** no rodapé ("WhatsApp (62) 98225-4519") e no JSON-LD do `index.html`, igual ao Perfil da Empresa no Google |
| Horário de atendimento (seg. a sex., 08:00 às 18:00) | rodapé (coluna "Contato") e menu do celular (`.nav-contato`) de cada página, e JSON-LD (`openingHoursSpecification`) do `index.html`. Ao mudar, atualize também o Perfil da Empresa no Google |
| Link de avaliação do Google | `public/_redirects` (linha `/avaliar`) |
| Chave do formulário (Web3Forms) | `public/assets/js/main.js` (`apiKey`, em base64) |
| Endereço da planilha de cadastros do e-book | `data-endpoint` do `<form id="ebookForm">` em `public/guia-renegociacao-dividas-rurais.html` (ver "E-book e cadastro") |
| Analytics (Umami) | `<script … data-website-id>` no `<head>` de cada página |
| Razão social, CNPJ, registro na OAB | rodapé de cada página, `privacidade.html` e JSON-LD do `index.html` |
| Endereço do escritório | rodapé e menu do celular de cada página, `privacidade.html` (seção 1) e JSON-LD (`address`) em `index.html` e `blog/index.html`. Ao mudar, atualize também a data da Política de Privacidade e o Perfil da Empresa no Google, com o endereço escrito igual |

---

## Regras de conteúdo (OAB e LGPD)

Base: Provimento 205/2021 e Código de Ética e Disciplina da OAB, mais a LGPD.

- **Nada de gratuidade** ("análise gratuita", "grátis") nem menção a preços ou honorários.
- **Nada de promessa de resultado.** Prefira "em busca de", "buscando", "alternativas jurídicas".
- **Nada de superlativos ou comparações** ("o melhor", "líder", "referência").
- **Sem depoimentos, casos concretos, números de resultados ou avaliações** no site.
- **"Especialista":** só para quem tem título de especialista. Hoje, apenas o Dr. Matheus.
- **Identificação obrigatória:** nome, registro OAB e CNPJ do escritório (rodapé) e a OAB de cada advogado.
- **Novo dado no formulário?** Atualize a Política de Privacidade e a data de "Última atualização".

---

## Configuração (referência)

- **`netlify.toml`:** pasta publicada (`public`), cache de 30 dias para imagens e bibliotecas,
  cabeçalhos de segurança. CSS, JS e HTML sempre atualizados a cada visita.
- **Endereços sem `.html`:** o "Pretty URLs" da Netlify (ligado por padrão, não desligar)
  serve `blog/artigo.html` em `/blog/artigo`. A prévia local (`tools/preview.js`) faz o mesmo.
- **`public/_redirects`:** www → sem www; `/avaliar` (301, para não ser indexado); `/favicon.ico`; endereços antigos de
  imagens (antes da reorganização de 14/10/2026) → novos.
- **Domínio:** registrado no Registro.br. Os registros de e-mail (Microsoft 365) na zona DNS
  não devem ser alterados.
- **Ícones dos cards de área:** [Phosphor Icons](https://phosphoricons.com), estilo duotone, licença MIT
  (Copyright (c) 2023 Phosphor Icons — uso livre, inclusive comercial, mantendo este aviso).
  Os SVGs estão colados no `index.html`; a camada de preenchimento tem `class="ic-fill"` (o CSS anima no hover).
  Para trocar um ícone: baixe o SVG duotone em phosphoricons.com e troque `opacity="0.2"` por `class="ic-fill"`.
