export const PERMISSIONS = [
  'users.read',
  'users.read_limited',
  'users.create',
  'users.update',
  'users.update_own',
  'users.deactivate',
  'roles.read',
  'roles.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [...PERMISSIONS],
  hr: [
    'users.read',
    'users.create',
    'users.update',
    'users.deactivate',
    'users.update_own',
    'roles.read',
  ],
  tech_lead: ['users.read_limited', 'users.update_own'],
  employee: ['users.update_own'],
  admin: [
    'users.read',
    'users.create',
    'users.update',
    'users.deactivate',
    'users.update_own',
  ],
  accountant: ['users.update_own'],
  recruiter: ['users.read_limited', 'users.update_own'],
  sales: ['users.update_own'],
  manager: ['users.read_limited', 'users.update_own'],
  qa_lead: ['users.read_limited', 'users.update_own'],
  third_party: [],
  marketing: ['users.update_own'],
  support: ['users.read_limited', 'users.update_own'],
};

export const DEFAULT_ROLE_NAMES: Record<string, string> = {
  super_admin: 'Super Admin',
  hr: 'HR',
  tech_lead: 'Tech Lead',
  employee: 'Employee',
  admin: 'Admin',
  accountant: 'Accountant',
  recruiter: 'Recruiter',
  sales: 'Sales',
  manager: 'Manager',
  qa_lead: 'QA Lead',
  third_party: 'Third Party',
  marketing: 'Marketing',
  support: 'Support',
};
