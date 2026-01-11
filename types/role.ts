// Role-related types

export type UserRole = 'user' | 'vip' | 'admin';

export type RoleDurationType = 'permanent' | 'month' | 'custom_days';

export interface RoleUpdate {
  role: UserRole;
  durationType: RoleDurationType;
  customDays?: number; // Only required if durationType is 'custom_days'
}