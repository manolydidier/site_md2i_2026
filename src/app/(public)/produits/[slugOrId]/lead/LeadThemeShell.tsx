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
    <div
      className={`lead-root ${dark ? "lp-dark lead-dark" : "lp-light lead-light"}`}
      data-theme={dark ? "dark" : "light"}
    >
      {children}
    </div>
  );
}
