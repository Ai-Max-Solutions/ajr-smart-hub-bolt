export const USER_ROLES = {
  OPERATIVE: 'operative',
  SUPERVISOR: 'supervisor', 
  PM: 'pm',
  ADMIN: 'admin',
  DPO: 'dpo',
  DIRECTOR: 'director'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLE_HIERARCHY = {
  [USER_ROLES.OPERATIVE]: 1,
  [USER_ROLES.SUPERVISOR]: 2,
  [USER_ROLES.PM]: 3,
  [USER_ROLES.DIRECTOR]: 4,
  [USER_ROLES.ADMIN]: 5,
  [USER_ROLES.DPO]: 5
} as const;

export const DASHBOARD_ACCESS: Record<UserRole, readonly string[]> = {
  [USER_ROLES.ADMIN]: ['admin_dashboard', 'pm_dashboard', 'director_dashboard'],
  [USER_ROLES.DPO]: ['admin_dashboard', 'pm_dashboard', 'director_dashboard', 'privacy_dashboard'],
  [USER_ROLES.DIRECTOR]: ['director_dashboard'],
  [USER_ROLES.PM]: ['pm_dashboard'],
  [USER_ROLES.SUPERVISOR]: [],
  [USER_ROLES.OPERATIVE]: []
};

export const ADMIN_ROLES: readonly UserRole[] = [USER_ROLES.ADMIN, USER_ROLES.DPO];
export const MANAGEMENT_ROLES: readonly UserRole[] = [USER_ROLES.ADMIN, USER_ROLES.DPO, USER_ROLES.DIRECTOR, USER_ROLES.PM];

export const ACTIVATION_STATUS = {
  PROVISIONAL: 'provisional',
  ACTIVE: 'active', 
  PENDING: 'pending',
  INACTIVE: 'inactive'
} as const;

export type ActivationStatus = typeof ACTIVATION_STATUS[keyof typeof ACTIVATION_STATUS];

export const PROVISIONAL_ACCESS_HOURS = 24;
