import {
  Activity,
  Building2,
  CircleDollarSign,
  FileCheck2,
  GraduationCap,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type AppNavItem = {
  label: string
  to: string
  icon: LucideIcon
  section: string
}

/** Destinations available in the app sidebar — used by nav and header search. */
export const appNavItems: AppNavItem[] = [
  { label: 'Intakes', to: '/intakes', icon: FileCheck2, section: 'Admissions' },
  { label: 'Programmes', to: '/catalog/programmes', icon: GraduationCap, section: 'Academic Catalogue' },
  { label: 'Departments', to: '/catalog/departments', icon: Building2, section: 'Academic Catalogue' },
  {
    label: 'Admission Criteria',
    to: '/configuration/admission-criteria',
    icon: FileCheck2,
    section: 'Configuration',
  },
  {
    label: 'Application Fees',
    to: '/configuration/application-fees',
    icon: CircleDollarSign,
    section: 'Configuration',
  },
  { label: 'Audit & Activity', to: '/audit-activity', icon: Activity, section: 'System' },
  { label: 'Settings', to: '/settings', icon: Settings, section: 'System' },
]
