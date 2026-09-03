"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, CornerUpLeft, X } from "lucide-react";
import { AuthRequiredError, postJson } from "./api-client";
import styles from "./login/admin-messages.module.css";

export type NoteItem = {
  id: string;
  authorName: string;
  type: string;
  body: string;
  dateLabel: string;
};

type Props = {
  messageId: string;
  notes: NoteItem[];
  canUpdate: boolean;
  canDelete: boolean;
};

export default function MessageNotes({ messageId, notes, canUpdate, canDelete }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [type, setType] = useState<"NOTE" | "REPLY">("NOTE");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  function redirectToLogin(loginUrl?: string) {
    const callbackUrl =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/admin/messages";
    const url = loginUrl || "/login";
    router.replace(
      url.includes("callbackUrl=") ? url : `${url}?callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  }

  async function submit() {
    const text = body.trim();
    if (!text) return;

    setSaving(true);
    setError("");

    try {
      await postJson("/api/messages/notes", { messageId, body: text, type });
      setBody("");
      setType("NOTE");
      router.refresh();
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        redirectToLogin(err.loginUrl);
        return;
      }
      setError(err instanceof Error ? err.message : "Impossible d'ajouter la note.");
    } finally {
      setSaving(false);
    }
  }

  async function removeNote(id: string) {
    setDeletingId(id);
    setError("");

    try {
      await postJson("/api/messages/notes", { id }, "DELETE");
      router.refresh();
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        redirectToLogin(err.loginUrl);
        return;
      }
      setError(err instanceof Error ? err.message : "Impossible de supprimer la note.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className={styles.notesSection}>
      <h3 className={styles.notesHeading}>
        <StickyNote size={13} />
        Notes internes
      </h3>

      {notes.length > 0 && (
        <div className={styles.notesList}>
          {notes.map((note) => (
            <div
              key={note.id}
              className={`${styles.noteItem} ${note.type === "REPLY" ? styles.noteItemReply : ""}`}
            >
              <div className={styles.noteItemHead}>
                <span className={styles.noteItemAuthor}>
                  {note.type === "REPLY" ? <CornerUpLeft size={11} /> : null}
                  {note.authorName}
                </span>

                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <time className={styles.noteItemDate}>{note.dateLabel}</time>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => removeNote(note.id)}
                      disabled={deletingId === note.id}
                      aria-label="Supprimer la note"
                      title="Supprimer la note"
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#a8a29e",
                        cursor: "pointer",
                        display: "inline-flex",
                        padding: 2,
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              </div>
              <p className={styles.noteItemBody}>{note.body}</p>
            </div>
          ))}
        </div>
      )}

      {canUpdate && (
        <div className={styles.noteForm}>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Ajouter une note interne, ou consigner une réponse envoyée..."
          />

          <div className={styles.noteFormFooter}>
            <label className={styles.noteTypeToggle}>
              <input
                type="checkbox"
                checked={type === "REPLY"}
                onChange={(event) => setType(event.target.checked ? "REPLY" : "NOTE")}
              />
              Marquer comme réponse envoyée
            </label>

            <button
              type="button"
              className={styles.noteSubmitBtn}
              onClick={submit}
              disabled={saving || !body.trim()}
            >
              {saving ? "Enregistrement..." : "Ajouter"}
            </button>
          </div>

          {error ? (
            <div className={styles.inlineError} role="alert">
              {error}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
