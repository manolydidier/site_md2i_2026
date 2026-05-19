"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/app/context/ThemeContext";

export default function LeadThemeShell({
  children,
}: {
  children: ReactNode;
}) {
  const { dark } = useTheme();

  return (
    <main
      className={`lead-root ${dark ? "lead-dark" : "lead-light"}`}
      data-theme={dark ? "dark" : "light"}
    >
      {children}
    </main>
  );
}
