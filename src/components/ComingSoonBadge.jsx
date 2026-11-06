import React from 'react'
import { Lock } from 'lucide-react'

export default function ComingSoonBadge({ className = '', loading = false, error = false }) {
  return <span className={`inline-flex items-center justify-center gap-1 rounded-full border border-[var(--line)] bg-[var(--lavender)] px-3 py-1.5 text-[12px] font-extrabold text-ink ${className}`}>
    {!loading && <Lock size={14} aria-hidden="true" />}{loading ? 'Loading…' : error ? 'Unavailable' : 'Coming soon'}
  </span>
}
