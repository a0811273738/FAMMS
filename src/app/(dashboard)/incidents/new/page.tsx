import IncidentForm from '@/components/incidents/IncidentForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewIncidentPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/incidents" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Lapor Incident</h1>
        <p className="text-sm text-gray-500">Pilih mesin, klasifikasi kerusakan (fault tree), dan dampak downtime.</p>
      </div>
      <IncidentForm />
    </div>
  )
}
