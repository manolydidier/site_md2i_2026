import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        excerpt: true,
        price: true,
        coverImage: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      products: products.map((product) => ({
        ...product,
        price: product.price ? product.price.toString() : null,
      })),
    });
  } catch (error) {
    console.error("[CRM_PRODUCTS_GET]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Impossible de charger les produits.",
      },
      { status: 500 }
    );
  }
}
