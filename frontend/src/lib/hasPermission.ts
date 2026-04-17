import type { AuthUser } from '@/types/models'

export function hasPermission(
  permission: string,
  user: Pick<AuthUser, 'is_superadmin' | 'permissions'> | null,
): boolean {
  if (!user) {
    return false
  }
  if (user.is_superadmin) {
    return true
  }
  return user.permissions?.includes(permission) ?? false
}
