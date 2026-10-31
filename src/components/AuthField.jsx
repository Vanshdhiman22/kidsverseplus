import React, { useId } from 'react'

// Keep action buttons outside the label so they do not change the input's name.
export default function AuthField({ id: suppliedId, label, icon: Icon, type = 'text', right, error, ...inputProps }) {
  const generatedId = useId()
  const id = suppliedId || generatedId
  return <div className="auth-field">
    <label htmlFor={id} className="block text-[19px] font-extrabold text-ink mb-2">{label}</label>
    <div className="relative">
      <Icon aria-hidden="true" size={24} strokeWidth={2.2} className="absolute left-6 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
      <input {...inputProps} id={id} type={type} className="input" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} style={{ paddingRight: right ? 64 : 24, ...(error ? { borderColor: 'var(--red)' } : {}) }} />
      {right && <div className="auth-field__action absolute right-2 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
    {error && <p id={`${id}-error`} className="mt-1 text-[15px] font-bold text-red-600">{error}</p>}
  </div>
}
