import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ProductStudio from "../_components/ProductStudio"



export const metadata = { title: 'Nouveau produit' }

export default async function NewProductPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return <ProductStudio mode="create" authorId={session.user.id} />
}