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
│  │  ├─ img/marca/           logo MRA, favicons e imagem de compartilhamento (og-image-mra.jpg)
│  │  ├─ img/site/            fotos da página inicial (topo, escritório)
│  │  ├─ img/equipe/          fotos da equipe (um arquivo por pessoa)
│  │  ├─ img/blog/            capas dos artigos
│  │  └─ vendor/              bibliotecas de terceiros (anime.js — animações de rolagem)
│  ├─ _redirects              redirecionamentos (www, /avaliar, favicon, endereços antigos)
│  ├─ robots.txt · sitemap.xml
├─ tools/preview.js           servidor da prévia local
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

### Onde ficam os dados que mudam
| O quê | Onde |
|---|---|
| WhatsApp / telefone ((62) 98225-4519) | links `wa.me/556282254519` (sem o 9, como o WhatsApp registrou o número) em `public/index.html`, `public/blog/index.html`, em cada artigo e página de área, no rodapé e no menu do celular de todas as páginas; escrito **com o 9** no rodapé ("WhatsApp (62) 98225-4519") e no JSON-LD do `index.html`, igual ao Perfil da Empresa no Google |
| Horário de atendimento (seg. a sex., 08:00 às 18:00) | rodapé (coluna "Contato") e menu do celular (`.nav-contato`) de cada página, e JSON-LD (`openingHoursSpecification`) do `index.html`. Ao mudar, atualize também o Perfil da Empresa no Google |
| Link de avaliação do Google | `public/_redirects` (linha `/avaliar`) |
| Chave do formulário (Web3Forms) | `public/assets/js/main.js` (`apiKey`, em base64) |
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
