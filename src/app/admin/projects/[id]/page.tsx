import { prisma } from "@/app/lib/prisma";
import { checkPermission } from "@/(permisionGuard)/lib/permissions";
import ProjectForm from "../_components/ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await checkPermission("projects", "canRead");

  if (!access.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">
          Vous n&apos;avez pas la permission de consulter ce projet.
        </p>
      </div>
    );
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Projet introuvable.</p>
      </div>
    );
  }

  const canUpdate = await checkPermission("projects", "canUpdate").then((r) => r.ok);

  return (
    <ProjectForm
      mode="edit"
      canUpdate={canUpdate}
      initial={{
        id: project.id,
        title: project.title,
        slug: project.slug,
        excerpt: project.excerpt,
        coverImage: project.coverImage,
        images: project.images,
        techStack: project.techStack,
        projectUrl: project.projectUrl,
        githubUrl: project.githubUrl,
        status: project.status,
        gjsHtml: project.gjsHtml,
      }}
    />
  );
}
