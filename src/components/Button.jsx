import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '../lib/utils.js'
import { sfx } from '../lib/sound.js'

export default function Button({ variant = 'primary', size = 'md', icon, arrow, sub, children, className, onClick, sound = 'tap', ...rest }) {
  return (
    <button
      className={cn('btn', `btn-${variant}`, `btn-${size}`, sub && 'flex-col gap-0 leading-none', className)}
      onMouseEnter={() => sfx.hover()}
      onClick={e => { if (sound) sfx[sound]?.(); onClick?.(e) }}
      {...rest}
    >
      {sub ? (
        <>
          <span className="flex items-center gap-3">{icon}{children}{arrow && <ArrowRight className="arrow" size={size === 'lg' ? 28 : 22} strokeWidth={2.75} />}</span>
          <span className="mt-1 text-[15px] font-body font-semibold opacity-90 tracking-normal normal-case">{sub}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
          {arrow && <ArrowRight className="arrow" size={size === 'lg' ? 28 : 22} strokeWidth={2.75} />}
        </>
      )}
    </button>
  )
}
