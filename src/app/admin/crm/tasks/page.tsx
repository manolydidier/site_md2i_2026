import { prisma } from "@/app/lib/prisma";
import { getCrmOwnerUserId } from "@/app/lib/crm-owner";
import TasksTable from "./TasksTable";

export const dynamic = "force-dynamic";

export default async function CrmTasksPage() {
  const userId = await getCrmOwnerUserId();

  const tasks = await prisma.crmTask.findMany({
    where: {
      userId,
    },
    take: 100,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: {
      contact: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      opportunity: {
        select: {
          id: true,
          title: true,
          stage: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  const rows = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    contact: task.contact
      ? {
          id: task.contact.id,
          email: task.contact.email,
          firstName: task.contact.firstName,
          lastName: task.contact.lastName,
          phone: task.contact.phone,
        }
      : null,
    company: task.company
      ? {
          id: task.company.id,
          name: task.company.name,
        }
      : null,
    opportunity: task.opportunity
      ? {
          id: task.opportunity.id,
          title: task.opportunity.title,
          stage: task.opportunity.stage,
          product: task.opportunity.product
            ? {
                id: task.opportunity.product.id,
                name: task.opportunity.product.name,
                slug: task.opportunity.product.slug,
              }
            : null,
        }
      : null,
  }));

  return (
    <>
      <header className="crm-page-header">
        <div>
          <p className="crm-eyebrow">Actions commerciales</p>

          <h1 className="crm-title">Tâches & relances</h1>

          <p className="crm-subtitle">
            Les relances sont créées automatiquement lorsqu’un prospect remplit
            un formulaire produit ou commercial. Vous pouvez maintenant suivre
            leur statut directement depuis cette page.
          </p>
        </div>
      </header>

      <TasksTable tasks={rows} />
    </>
  );
}