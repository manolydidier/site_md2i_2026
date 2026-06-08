import PostDetailClient from "./PostDetailClient";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { buildMetadata } from "@/app/seo";

type ArticlePageProps = {
  params: Promise<{
    articleId: string;
  }>;
};

function decodeIdentifier(value: string) {
  try {
    return decodeURIComponent(value || "").trim();
  } catch {
    return String(value || "").trim();
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function stripHtml(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function getPublishedPostByIdentifier(identifier: string) {
  return prisma.post.findFirst({
    where: {
      status: "PUBLISHED",
      OR: [
        {
          slug: {
            equals: identifier,
            mode: "insensitive",
          },
        },
        ...(isUuid(identifier)
          ? [
              {
                id: identifier,
              },
            ]
          : []),
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { articleId: rawArticleId } = await params;
  const articleId = decodeIdentifier(rawArticleId);

  if (!articleId) {
    return buildMetadata({
      title: "Article introuvable",
      description: "Cet article MD2I est introuvable ou non publié.",
      path: "/articles",
      noIndex: true,
    });
  }

  const post = await getPublishedPostByIdentifier(articleId);

  if (!post) {
    return buildMetadata({
      title: "Article introuvable",
      description: "Cet article MD2I est introuvable ou non publié.",
      path: `/articles/${encodeURIComponent(articleId)}`,
      noIndex: true,
    });
  }

  const description =
    stripHtml(post.excerpt).slice(0, 158) ||
    "Retrouvez les analyses, actualités et publications MD2I autour des logiciels SARA, de la gestion de projets et des solutions digitales.";

  return buildMetadata({
    title: post.title,
    description,
    path: `/articles/${encodeURIComponent(post.slug || post.id)}`,
    image: post.coverImage || "/logo.png",
    keywords: [
      post.title,
      post.category?.name,
      "article MD2I",
      "logiciels SARA",
      "gestion de projets",
    ].filter(Boolean) as string[],
  });
}


export default async function Page({ params }: ArticlePageProps) {
  const { articleId: rawArticleId } = await params;
  const articleId = decodeIdentifier(rawArticleId);
  const post = articleId ? await getPublishedPostByIdentifier(articleId) : null;

  if (post?.slug && post.slug !== articleId) {
    permanentRedirect(`/articles/${encodeURIComponent(post.slug)}`);
  }

  return <PostDetailClient />
}
