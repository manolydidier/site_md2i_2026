// app/(backoffice)/email-marketing/page.tsx
// Page principale du module email marketing

"use client";

import { useState, type ReactNode } from "react";
import {
  Mail,
  Users,
  LayoutGrid,
  Send,
  UserPlus,
  Plus,
} from "lucide-react";

import { ContactsTable } from "@/app/components/email-mrketing/ContactsTable";
import { GroupsManager } from "@/app/components/email-mrketing/Groupsmanager";
import { CampaignsList } from "@/app/components/email-mrketing/CampaignsList";
import { CampaignForm } from "@/app/components/email-mrketing/CampaignForm";
import type { Campaign } from "@/app/types/email-marketing";

type Tab = "campaigns" | "contacts" | "groups";
type View = "list" | "new" | "edit";

export default function EmailMarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("campaigns");
  const [view, setView] = useState<View>("list");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    {
      id: "campaigns",
      label: "Campagnes",
      icon: <Mail size={14} />,
    },
    {
      id: "contacts",
      label: "Contacts",
      icon: <Users size={14} />,
    },
    {
      id: "groups",
      label: "Groupes",
      icon: <LayoutGrid size={14} />,
    },
  ];

  const handleNewCampaign = () => {
    setEditingCampaign(null);
    setView("new");
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setView("edit");
  };

  const handleSaveCampaign = () => {
    setView("list");
    setEditingCampaign(null);
  };

  const handleCancelForm = () => {
    setView("list");
    setEditingCampaign(null);
  };

  return (
    <div style={styles.page}>
      {view === "list" && (
        <header style={styles.header}>
          <div style={styles.breadcrumb}>
            <span style={{ color: ORANGE }}>Backoffice</span>
            <span style={{ color: MUTED, margin: "0 6px" }}>/</span>
            <span style={{ color: TEXT, fontWeight: 700 }}>
              Email Marketing
            </span>
          </div>

          <div style={styles.headerRow}>
            <div style={styles.headerLeft}>
              <div style={styles.iconBadge}>
                <Mail size={22} color={ORANGE} />
              </div>

              <div>
                <h1 style={styles.h1}>Email Marketing</h1>
                <p style={styles.subtitle}>
                  Contacts, groupes et campagnes email
                </p>
              </div>
            </div>
          </div>

          <nav style={styles.tabsBar} role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...styles.tabBtn,
                    ...(isActive ? styles.tabBtnActive : {}),
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>
      )}

      <main style={view === "list" ? styles.content : styles.formContent}>
        {(view === "new" || view === "edit") && (
          <CampaignForm
            campaign={editingCampaign}
            onSave={handleSaveCampaign}
            onCancel={handleCancelForm}
          />
        )}

        {view === "list" && (
          <>
            {activeTab === "campaigns" && (
              <>
                <div style={styles.toolbar}>
                  <div>
                    <div style={styles.sectionLabel}>Campagnes</div>
                    <p style={styles.contentSubtitle}>
                      Gérez vos campagnes, brouillons et envois programmés.
                    </p>
                  </div>

                  <button
                    type="button"
                    style={styles.btnPrimary}
                    onClick={handleNewCampaign}
                  >
                    <Send size={14} />
                    Nouvelle campagne
                  </button>
                </div>

                <div style={styles.panel}>
                  <CampaignsList
                    onNew={handleNewCampaign}
                    onEdit={handleEditCampaign}
                  />
                </div>
              </>
            )}

            {activeTab === "contacts" && (
              <>
                <div style={styles.toolbar}>
                  <div>
                    <div style={styles.sectionLabel}>Contacts</div>
                    <p style={styles.contentSubtitle}>
                      Gérez vos abonnés et leurs informations.
                    </p>
                  </div>

                  <button type="button" style={styles.btnSecondary}>
                    <UserPlus size={14} />
                    Ajouter
                  </button>
                </div>

                <div style={styles.panel}>
                  <ContactsTable />
                </div>
              </>
            )}

            {activeTab === "groups" && (
              <>
                <div style={styles.toolbar}>
                  <div>
                    <div style={styles.sectionLabel}>Groupes</div>
                    <p style={styles.contentSubtitle}>
                      Organisez vos contacts par segments.
                    </p>
                  </div>

                  <button type="button" style={styles.btnSecondary}>
                    <Plus size={14} />
                    Nouveau groupe
                  </button>
                </div>

                <div style={styles.panel}>
                  <GroupsManager />
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Styles blancs simples ───────────────────────────────────────────────────

const ORANGE = "#EF9F27";
const ORANGE_SOFT = "rgba(239,159,39,0.10)";
const ORANGE_BORDER = "rgba(239,159,39,0.24)";

const BG = "#F8FAFC";
const SURFACE = "#FFFFFF";
const BORDER = "#E5E7EB";

const TEXT = "#111827";
const MUTED = "#6B7280";
const SOFT_TEXT = "#9CA3AF";

const FONT = "'Sora', 'DM Sans', system-ui, sans-serif";

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: BG,
    color: TEXT,
    fontFamily: FONT,
  },

  header: {
    maxWidth: 1200,
    margin: "0 auto",
    paddingTop: 28,
    paddingRight: 28,
    paddingBottom: 0,
    paddingLeft: 28,
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    marginBottom: 20,
    fontSize: 11,
    fontWeight: 700,
    color: MUTED,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  headerRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },

  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: ORANGE_SOFT,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ORANGE_BORDER,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  h1: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "-0.04em",
    lineHeight: 1.1,
    color: TEXT,
  },

  subtitle: {
    marginTop: 5,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    fontSize: 13,
    color: MUTED,
    fontWeight: 400,
  },

  tabsBar: {
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: BORDER,
    display: "flex",
    alignItems: "stretch",
    gap: 0,
    overflowX: "auto",
  },

  tabBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    paddingTop: 0,
    paddingRight: 18,
    paddingBottom: 0,
    paddingLeft: 18,
    height: 44,
    fontSize: 13,
    fontWeight: 700,
    color: MUTED,
    background: "transparent",

    borderTopWidth: 0,
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 2,
    borderTopStyle: "solid",
    borderRightStyle: "solid",
    borderLeftStyle: "solid",
    borderBottomStyle: "solid",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",

    cursor: "pointer",
    whiteSpace: "nowrap",
    marginBottom: -1,
    fontFamily: FONT,
    transitionProperty: "color, border-color, background",
    transitionDuration: "0.15s",
    transitionTimingFunction: "ease",
  },

  tabBtnActive: {
    color: ORANGE,
    borderBottomColor: ORANGE,
  },

  content: {
    maxWidth: 1200,
    margin: "0 auto",
    paddingTop: 24,
    paddingRight: 28,
    paddingBottom: 48,
    paddingLeft: 28,
  },

  formContent: {
    minHeight: "100vh",
    background: BG,
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 16,
    flexWrap: "wrap",
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: SOFT_TEXT,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 4,
  },

  contentSubtitle: {
    margin: 0,
    fontSize: 13,
    color: MUTED,
  },

  panel: {
    background: SURFACE,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: BORDER,
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  },

  btnSecondary: {
    height: 38,
    paddingTop: 0,
    paddingRight: 14,
    paddingBottom: 0,
    paddingLeft: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: BORDER,
    background: SURFACE,
    color: TEXT,
    fontSize: 13,
    fontWeight: 700,
    fontFamily: FONT,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
  },

  btnPrimary: {
    height: 38,
    paddingTop: 0,
    paddingRight: 16,
    paddingBottom: 0,
    paddingLeft: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ORANGE_BORDER,
    background: ORANGE,
    color: "#1a0d00",
    fontSize: 13,
    fontWeight: 800,
    fontFamily: FONT,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    letterSpacing: "0.01em",
  },
};