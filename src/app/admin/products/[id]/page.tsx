import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ProductStudio from '../_components/ProductStudio'

export const metadata = { title: 'Modifier le produit' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  return (
    <ProductStudio
      mode="edit"
      productId={id}
      authorId={session.user.id}
    />
  )
}