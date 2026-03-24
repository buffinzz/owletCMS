import { canAccessAdmin } from './roleUtils';

export function getAuthLandingPath(role?: string | null) {
  if (role === 'patron') return '/my-account';
  return canAccessAdmin(role) ? '/admin' : '/';
}
