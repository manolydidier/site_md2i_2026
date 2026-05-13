import ProductLeadForm from "../components/crm/ProductLeadForm"; 
import { prisma } from "@/app/lib/prisma";
export const dynamic = "force-dynamic";
export default async function ContactCommercialPage() {
  const products = await prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } });
  return <main style={{ minHeight: "100vh", padding: "48px 20px", background: "#f1f5f9" }}><section style={{ maxWidth: 900, margin: "0 auto 32px", textAlign: "center", fontFamily: "Arial, Helvetica, sans-serif" }}><p style={{ margin: "0 0 10px", color: "#1e3a8a", fontSize: 13, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>Contact commercial</p><h1 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: 44, lineHeight: 1.1, fontWeight: 900 }}>Parler a un conseiller MD2I</h1><p style={{ maxWidth: 680, margin: "0 auto", color: "#475569", fontSize: 18, lineHeight: 1.6, fontWeight: 600 }}>Selectionnez un produit ou service, puis envoyez votre demande. Votre contact sera enregistre dans le CRM avec la source marketing.</p></section><ProductLeadForm productOptions={products} title="Demande commerciale" description="Choisissez le produit ou service qui vous interesse. L'equipe MD2I vous recontactera rapidement." defaultRequestType="CONTACT" /></main>;
}
