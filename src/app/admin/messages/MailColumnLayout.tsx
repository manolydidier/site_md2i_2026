"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import styles from "./login/admin-messages.module.css";

type Props = {
  children: ReactNode;
};

export default function MailColumnLayout({ children }: Props) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLeft = window.localStorage.getItem("admin-messages-left-open");
    const savedRight = window.localStorage.getItem("admin-messages-right-open");

    if (savedLeft !== null) {
      setLeftOpen(savedLeft === "true");
    }

    if (savedRight !== null) {
      setRightOpen(savedRight === "true");
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    window.localStorage.setItem(
      "admin-messages-left-open",
      String(leftOpen)
    );
  }, [leftOpen, mounted]);

  useEffect(() => {
    if (!mounted) return;

    window.localStorage.setItem(
      "admin-messages-right-open",
      String(rightOpen)
    );
  }, [rightOpen, mounted]);

  const className = [
    styles.gmailPage,
    !leftOpen ? styles.gmailPageLeftClosed : "",
    !rightOpen ? styles.gmailPageRightClosed : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main
      className={className}
      data-left-open={leftOpen}
      data-right-open={rightOpen}
    >
      <button
        type="button"
        className={`${styles.columnToggleButton} ${styles.columnToggleLeft}`}
        onClick={() => setLeftOpen((value) => !value)}
        aria-label={
          leftOpen ? "Fermer la colonne gauche" : "Ouvrir la colonne gauche"
        }
        title={
          leftOpen ? "Fermer la colonne gauche" : "Ouvrir la colonne gauche"
        }
      >
        <span className={styles.columnToggleIcon}>{leftOpen ? "‹" : "›"}</span>
        <span className={styles.columnToggleText}>
          {leftOpen ? "Dossiers" : "Ouvrir"}
        </span>
      </button>

      <button
        type="button"
        className={`${styles.columnToggleButton} ${styles.columnToggleRight}`}
        onClick={() => setRightOpen((value) => !value)}
        aria-label={
          rightOpen
            ? "Fermer la colonne de lecture"
            : "Ouvrir la colonne de lecture"
        }
        title={
          rightOpen
            ? "Fermer la colonne de lecture"
            : "Ouvrir la colonne de lecture"
        }
      >
        <span className={styles.columnToggleText}>
          {rightOpen ? "Lecture" : "Ouvrir"}
        </span>
        <span className={styles.columnToggleIcon}>{rightOpen ? "›" : "‹"}</span>
      </button>

      {children}
    </main>
  );
}