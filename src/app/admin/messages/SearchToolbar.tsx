"use client";

// Recherche en direct : chaque frappe (avec un léger debounce) et chaque
// changement de filtre met à jour l'URL via le routeur client, sans
// rechargement complet de page — remplace l'ancien <form method="get">.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import styles from "./login/admin-messages.module.css";

type StatusOption = { value: string; label: string };

type Props = {
  q: string;
  status: string;
  sort: string;
  statusOptions: StatusOption[];
};

const SORT_OPTIONS = [
  { value: "date_desc", label: "Plus récent" },
  { value: "date_asc", label: "Plus ancien" },
  { value: "unread_first", label: "Non lus d'abord" },
];

export default function SearchToolbar({ q, status, sort, statusOptions }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(q);
  }, [q]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function navigate(next: { q?: string; status?: string; sort?: string }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? value;
    const nextStatus = next.status ?? status;
    const nextSort = next.sort ?? sort;

    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus) params.set("status", nextStatus);
    if (nextSort && nextSort !== "date_desc") params.set("sort", nextSort);

    const query = params.toString();
    router.push(query ? `/admin/messages?${query}` : "/admin/messages");
  }

  function handleQueryChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate({ q: next }), 350);
  }

  const hasFilters = Boolean(q || status || (sort && sort !== "date_desc"));

  return (
    <div className={styles.searchToolbar}>
      <div className={styles.gmailSearch}>
        <Search size={15} />

        <input
          id="mail-search-input"
          value={value}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Rechercher dans les messages"
        />
      </div>

      <select value={status} onChange={(event) => navigate({ status: event.target.value })}>
        <option value="">Tous les statuts</option>
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select value={sort} onChange={(event) => navigate({ sort: event.target.value })}>
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          className={styles.clearFilter}
          onClick={() => {
            setValue("");
            router.push("/admin/messages");
          }}
        >
          Effacer
        </button>
      )}
    </div>
  );
}
