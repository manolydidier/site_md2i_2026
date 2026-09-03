"use client";

// Raccourcis façon webmail : j/k pour naviguer, e pour archiver, Suppr pour
// supprimer, r pour répondre, / pour chercher, Échap pour désélectionner.
// Ne rend rien — attache juste les écouteurs clavier.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMailActions } from "./actions-context";

type NavItem = { id: string; href: string };

type Props = {
  items: NavItem[];
  selectedId?: string;
  replyHref?: string;
};

function isTypingTarget(el: Element | null) {
  const tag = el?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement | null)?.isContentEditable;
}

export default function KeyboardShortcuts({ items, selectedId, replyHref }: Props) {
  const router = useRouter();
  const { archive, remove, clearSelection, canUpdate, canDelete } = useMailActions();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "/") {
        if (isTypingTarget(document.activeElement)) return;
        event.preventDefault();
        document.getElementById("mail-search-input")?.focus();
        return;
      }

      if (event.key === "Escape") {
        clearSelection();
        (document.activeElement as HTMLElement | null)?.blur?.();
        return;
      }

      if (isTypingTarget(document.activeElement)) return;

      if (event.key === "j" || event.key === "k") {
        if (items.length === 0) return;
        const index = items.findIndex((item) => item.id === selectedId);

        const nextIndex =
          event.key === "j"
            ? index === -1
              ? 0
              : Math.min(items.length - 1, index + 1)
            : index === -1
              ? 0
              : Math.max(0, index - 1);

        const next = items[nextIndex];
        if (next) router.push(next.href);
        return;
      }

      if (event.key === "e" && selectedId && canUpdate) {
        event.preventDefault();
        archive(selectedId);
        return;
      }

      if ((event.key === "#" || event.key === "Delete") && selectedId && canDelete) {
        event.preventDefault();
        remove(selectedId);
        return;
      }

      if (event.key === "r" && replyHref) {
        event.preventDefault();
        window.location.href = replyHref;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items, selectedId, replyHref, archive, remove, clearSelection, canUpdate, canDelete, router]);

  return null;
}
