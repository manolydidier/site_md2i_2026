'use client'

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type TProps = {
  k: string
  values?: Record<string, string | number>
  children?: ReactNode
}

export function T({ k, values, children }: TProps) {
  const { t } = useTranslation()
  const defaultValue = typeof children === 'string' ? children : undefined

  return <>{t(k, { defaultValue, ...values })}</>
}
