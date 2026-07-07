'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Every settings sub-page keeps a back arrow top-left (ch.5.2 rule #5 — always
// a way back) and an optional primary action on the right.
export default function SettingsHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/settings"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
      </div>
      {action}
    </div>
  )
}
