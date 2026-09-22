export type MandatoryValue = 'Yes' | 'No'

export type AdmissionCriterion = {
  id: string
  criterionType: string
  criteriaRequirement: string
  mandatory: MandatoryValue
  effectiveFrom: string
  effectiveTo: string | null
}

export const criterionTypes = [
  'Academic Qualification',
  'Subject Requirement',
  'English Proficiency',
  'Work Experience',
  'Age Requirement',
  'Entry Test Score',
  'Interview',
  'Document Submission',
  'Medical Fitness',
  'Character Certificate',
  'Nationality Requirement',
  'Portfolio Review',
] as const

export const admissionCriteria: AdmissionCriterion[] = [
  { id: '1', criterionType: 'Academic Qualification', criteriaRequirement: 'Minimum 60% in Intermediate', mandatory: 'Yes', effectiveFrom: 'Jan 01, 2024', effectiveTo: null },
  { id: '2', criterionType: 'Subject Requirement', criteriaRequirement: 'Mathematics required', mandatory: 'Yes', effectiveFrom: 'Jan 01, 2024', effectiveTo: null },
  { id: '3', criterionType: 'English Proficiency', criteriaRequirement: 'IELTS 6.0 or equivalent', mandatory: 'No', effectiveFrom: 'Jan 01, 2024', effectiveTo: 'Dec 31, 2025' },
  { id: '4', criterionType: 'Work Experience', criteriaRequirement: 'Minimum 2 years relevant experience', mandatory: 'No', effectiveFrom: 'Feb 01, 2024', effectiveTo: null },
  { id: '5', criterionType: 'Age Requirement', criteriaRequirement: 'Applicant must be between 17 and 25 years', mandatory: 'Yes', effectiveFrom: 'Jan 01, 2024', effectiveTo: null },
  { id: '6', criterionType: 'Entry Test Score', criteriaRequirement: 'Minimum 50% in university entry test', mandatory: 'Yes', effectiveFrom: 'Jan 15, 2024', effectiveTo: null },
  { id: '7', criterionType: 'Interview', criteriaRequirement: 'Successful completion of admission interview', mandatory: 'Yes', effectiveFrom: 'Mar 01, 2024', effectiveTo: null },
  { id: '8', criterionType: 'Document Submission', criteriaRequirement: 'All required documents must be submitted', mandatory: 'Yes', effectiveFrom: 'Jan 01, 2024', effectiveTo: null },
  { id: '9', criterionType: 'Medical Fitness', criteriaRequirement: 'Medical fitness certificate required', mandatory: 'No', effectiveFrom: 'Apr 01, 2024', effectiveTo: 'Mar 31, 2025' },
  { id: '10', criterionType: 'Character Certificate', criteriaRequirement: 'Character certificate from previous institution', mandatory: 'Yes', effectiveFrom: 'Jan 01, 2024', effectiveTo: null },
  { id: '11', criterionType: 'Nationality Requirement', criteriaRequirement: 'Open to all nationalities', mandatory: 'Yes', effectiveFrom: 'Jan 01, 2024', effectiveTo: null },
  { id: '12', criterionType: 'Portfolio Review', criteriaRequirement: 'Portfolio required for design programmes', mandatory: 'Yes', effectiveFrom: 'May 01, 2024', effectiveTo: null },
  { id: '13', criterionType: 'Academic Qualification', criteriaRequirement: 'Bachelor degree with minimum 2.5 CGPA', mandatory: 'Yes', effectiveFrom: 'Jan 01, 2024', effectiveTo: null },
  { id: '14', criterionType: 'Subject Requirement', criteriaRequirement: 'Physics and Chemistry at intermediate level', mandatory: 'Yes', effectiveFrom: 'Jun 01, 2024', effectiveTo: null },
  { id: '15', criterionType: 'English Proficiency', criteriaRequirement: 'TOEFL 80 or equivalent', mandatory: 'Yes', effectiveFrom: 'Jan 01, 2024', effectiveTo: null },
  { id: '16', criterionType: 'Entry Test Score', criteriaRequirement: 'Minimum 60% in GAT general', mandatory: 'Yes', effectiveFrom: 'Jul 01, 2024', effectiveTo: null },
  { id: '17', criterionType: 'Work Experience', criteriaRequirement: 'Teaching experience preferred', mandatory: 'Yes', effectiveFrom: 'Aug 01, 2024', effectiveTo: null },
  { id: '18', criterionType: 'Interview', criteriaRequirement: 'Panel interview for shortlisted candidates', mandatory: 'No', effectiveFrom: 'Sep 01, 2024', effectiveTo: 'Aug 31, 2025' },
]

export const admissionCriteriaStats = {
  totalCriteria: 18,
  mandatoryCriteria: 14,
}

export const criterionTypeFilterOptions = ['All', ...criterionTypes]
export const mandatoryFilterOptions = ['All', 'Yes', 'No'] as const
