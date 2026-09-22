export type FeeStatus = 'Active' | 'Inactive'

export type ApplicationFee = {
  id: string
  programme: string
  feeType: string
  amount: string
  currency: string
  effectiveFrom: string
  effectiveTo: string | null
  status: FeeStatus
}

export const feeTypes = ['Application Fee', 'Processing Fee', 'Entry Test Fee', 'Document Verification Fee'] as const

export const currencyOptions = ['PKR - Pakistani Rupee', 'USD - US Dollar', 'GBP - Pound Sterling'] as const

export const programmeOfferings = [
  'Bachelor of Computer Science',
  'Bachelor of Business Administration',
  'Bachelor of Engineering',
  'Bachelor of Education',
  'Master of Business Administration',
  'Master of Computer Science',
  'Master of Education',
  'Master of Science in Engineering',
  'PhD in Business Administration',
  'PhD in Computer Science',
  'Bachelor of Software Engineering',
  'Bachelor of Data Science',
] as const

export const applicationFees: ApplicationFee[] = [
  { id: '1', programme: 'Bachelor of Computer Science', feeType: 'Application Fee', amount: '5,000.00', currency: 'PKR', effectiveFrom: 'Jan 01, 2024', effectiveTo: null, status: 'Active' },
  { id: '2', programme: 'Bachelor of Business Administration', feeType: 'Application Fee', amount: '5,000.00', currency: 'PKR', effectiveFrom: 'Jan 01, 2024', effectiveTo: null, status: 'Active' },
  { id: '3', programme: 'Bachelor of Engineering', feeType: 'Application Fee', amount: '5,000.00', currency: 'PKR', effectiveFrom: 'Jan 01, 2024', effectiveTo: null, status: 'Active' },
  { id: '4', programme: 'Master of Business Administration', feeType: 'Processing Fee', amount: '3,000.00', currency: 'PKR', effectiveFrom: 'Jan 15, 2024', effectiveTo: null, status: 'Active' },
  { id: '5', programme: 'Master of Computer Science', feeType: 'Application Fee', amount: '6,000.00', currency: 'PKR', effectiveFrom: 'Jan 01, 2024', effectiveTo: null, status: 'Active' },
  { id: '6', programme: 'Bachelor of Education', feeType: 'Application Fee', amount: '4,500.00', currency: 'PKR', effectiveFrom: 'Feb 01, 2024', effectiveTo: null, status: 'Active' },
  { id: '7', programme: 'PhD in Computer Science', feeType: 'Entry Test Fee', amount: '2,500.00', currency: 'PKR', effectiveFrom: 'Mar 01, 2024', effectiveTo: 'Dec 31, 2025', status: 'Active' },
  { id: '8', programme: 'Bachelor of Software Engineering', feeType: 'Application Fee', amount: '5,000.00', currency: 'PKR', effectiveFrom: 'Jan 01, 2024', effectiveTo: null, status: 'Active' },
  { id: '9', programme: 'Master of Education', feeType: 'Document Verification Fee', amount: '1,500.00', currency: 'PKR', effectiveFrom: 'Jan 10, 2024', effectiveTo: 'Jun 30, 2024', status: 'Inactive' },
  { id: '10', programme: 'Bachelor of Data Science', feeType: 'Application Fee', amount: '5,500.00', currency: 'PKR', effectiveFrom: 'Apr 01, 2024', effectiveTo: null, status: 'Active' },
  { id: '11', programme: 'PhD in Business Administration', feeType: 'Processing Fee', amount: '4,000.00', currency: 'PKR', effectiveFrom: 'May 01, 2024', effectiveTo: null, status: 'Inactive' },
  { id: '12', programme: 'Master of Science in Engineering', feeType: 'Application Fee', amount: '6,500.00', currency: 'PKR', effectiveFrom: 'Jan 01, 2024', effectiveTo: null, status: 'Inactive' },
]

export const applicationFeeStats = {
  totalConfigurations: 12,
  activeFees: 9,
  inactiveFees: 3,
}

export const programmeFilterOptions = ['All', ...programmeOfferings]
export const feeTypeFilterOptions = ['All', ...feeTypes]
