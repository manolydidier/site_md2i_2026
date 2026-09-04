// Initialisation GrapesJS partagée entre les 4 éditeurs visuels de l'admin
// (PageStudio, ProjectStudio, ProductStudio, GrapesEditor) — ces quatre
// fichiers réimplémentaient un `grapesjs.init({...})` identique au caractère
// près (mêmes plugins, mêmes devices, mêmes appendTo). Seule cette portion
// commune est factorisée ici ; le câblage des événements `editor.on(...)`
// reste dans chaque composant car il diffère selon le contenu édité
// (page/projet/produit/article).

import grapesjs, { type Editor } from "grapesjs";
import { registerCommonBlocks } from "./blocks";
import { registerCommonKeymaps } from "./keymaps";
import { STYLE_MANAGER_SECTORS } from "./styleManagerConfig";

export async function createMd2iGrapesEditor(container: HTMLElement): Promise<Editor> {
  const [
    { default: gjsPreset },
    { default: gjsBlocks },
    { default: gjsForms },
    { default: gjsNavbar },
    { default: gjsCustomCode },
  ] = await Promise.all([
    import("grapesjs-preset-webpage"),
    import("grapesjs-blocks-basic"),
    import("grapesjs-plugin-forms"),
    import("grapesjs-navbar"),
    import("grapesjs-custom-code"),
  ]);

  const editor = grapesjs.init({
    container,
    height: "100%",
    width: "100%",
    fromElement: false,
    storageManager: false,

    plugins: [gjsPreset, gjsBlocks, gjsForms, gjsNavbar, gjsCustomCode],
    pluginsOpts: {
      [gjsPreset as never]: { modalImportTitle: "Importer du HTML" },
      [gjsBlocks as never]: { flexGrid: true },
    },

    panels: { defaults: [] },

    deviceManager: {
      devices: [
        { name: "Desktop", width: "" },
        { name: "Tablet", width: "768px", widthMedia: "992px" },
        { name: "Mobile", width: "375px", widthMedia: "480px" },
      ],
    },

    canvas: {
      styles: [
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
        "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      ],
      scripts: ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"],
    },

    blockManager: { appendTo: "#ed-blocks" },
    layerManager: { appendTo: "#ed-layers" },
    traitManager: { appendTo: "#ed-traits" },
    selectorManager: { appendTo: "#ed-style-selectors" },

    styleManager: {
      appendTo: "#ed-styles-fields",
      sectors: STYLE_MANAGER_SECTORS,
    },
  });

  registerCommonBlocks(editor);
  registerCommonKeymaps(editor);

  return editor;
}
