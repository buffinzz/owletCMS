const ADMIN_DASHBOARD_ROLES = new Set(['admin', 'editor', 'staff']);
const CONTENT_EDITOR_ROLES = new Set(['admin', 'editor']);

export function canAccessAdmin(role?: string | null) {
  return !!role && ADMIN_DASHBOARD_ROLES.has(role);
}

export function canEditContent(role?: string | null) {
  return !!role && CONTENT_EDITOR_ROLES.has(role);
}

export function isAdminRole(role?: string | null) {
  return role === 'admin';
}
