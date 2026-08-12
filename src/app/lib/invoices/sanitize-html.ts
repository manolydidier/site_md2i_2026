// src/app/lib/invoices/sanitize-html.ts
// Nettoyage strict du contenu riche des clients (édité via un contentEditable
// maison — src/app/admin/invoices/_components/RichTextEditor.tsx). Toute
// balise/attribut hors liste blanche est retiré ; les images doivent pointer
// vers /uploads (uploadées via /api/upload), jamais vers une URL externe.

import sanitizeHtml from "sanitize-html";

const ALLOWED_STYLE_PROPERTIES = [
  "color",
  "background-color",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
];

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "span", "img", "ul", "ol", "li"],
    allowedAttributes: {
      img: ["src", "alt", "width", "height", "style"],
      span: ["style"],
      p: ["style"],
    },
    allowedStyles: {
      "*": Object.fromEntries(
        ALLOWED_STYLE_PROPERTIES.map((prop) => [prop, [/^[\w#(),.%\s-]+$/]])
      ),
    },
    exclusiveFilter: (frame) => frame.tag === "img" && !/^\/uploads\//.test(frame.attribs.src || ""),
    transformTags: {
      div: "p",
    },
  }).trim();
}
