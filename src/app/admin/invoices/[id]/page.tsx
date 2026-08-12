"use client";

import { useParams } from "next/navigation";
import InvoiceForm from "../_components/InvoiceForm";

export default function EditInvoicePage() {
  const params = useParams();
  const id = params.id as string;

  return <InvoiceForm invoiceId={id} />;
}
