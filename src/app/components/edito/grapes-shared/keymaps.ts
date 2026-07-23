import type { Editor } from "grapesjs";

// Undo/redo/copier/coller/supprimer sont déjà liés nativement par GrapesJS.
// On ajoute ici uniquement ce qui manque : dupliquer et désélectionner.
export function registerCommonKeymaps(editor: Editor) {
  if (!editor.Commands.has("core:component-duplicate")) {
    editor.Commands.add("core:component-duplicate", {
      run(ed) {
        const selected = ed.getSelected();
        if (!selected) return;
        const collection = selected.collection;
        const index = collection ? collection.indexOf(selected) : -1;
        const clone = selected.clone();
        if (collection && index > -1) {
          collection.add(clone, { at: index + 1 });
        } else {
          selected.parent()?.append(clone);
        }
        ed.select(clone);
      },
    });
  }

  editor.Keymaps.add("core:component-duplicate", "⌘+d, ctrl+d", "core:component-duplicate", { prevent: true });

  if (!editor.Commands.has("core:component-deselect")) {
    editor.Commands.add("core:component-deselect", {
      run(ed) {
        ed.select(null as never);
      },
    });
  }

  editor.Keymaps.add("core:component-deselect", "escape", "core:component-deselect");
}
