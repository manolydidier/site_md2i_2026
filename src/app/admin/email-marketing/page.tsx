// app/(backoffice)/email-marketing/page.tsx
"use client";

import { useState, type ReactNode } from "react";
import { Mail, Users, LayoutGrid, Send, UserPlus, Plus } from "lucide-react";

import { ContactsTable } from "@/app/components/email-mrketing/ContactsTable";
import { GroupsManager } from "@/app/components/email-mrketing/Groupsmanager";
import { CampaignsList } from "@/app/components/email-mrketing/CampaignsList";
import { CampaignForm } from "@/app/components/email-mrketing/CampaignForm";
import type { Campaign } from "@/app/types/email-marketing";

type Tab = "campaigns" | "contacts" | "groups";
type View = "list" | "new" | "edit";

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

const ORANGE        = "#EF9F27";
const ORANGE_SOFT   = "rgba(239,159,39,0.10)";
const ORANGE_BORDER = "rgba(239,159,39,0.22)";
const BG            = "#F8FAFC";
const SURFACE       = "#FFFFFF";
const BORDER        = "#E5E7EB";
const TEXT          = "#111827";
const MUTED         = "#6B7280";
const SOFT_TEXT     = "#9CA3AF";
const FONT          = "inherit";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EmailMarketingPage() {
  const [activeTab, setActiveTab]           = useState<Tab>("campaigns");
  const [view, setView]                     = useState<View>("list");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "campaigns", label: "Campagnes", icon: <Mail size={14} /> },
    { id: "contacts",  label: "Contacts",  icon: <Users size={14} /> },
    { id: "groups",    label: "Groupes",   icon: <LayoutGrid size={14} /> },
  ];

  const handleNewCampaign    = () => { setEditingCampaign(null); setView("new"); };
  const handleEditCampaign   = (c: Campaign) => { setEditingCampaign(c); setView("edit"); };
  const handleSaveCampaign   = () => { setView("list"); setEditingCampaign(null); };
  const handleCancelForm     = () => { setView("list"); setEditingCampaign(null); };

  return (
    <div style={s.page}>

      {/* ── Header (list only) ─────────────────────────────────────── */}
      {view === "list" && (
        <header style={s.header}>

          {/* Breadcrumb */}
          <div style={s.breadcrumb}>
            <span style={{ color: ORANGE }}>Backoffice</span>
            <span style={s.slash}>/</span>
            <span style={{ color: TEXT }}>Email Marketing</span>
          </div>

          {/* Title row */}
          <div style={s.titleRow}>
            <div style={s.titleLeft}>
              <div style={s.iconBadge}>
                <Mail size={20} color={ORANGE} />
              </div>
              <div>
                <h1 style={s.h1}>Email Marketing</h1>
                <p style={s.subtitle}>Contacts, groupes et campagnes email</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <nav style={s.tabsBar} role="tablist">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ ...s.tabBtn, ...(active ? s.tabBtnActive : {}) }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>
      )}

      {/* ── Main ───────────────────────────────────────────────────── */}
      <main style={view === "list" ? s.content : s.formContent}>

        {/* Form views */}
        {(view === "new" || view === "edit") && (
          <CampaignForm
            campaign={editingCampaign}
            onSave={handleSaveCampaign}
            onCancel={handleCancelForm}
          />
        )}

        {/* List views */}
        {view === "list" && (
          <>
            {/* ── Campaigns ── */}
            {activeTab === "campaigns" && (
              <TabSection
                label="Campagnes"
                subtitle="Gérez vos campagnes, brouillons et envois programmés."
                action={
                  <button type="button" style={s.btnPrimary} onClick={handleNewCampaign}>
                    <Send size={13} />
                    Nouvelle campagne
                  </button>
                }
              >
                <CampaignsList onNew={handleNewCampaign} onEdit={handleEditCampaign} />
              </TabSection>
            )}

            {/* ── Contacts ── */}
            {activeTab === "contacts" && (
              <TabSection
                label="Contacts"
                subtitle="Gérez vos abonnés et leurs informations."
                action={
                  <button type="button" style={s.btnSecondary}>
                    <UserPlus size={13} />
                    Ajouter un contact
                  </button>
                }
              >
                <ContactsTable />
              </TabSection>
            )}

            {/* ── Groups ── */}
            {activeTab === "groups" && (
              <TabSection
                label="Groupes"
                subtitle="Organisez vos contacts par segments."
                action={
                  <button type="button" style={s.btnSecondary}>
                    <Plus size={13} />
                    Nouveau groupe
                  </button>
                }
              >
                <GroupsManager />
              </TabSection>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TabSection — wraps the toolbar + panel for each tab
// ---------------------------------------------------------------------------

function TabSection({
  label,
  subtitle,
  action,
  children,
}: {
  label: string;
  subtitle: string;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div style={s.toolbar}>
        <div>
          <div style={s.sectionLabel}>{label}</div>
          <p style={s.sectionSubtitle}>{subtitle}</p>
        </div>
        {action}
      </div>

      <div style={s.panel}>{children}</div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: BG,
    color: TEXT,
    fontFamily: FONT,
  },

  // ── Header ──────────────────────────────────────────────────────────────

  header: {
    // Full width — no max-width constraint
    width: "100%",
    paddingTop: 24,
    paddingRight: 32,
    paddingBottom: 0,
    paddingLeft: 32,
    boxSizing: "border-box",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    marginBottom: 18,
    fontSize: 11,
    fontWeight: 600,
    color: MUTED,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  slash: {
    color: SOFT_TEXT,
    margin: "0 7px",
  },

  titleRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap" as const,
  },

  titleLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: ORANGE_SOFT,
    border: `1px solid ${ORANGE_BORDER}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  h1: {
    margin: 0,
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    color: TEXT,
  },

  subtitle: {
    margin: "5px 0 0",
    fontSize: 13,
    color: MUTED,
    fontWeight: 400,
  },

  tabsBar: {
    marginTop: 22,
    borderBottom: `1px solid ${BORDER}`,
    display: "flex",
    alignItems: "stretch",
    gap: 0,
    overflowX: "auto" as const,
  },

  tabBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "0 18px",
    height: 42,
    fontSize: 13,
    fontWeight: 500,
    color: MUTED,
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    marginBottom: -1,
    fontFamily: FONT,
    transition: "color 0.15s ease, border-color 0.15s ease",
  },

  tabBtnActive: {
    color: ORANGE,
    borderBottom: ORANGE,
  },

  // ── Main ────────────────────────────────────────────────────────────────

  content: {
    // Full width — no max-width constraint
    width: "100%",
    paddingTop: 24,
    paddingRight: 32,
    paddingBottom: 48,
    paddingLeft: 32,
    boxSizing: "border-box",
  },

  formContent: {
    minHeight: "100vh",
    background: BG,
  },

  // ── Tab section ─────────────────────────────────────────────────────────

  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 14,
    flexWrap: "wrap" as const,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: SOFT_TEXT,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    marginBottom: 3,
  },

  sectionSubtitle: {
    margin: 0,
    fontSize: 13,
    color: MUTED,
  },

  panel: {
    width: "97%",
    background: SURFACE,
    border: `0.5px solid ${BORDER}`,
    borderRadius: 14,
    boxSizing: "border-box",
  },

  // ── Buttons ─────────────────────────────────────────────────────────────

  btnPrimary: {
    height: 36,
    padding: "0 14px",
    borderRadius: 10,
    border: `1px solid ${ORANGE_BORDER}`,
    background: ORANGE,
    color: "#1a0d00",
    fontSize: 12,
    fontWeight: 500,
    fontFamily: FONT,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },

  btnSecondary: {
    height: 36,
    padding: "0 14px",
    borderRadius: 10,
    border: `0.5px solid ${BORDER}`,
    background: SURFACE,
    color: TEXT,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: FONT,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
};