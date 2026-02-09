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

def ler_texto_manual():
    print("\n✍️ Cole o texto completo da notícia abaixo.")
    print("A primeira linha deve ser o título. Quando terminar, digite uma linha com apenas FIM e aperte Enter.\n")

    linhas = []
    while True:
        linha = input()
        if linha.strip().upper() == "FIM":
            break
        linhas.append(linha.strip())

    if not linhas:
        print("❌ Nenhum texto foi inserido.")
        return None, None

    titulo = linhas[0]
    conteudo = "\n".join(f"<p>{p}</p>" for p in linhas[1:])
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

        # Adiciona o crédito no final
        autor_html = BeautifulSoup(
            '<p>Matéria por ✍️ <a href="https://instagram.com/Dino_raaaawr" target="_blank" rel="noopener">@Dino_raaaawr</a></p>',
            "html.parser"
        )
        corpo.append(autor_html)

    novo_caminho = os.path.join(PASTA_PAGES, nome_arquivo)
    with open(novo_caminho, "w", encoding="utf-8") as f:
        f.write(soup.encode(formatter='minimal').decode('utf-8'))

    print(f"✅ Notícia criada em: {novo_caminho}")

def gerar_card(titulo, nome_arquivo, todas=False):
    href = f"./pages/{nome_arquivo}" if not todas else f"../pages/{nome_arquivo}"
    img = f"./IMG/default.jpg" if not todas else f"../IMG/default.jpg"
    return f"""
<article class="card">
  <a class="thumb" href="{href}">
    <img alt="Imagem da notícia" src="{img}"/>
  </a>
  <div class="body">
    <h3><a href="{href}">{titulo}</a></h3>
    <p></p>
    <div class="meta">
      <span>Escrito por <strong></strong></span>
      <a class="btn" href="{href}">Ler mais</a>
    </div>
  </div>
</article>
""".strip()

def atualizar_paginas(nome_arquivo, titulo):
    card_html_index = gerar_card(titulo, nome_arquivo, todas=False)
    card_html_todas = gerar_card(titulo, nome_arquivo, todas=True)

    # --- Atualiza INDEX (nova notícia no topo) ---
    if os.path.exists(INDEX_ARQUIVO):
        with open(INDEX_ARQUIVO, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f, "html.parser")

        secao = soup.find("section", {"class": "cards"})
        if secao:
            novo_card = BeautifulSoup(card_html_index, "html.parser")
            cards = secao.find_all("article", class_="card")
            secao.insert(0, novo_card)

            if len(cards) >= 6:
                cards[-1].decompose()

        with open(INDEX_ARQUIVO, "w", encoding="utf-8") as f:
            f.write(soup.encode(formatter='minimal').decode('utf-8'))
        print("🏠 index.html atualizado!")

    # --- Atualiza TODAS-NOTICIAS (nova no final) ---
    if os.path.exists(TODAS_ARQUIVO):
        with open(TODAS_ARQUIVO, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f, "html.parser")

        secao = soup.find("section", {"class": "cards"})
        if secao:
            novo_card = BeautifulSoup(card_html_todas, "html.parser")
            secao.append(novo_card)

        with open(TODAS_ARQUIVO, "w", encoding="utf-8") as f:
            f.write(soup.encode(formatter='minimal').decode('utf-8'))
        print("📰 todas-noticias.html atualizado!")

def main():
    caminho_docx = input("Arraste o arquivo .docx ou pressione Enter para colar o texto manualmente: ").strip()
    caminho_docx = caminho_docx.strip('"').strip("'")

    titulo, conteudo = None, None

    if caminho_docx:
        if not os.path.exists(caminho_docx):
            print(f"❌ Arquivo não encontrado: {caminho_docx}")
            return
        titulo, conteudo = ler_docx(caminho_docx)
    else:
        titulo, conteudo = ler_texto_manual()

    if not titulo or not conteudo:
        print("❌ Nenhum conteúdo válido encontrado.")
        return

    nome_arquivo = f"{slugify(titulo)}.html"
    criar_html(titulo, conteudo, nome_arquivo)
    atualizar_paginas(nome_arquivo, titulo)
    print("✨ Processo concluído! Abra o arquivo no VSCode para revisar.")

if __name__ == "__main__":
    main()
