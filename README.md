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
│  │  ├─ img/marca/           logo (shield.png), favicon e imagem de compartilhamento (og-image.jpg)
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
   (ex.: `banco-penhora-terra-produtor-rural.html`). Esse nome vira o endereço da página.
2. No novo arquivo, atualize: `<title>`, `meta description`, `canonical`, as tags `og:*`,
   o JSON-LD (`headline`, `description`, `datePublished`, `@id`), a data visível e o texto.
3. Capa: coloque a imagem em `public/assets/img/blog/` (WebP, ~1200px de largura).
4. Adicione o cartão do artigo em `public/blog/index.html`.
5. Atualize o bloco "Do nosso Blog" em `public/index.html`.
6. Inclua o endereço em `public/sitemap.xml`, com `<lastmod>`.
7. Revise o texto com as **regras de conteúdo** abaixo antes de publicar.

### Trocar uma imagem
Use sempre um **nome de arquivo novo** (ex.: `og-image-2027.jpg`) e atualize as referências.
As imagens ficam guardadas no navegador dos visitantes por 30 dias. Com o mesmo nome,
quem já visitou o site pode continuar vendo a antiga.

### Equipe
- Fotos em `public/assets/img/equipe/<nome>.webp`, com cartões em `public/index.html` (seção "Quem Somos").
- **Ocultar alguém temporariamente:** envolva o `<li>` da pessoa em um comentário HTML, com
  linhas de início e fim bem visíveis (veja o exemplo "CARD OCULTO TEMPORARIAMENTE" no
  `index.html`). Não use `hidden`: o carrossel continuaria passando pelo card escondido.

### Onde ficam os dados que mudam
| O quê | Onde |
|---|---|
| WhatsApp (55 62 8225-4519) | links `wa.me/556282254519` em `public/index.html` (4×), `public/blog/index.html` e em cada artigo; telefone no JSON-LD do `index.html` |
| Link de avaliação do Google | `public/_redirects` (linha `/avaliar`) |
| Chave do formulário (Web3Forms) | `public/assets/js/main.js` (`apiKey`, em base64) |
| Analytics (Umami) | `<script … data-website-id>` no `<head>` de cada página |
| Razão social, CNPJ, registro na OAB | rodapé de cada página, `privacidade.html` e JSON-LD do `index.html` |

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
- **`public/_redirects`:** www → sem www; `/avaliar`; `/favicon.ico`; endereços antigos de
  imagens (antes da reorganização de 14/10/2026) → novos.
- **Domínio:** registrado no Registro.br. Os registros de e-mail (Microsoft 365) na zona DNS
  não devem ser alterados.
