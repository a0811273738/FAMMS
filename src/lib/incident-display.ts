import type { IncidentStatus, UserRole } from '@/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  technician: 'Teknisi',
  supervisor: 'Supervisor',
  manager: 'Manajer',
  director: 'Direktur',
  admin: 'Admin',
}

// Keep ROLE_ZH as alias for backward compatibility
export const ROLE_ZH = ROLE_LABELS

export const ISSUE_TYPE_LABELS: Record<string, string> = {
  machine: '🔧 Kerusakan Mesin',
  pipe: '🚿 Pipa / Saluran',
  electrical: '💡 Listrik / Pencahayaan',
  facility: '🏭 Fasilitas / Infrastruktur',
  safety: '⚠️ Masalah Keselamatan',
  cleanliness: '🧹 Kebersihan',
  other: '📋 Lainnya',
}

export const URGENCY_FROM_IMPACT: Record<string, { label: string; color: string }> = {
  A: { label: '🔴 Kritis', color: 'bg-red-100 text-red-700' },
  B: { label: '🟠 Tinggi', color: 'bg-orange-100 text-orange-700' },
  C: { label: '🟡 Sedang', color: 'bg-yellow-100 text-yellow-700' },
  D: { label: '🟢 Rendah', color: 'bg-green-100 text-green-700' },
}

export const STATUS_ZH: Record<IncidentStatus, string> = {
  reported: 'Dilaporkan',
  accepted: 'Diterima',
  analyzing: 'Dianalisis',
  waiting_parts: 'Tunggu Spare',
  waiting_approval: 'Tunggu Persetujuan',
  waiting_vendor: 'Tunggu Vendor',
  waiting_shutdown: 'Tunggu Shutdown',
  repairing: 'Perbaikan',
  testing: 'Pengujian',
  observation: 'Observasi',
  closed: 'Selesai',
}

export const STATUS_ZH_COLOR: Record<IncidentStatus, string> = {
  reported: 'bg-blue-100 text-blue-700',
  accepted: 'bg-sky-100 text-sky-700',
  analyzing: 'bg-purple-100 text-purple-700',
  waiting_parts: 'bg-amber-100 text-amber-700',
  waiting_approval: 'bg-amber-100 text-amber-700',
  waiting_vendor: 'bg-amber-100 text-amber-700',
  waiting_shutdown: 'bg-amber-100 text-amber-700',
  repairing: 'bg-purple-100 text-purple-700',
  testing: 'bg-indigo-100 text-indigo-700',
  observation: 'bg-teal-100 text-teal-700',
  closed: 'bg-green-100 text-green-700',
}

export const BOARD_FILTERS: { key: string; label: string; statuses: IncidentStatus[] | null }[] = [
  { key: 'all', label: 'Semua', statuses: null },
  { key: 'reported', label: 'Dilaporkan', statuses: ['reported'] },
  { key: 'accepted', label: 'Diterima', statuses: ['accepted'] },
  { key: 'progress', label: 'Proses', statuses: ['analyzing', 'repairing'] },
  { key: 'waiting', label: 'Menunggu', statuses: ['waiting_parts', 'waiting_approval', 'waiting_vendor', 'waiting_shutdown'] },
  { key: 'confirm', label: 'Konfirmasi', statuses: ['testing', 'observation'] },
  { key: 'closed', label: 'Selesai', statuses: ['closed'] },
]
