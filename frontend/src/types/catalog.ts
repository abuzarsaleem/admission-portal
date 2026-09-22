import type { LucideIcon } from 'lucide-react'

export type ModuleKey = 'Departments' | 'Programmes' | 'Admission criteria' | 'Application fees'

export type RowStatus = 'Active' | 'Inactive'

export type CatalogRow = {
  name: string
  code: string
  detail: string
  value: string
  status: RowStatus
}

export type CatalogModule = {
  name: ModuleKey
  icon: LucideIcon
  description: string
  action: string
  columns: [string, string, string, string]
  breadcrumbSection: 'Academic Catalogue' | 'Configuration'
  pageTitle?: string
}
