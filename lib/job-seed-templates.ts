export type JobSeedTemplate = {
  key: string
  label: string
  title: string
  level: 'C_SUITE' | 'VP' | 'DIRECTOR' | 'MANAGER' | 'OTHER_EXECUTIVE'
  department?: string
  locationCity?: string
  locationState?: string
  locationCountry?: string
  remoteAllowed?: boolean
  hybridAllowed?: boolean
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  summary: string
  responsibilities: string[]
  requirements: string[]
  healthcareSetting?: string
  facilityType?: string
  specialties?: string[]
}

export const jobSeedTemplates: JobSeedTemplate[] = [
  {
    key: 'chief-clinical-innovation',
    label: 'Chief Clinical Innovation Officer',
    title: 'Chief Clinical Innovation Officer',
    level: 'C_SUITE',
    department: 'Executive Leadership',
    locationCity: 'Boston',
    locationState: 'MA',
    locationCountry: 'USA',
    remoteAllowed: false,
    hybridAllowed: true,
    salaryMin: 320000,
    salaryMax: 410000,
    salaryCurrency: 'usd',
    summary:
      'Lead enterprise-wide transformation initiatives focused on clinical excellence, digital health integration, and measurable outcomes.',
    responsibilities: [
      'Build a multi-year innovation roadmap across acute, ambulatory, and post-acute service lines',
      'Partner with CMIO/CNIO teams to align EHR optimization with bedside workflows',
      'Stand up executive-level dashboards to track patient safety, quality, and financial impact',
    ],
    requirements: [
      '15+ years of progressive leadership in integrated delivery systems',
      'Demonstrated success launching tech-enabled care models',
      'Clinical degree (MD, DO, or RN with doctorate) strongly preferred',
    ],
    healthcareSetting: 'Integrated Delivery Network',
    facilityType: 'Academic Medical Center',
    specialties: ['Population Health', 'Digital Transformation', 'Value-Based Care'],
  },
  {
    key: 'vp-revenue-cycle',
    label: 'VP of Revenue Cycle Optimization',
    title: 'Vice President, Revenue Cycle Optimization',
    level: 'VP',
    department: 'Finance / Revenue',
    locationCity: 'Chicago',
    locationState: 'IL',
    locationCountry: 'USA',
    remoteAllowed: true,
    hybridAllowed: true,
    salaryMin: 220000,
    salaryMax: 285000,
    salaryCurrency: 'usd',
    summary:
      'Oversee enterprise revenue integrity, denials prevention, and RCM modernization for a multi-state health system.',
    responsibilities: [
      'Implement AI-assisted coding and documentation improvement programs',
      'Drive KPI transparency across pre-service, mid-cycle, and back-end teams',
      'Lead payer collaboration strategies and contract performance reviews',
    ],
    requirements: [
      '10+ years leading large-scale revenue cycle organizations',
      'Expertise with Epic Resolute or equivalent platforms',
      'Track record improving yield, clean claim rates, and net days in AR',
    ],
    healthcareSetting: 'Multi-Hospital System',
    facilityType: 'Nonprofit',
    specialties: ['Revenue Integrity', 'Automation', 'Denials Prevention'],
  },
  {
    key: 'system-nursing-ops',
    label: 'System VP of Nursing Operations',
    title: 'System Vice President, Nursing Operations',
    level: 'VP',
    department: 'Clinical Operations',
    locationCity: 'Dallas',
    locationState: 'TX',
    locationCountry: 'USA',
    remoteAllowed: false,
    hybridAllowed: false,
    salaryMin: 250000,
    salaryMax: 320000,
    salaryCurrency: 'usd',
    summary:
      'Drive consistent nursing operations, workforce optimization, and quality programs across 40+ inpatient units.',
    responsibilities: [
      'Standardize staffing models, acuity tools, and float pools system-wide',
      'Partner with CNO and HR to launch leadership academies and retention strategies',
      'Align quality, magnet, and patient experience initiatives with operational KPIs',
    ],
    requirements: [
      'Master’s in Nursing or Healthcare Administration',
      'Experience managing >1500 FTEs in acute care settings',
      'Demonstrated success in regulatory readiness and nursing informatics',
    ],
    healthcareSetting: 'Regional Health System',
    facilityType: 'Magnet Hospitals',
    specialties: ['Nursing Workforce', 'Quality & Safety', 'Inpatient Operations'],
  },
]

export function getJobTemplate(key: string) {
  return jobSeedTemplates.find((template) => template.key === key)
}

