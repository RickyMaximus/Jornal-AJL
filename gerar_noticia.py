import os
import re
from docx import Document
from bs4 import BeautifulSoup

PASTA_PAGES = "./frontend/pages"
TEMPLATE_ARQUIVO = os.path.join(PASTA_PAGES, "template.html")
INDEX_ARQUIVO = "./frontend/index.html"
TODAS_ARQUIVO = os.path.join(PASTA_PAGES, "todas-noticias.html")

def slugify(titulo):
    return re.sub(r'[^a-z0-9-]+', '-', titulo.lower()).strip('-')

def ler_docx(caminho):
    doc = Document(caminho)
    paragrafos = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    titulo = paragrafos[0]
    conteudo = "\n".join(f"<p>{p}</p>" for p in paragrafos[1:])
    return titulo, conteudo

def criar_html(titulo, conteudo, nome_arquivo):
    with open(TEMPLATE_ARQUIVO, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    titulo_tag = soup.find("h1", {"class": "article-title"})
    if titulo_tag:
        titulo_tag.string = titulo

    corpo = soup.find("section", {"class": "article-body"})
    if corpo:
        corpo.clear()
        corpo.append(BeautifulSoup(conteudo, "html.parser"))

    novo_caminho = os.path.join(PASTA_PAGES, nome_arquivo)
    with open(novo_caminho, "w", encoding="utf-8") as f:
        f.write(soup.prettify())
    print(f"✅ Notícia criada em: {novo_caminho}")

def gerar_card(titulo, nome_arquivo):
    return f"""
<article class="card">
  <a class="thumb" href="./pages/{nome_arquivo}">
    <img alt="Imagem da notícia" src="./IMG/default.jpg"/>
  </a>
  <div class="body">
    <h3><a href="./pages/{nome_arquivo}">{titulo}</a></h3>
    <p></p>
    <div class="meta">
      <span>Escrito por <strong></strong></span>
      <a class="btn" href="./pages/{nome_arquivo}">Ler mais</a>
    </div>
  </div>
</article>
""".strip()

def atualizar_paginas(nome_arquivo, titulo):
    card_html = gerar_card(titulo, nome_arquivo)

    # --- Atualiza INDEX (nova notícia no topo) ---
    if os.path.exists(INDEX_ARQUIVO):
        with open(INDEX_ARQUIVO, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f, "html.parser")

        secao = soup.find("section", {"class": "cards"})
        if secao:
            novo_card = BeautifulSoup(card_html, "html.parser")
            cards = secao.find_all("article", class_="card")
            secao.insert(0, novo_card)  # adiciona no topo

            if len(cards) >= 6:
                cards[-1].decompose()  # remove o último card

        with open(INDEX_ARQUIVO, "w", encoding="utf-8") as f:
            f.write(soup.prettify())
        print("🏠 index.html atualizado!")

    # --- Atualiza TODAS-NOTICIAS (nova no final) ---
    if os.path.exists(TODAS_ARQUIVO):
        with open(TODAS_ARQUIVO, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f, "html.parser")

        secao = soup.find("section", {"class": "cards"})
        if secao:
            novo_card = BeautifulSoup(card_html, "html.parser")
            secao.append(novo_card)  # adiciona no final

        with open(TODAS_ARQUIVO, "w", encoding="utf-8") as f:
            f.write(soup.prettify())
        print("📰 todas-noticias.html atualizado!")

def main():
    caminho_docx = input("Arraste aqui o arquivo .docx da notícia e aperte Enter: ").strip()
    caminho_docx = caminho_docx.strip('"').strip("'")
    if caminho_docx.startswith("& "):
        caminho_docx = caminho_docx[2:].strip()
    caminho_docx = caminho_docx.replace("& ", "").replace("'", "").replace('"', "").strip()

    if not os.path.exists(caminho_docx):
        print(f"❌ Arquivo não encontrado: {caminho_docx}")
        return

    titulo, conteudo = ler_docx(caminho_docx)
    nome_arquivo = f"{slugify(titulo)}.html"
    criar_html(titulo, conteudo, nome_arquivo)
    atualizar_paginas(nome_arquivo, titulo)
    print("✨ Processo concluído! Abra o arquivo no VSCode para revisar.")

if __name__ == "__main__":
    main()
