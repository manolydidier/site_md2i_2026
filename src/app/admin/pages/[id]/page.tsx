import { prisma } from "@/app/lib/prisma";
import { checkPermission } from "@/(permisionGuard)/lib/permissions";
import PageStudio from "../_components/PageStudio";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await checkPermission("pages", "canRead");

  if (!access.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">
          Vous n&apos;avez pas la permission de consulter cette page.
        </p>
      </div>
    );
  }

  const { id } = await params;

  const page = await prisma.page.findUnique({ where: { id }, select: { id: true } });

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Page introuvable.</p>
      </div>
    );
  }

  const canUpdate = await checkPermission("pages", "canUpdate").then((r) => r.ok);

  return <PageStudio mode="edit" pageId={id} canUpdate={canUpdate} />;
}
