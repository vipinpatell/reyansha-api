export const USER_GENDERS = [
  'male',
  'female',
  'other',
  'prefer_not_to_say',
] as const;

export const USER_PREFIXES = ['mr', 'mrs', 'ms', 'dr', 'prof', 'mx', 'none'] as const;

export const USER_TYPES = [
  'superadmin',
  'admin',
  'hr',
  'accountant',
  'recruiter',
  'sales',
  'manager',
  'techlead',
  'qalead',
  'employee',
  'third_party',
  'marketing',
  'support',
] as const;

export const USER_DEPARTMENTS = [
  'engineering',
  'hr',
  'finance',
  'sales',
  'marketing',
  'operations',
  'administration',
] as const;

export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'intern',
  'consultant',
] as const;

export const WORK_LOCATIONS = ['office', 'remote', 'hybrid'] as const;
