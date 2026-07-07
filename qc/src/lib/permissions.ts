// Role → capability map. One place decides what each role can see/do, so nav,
// layouts and API guards stay consistent (ch.7 — "權限即介面").
//
// Role ladder: inspector < supervisor < manager < admin.
import type { UserRole } from '@/types/qc'

const RANK: Record<UserRole, number> = {
  inspector: 1,
  supervisor: 2,
  manager: 3,
  admin: 4,
}

// True when `role` is at least as senior as `min`.
export function atLeast(role: UserRole | undefined | null, min: UserRole): boolean {
  if (!role) return false
  return RANK[role] >= RANK[min]
}

export const PERMISSIONS = {
  // Enter the settings area (product/test-item/customer/spec/template masters).
  viewSettings: (r: UserRole) => atLeast(r, 'supervisor'),
  // Maintain master data.
  manageMasterData: (r: UserRole) => atLeast(r, 'supervisor'),
  // Review / sign off inspections.
  reviewInspections: (r: UserRole) => atLeast(r, 'supervisor'),
  // Approve a spec version change.
  approveSpec: (r: UserRole) => atLeast(r, 'manager'),
  // Release a CCP-linked non-conformance (HACCP: manager+ only).
  releaseCcp: (r: UserRole) => atLeast(r, 'manager'),
  // Dashboards / reports / exports.
  viewDashboard: (r: UserRole) => atLeast(r, 'supervisor'),
  // User / factory / system admin.
  admin: (r: UserRole) => atLeast(r, 'admin'),
} as const
