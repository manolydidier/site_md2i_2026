import { redirect } from 'next/navigation'

export default function NewProductCategoryPage() {
  redirect('/admin/product-categories?modal=create')
}
