import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
export const dynamic = "force-dynamic";
function getContactName(contact: { firstName: string | null; lastName: string | null; email: string }) { const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim(); return name || contact.email; }
function formatDate(date: Date) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date); }
export default async function CrmContactsPage() {
  const userId = await getCrmOwnerUserId();
  const contacts = await prisma.contact.findMany({ where: { userId }, take: 100, orderBy: { createdAt: "desc" }, include: { crmCompany: true, group: true } });
  return <><header className="crm-page-header"><div><p className="crm-eyebrow">CRM</p><h1 className="crm-title">Contacts</h1><p className="crm-subtitle">Tous les prospects, clients et contacts issus du site, des campagnes email, des appels d'offres et des reseaux sociaux.</p></div></header><div className="crm-card crm-section">{contacts.length === 0 ? <div className="crm-empty">Aucun contact pour le moment.</div> : <table className="crm-table"><thead><tr><th>Contact</th><th>Entreprise</th><th>Statut</th><th>Source</th><th>Groupe</th><th>Cree le</th></tr></thead><tbody>{contacts.map((contact) => <tr key={contact.id}><td><div className="crm-name">{getContactName(contact)}</div><div className="crm-muted">{contact.email}</div>{contact.phone && <div className="crm-muted">{contact.phone}</div>}</td><td>{contact.crmCompany?.name || contact.companyName || "—"}</td><td><span className="crm-badge crm-badge-green">{contact.crmStatus}</span></td><td>{contact.crmSource}</td><td>{contact.group?.name || "—"}</td><td>{formatDate(contact.createdAt)}</td></tr>)}</tbody></table>}</div></>;
}
