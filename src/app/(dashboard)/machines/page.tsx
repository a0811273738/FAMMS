import { createClient } from '@/lib/supabase/server'
import { HardDrive } from 'lucide-react'
import { MACHINE_STATUS_LABELS, Machine } from '@/types'

export default async function MachinesPage() {
  const supabase = await createClient()
  const { data: machines } = await supabase
    .from('machines')
    .select('*, area:areas(name), factory:factories(name)')
    .order('machine_code')

  const rows = (machines ?? []) as (Machine & { area: { name: string } | null; factory: { name: string } | null })[]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Mesin</h1>
      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <HardDrive className="w-10 h-10 mx-auto mb-3" />
          <p>Belum ada mesin. Jalankan <code className="text-xs">supabase/seed_demo.sql</code> untuk data contoh.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {rows.map(m => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-mono text-sm font-semibold text-gray-900">{m.machine_code}</p>
                <p className="text-sm text-gray-600">{m.machine_name}</p>
                <p className="text-xs text-gray-400">
                  {m.factory?.name} · {m.area?.name}
                  {m.brand ? ` · ${m.brand}` : ''}{m.model ? ` ${m.model}` : ''}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                {MACHINE_STATUS_LABELS[m.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
