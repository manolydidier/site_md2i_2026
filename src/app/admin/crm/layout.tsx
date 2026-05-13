"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./crm.css";

const crmTabs = [
  {
    label: "Dashboard",
    href: "/admin/crm",
    exact: true,
  },
  {
    label: "Contacts",
    href: "/admin/crm/contacts",
  },
  {
    label: "Opportunités",
    href: "/admin/crm/opportunities",
  },
  {
    label: "Tâches",
    href: "/admin/crm/tasks",
  },
];

function isActiveTab(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="crm-shell">
      <header className="crm-topbar">
        <div className="crm-brand crm-brand-horizontal">
          <span className="crm-brand-mark">M</span>

          <div>
            <p className="crm-brand-label">MD2I</p>
            <h1>CRM</h1>
          </div>
        </div>

        <nav className="crm-tabs" aria-label="Navigation CRM">
          {crmTabs.map((tab) => {
            const active = isActiveTab(pathname, tab.href, tab.exact);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={active ? "crm-tab crm-tab-active" : "crm-tab"}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <section className="crm-main">{children}</section>
    </main>
  );
}