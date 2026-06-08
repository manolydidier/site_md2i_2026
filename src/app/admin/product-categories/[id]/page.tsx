import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditProductCategoryPage({ params }: PageProps) {
  const { id } = await params

  redirect(`/admin/product-categories?edit=${encodeURIComponent(id)}`)
}
