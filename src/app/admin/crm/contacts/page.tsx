import { ContactsTable } from "@/app/components/email-mrketing/ContactsTable";

export const dynamic = "force-dynamic";

export default async function CrmContactsPage() {
  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">CRM</p>
          <h1 className="crm-title">Contacts</h1>
          <p className="crm-subtitle">
            Tous les prospects, clients et contacts issus du site, des campagnes
            email, des appels d&apos;offres et des réseaux sociaux.
          </p>
        </div>
      </header>

      <div className="crm-card crm-section">
        <ContactsTable />
      </div>
    </>
  );
}