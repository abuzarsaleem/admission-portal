export type DepartmentStatus = 'Active' | 'Inactive'

export type Department = {
  name: string
  code: string
  description: string
  programmes: number
  status: DepartmentStatus
  createdOn: string
  updatedOn: string
  createdBy: string
  updatedBy: string
}

export const departments: Department[] = [
  { name: 'Business Administration', code: 'BBA', description: 'Department of business and management studies.', programmes: 6, status: 'Active', createdOn: 'Jan 10, 2024', updatedOn: 'Aug 22, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Computer Science', code: 'CS', description: 'Department of computer science and technology.', programmes: 8, status: 'Active', createdOn: 'Jan 15, 2024', updatedOn: 'Sep 10, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Education', code: 'EDU', description: 'Department of education and teacher training.', programmes: 5, status: 'Active', createdOn: 'Jan 12, 2024', updatedOn: 'Jul 18, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Engineering', code: 'ENG', description: 'Department of engineering and applied sciences.', programmes: 7, status: 'Active', createdOn: 'Jan 14, 2024', updatedOn: 'Sep 02, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Health Sciences', code: 'HS', description: 'Department of health and medical sciences.', programmes: 3, status: 'Active', createdOn: 'Feb 01, 2024', updatedOn: 'Aug 05, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Law', code: 'LAW', description: 'Department of law and legal studies.', programmes: 2, status: 'Active', createdOn: 'Feb 05, 2024', updatedOn: 'Jun 30, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Liberal Arts', code: 'LA', description: 'Department of liberal arts and humanities.', programmes: 4, status: 'Active', createdOn: 'Feb 08, 2024', updatedOn: 'Aug 12, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Medicine', code: 'MED', description: 'Department of medicine and clinical studies.', programmes: 1, status: 'Active', createdOn: 'Feb 10, 2024', updatedOn: 'Sep 01, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Nursing', code: 'NUR', description: 'Department of nursing and healthcare.', programmes: 2, status: 'Active', createdOn: 'Feb 12, 2024', updatedOn: 'Jul 25, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Pharmacy', code: 'PHR', description: 'Department of pharmacy and pharmaceutical sciences.', programmes: 1, status: 'Active', createdOn: 'Feb 15, 2024', updatedOn: 'Aug 28, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Social Sciences', code: 'SS', description: 'Department of social sciences and public policy.', programmes: 3, status: 'Active', createdOn: 'Feb 18, 2024', updatedOn: 'Sep 05, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
  { name: 'Arts & Design', code: 'ART', description: 'Department of arts, design and creative studies.', programmes: 4, status: 'Inactive', createdOn: 'Mar 01, 2024', updatedOn: 'May 14, 2026', createdBy: 'Admissions Admin', updatedBy: 'Admissions Admin' },
]

export function getDepartmentByCode(code: string) {
  return departments.find(dept => dept.code.toLowerCase() === code.toLowerCase())
}

export const departmentStats = {
  totalDepartments: 12,
  totalProgrammes: 50,
  activeDepartments: 11,
  inactiveDepartments: 1,
}

export const sortOptions = ['Name A - Z', 'Name Z - A', 'Code A - Z', 'Code Z - A'] as const
export type SortOption = (typeof sortOptions)[number]
