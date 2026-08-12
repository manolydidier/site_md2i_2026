// src/app/lib/invoices/html-to-paragraphs.ts
// Convertit le HTML déjà nettoyé (sanitize-html.ts, liste blanche restreinte)
// en une séquence de paragraphes texte/image simple, consommée par les
// exports Excel et PDF (qui ne peuvent pas rendre du HTML directement).
// Petit analyseur maison plutôt qu'une dépendance de parsing HTML : la liste
// blanche de balises est réduite et fixe, ce qui rend un tokenizer regex fiable.

export type RichRun = {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string | null;
};

export type RichParagraph = { type: "text"; runs: RichRun[] } | { type: "image"; url: string };

const TOKEN_RE = /<\/?([a-z0-9]+)([^>]*)>|([^<]+)/gi;

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractAttr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"));
  return match ? match[1] : null;
}

export function parseRichHtmlToParagraphs(html: string): RichParagraph[] {
  const paragraphs: RichParagraph[] = [];
  let currentRuns: RichRun[] = [];

  let boldDepth = 0;
  let italicDepth = 0;
  let underlineDepth = 0;
  const colorStack: (string | null)[] = [];

  function flushParagraph() {
    if (currentRuns.length > 0) {
      paragraphs.push({ type: "text", runs: currentRuns });
      currentRuns = [];
    }
  }

  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;

  while ((match = TOKEN_RE.exec(html)) !== null) {
    const [full, tagName, attrs, textNode] = match;

    if (textNode !== undefined) {
      const text = decodeEntities(textNode);
      if (text.trim().length === 0 && !text.includes(" ")) continue;
      currentRuns.push({
        text,
        bold: boldDepth > 0,
        italic: italicDepth > 0,
        underline: underlineDepth > 0,
        color: colorStack.length > 0 ? colorStack[colorStack.length - 1] : null,
      });
      continue;
    }

    const closing = full.startsWith("</");
    const tag = tagName.toLowerCase();

    if (tag === "img" && !closing) {
      const src = extractAttr(attrs, "src");
      flushParagraph();
      if (src) paragraphs.push({ type: "image", url: src });
      continue;
    }

    if (tag === "br") {
      flushParagraph();
      continue;
    }

    if (tag === "p" || tag === "li") {
      flushParagraph();
      continue;
    }

    if (tag === "strong" || tag === "b") {
      boldDepth += closing ? -1 : 1;
      continue;
    }

    if (tag === "em" || tag === "i") {
      italicDepth += closing ? -1 : 1;
      continue;
    }

    if (tag === "u") {
      underlineDepth += closing ? -1 : 1;
      continue;
    }

    if (tag === "span") {
      if (closing) {
        colorStack.pop();
      } else {
        const styleAttr = extractAttr(attrs, "style") || "";
        const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/i);
        colorStack.push(colorMatch ? colorMatch[1].trim() : null);
      }
      continue;
    }
  }

  flushParagraph();
  return paragraphs;
}
