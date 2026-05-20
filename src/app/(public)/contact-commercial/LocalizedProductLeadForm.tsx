'use client'

import { useTranslation } from 'react-i18next'
import ProductLeadForm from '@/app/admin/components/crm/ProductLeadForm'

type ProductOption = {
  id?: string
  slug: string
  name: string
}

export function LocalizedProductLeadForm({
  productOptions,
}: {
  productOptions: ProductOption[]
}) {
  const { t } = useTranslation()

  return (
    <ProductLeadForm
      productOptions={productOptions}
      title={t('contactCommercial.formTitle')}
      description={t('contactCommercial.formDescription')}
      defaultRequestType="CONTACT"
      variant="premium"
    />
  )
}
