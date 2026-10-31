import { useEffect, useRef } from 'react'

export default function useDialogFocus(open, onClose) {
  const dialog = useRef(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    const controls = () => [...(dialog.current?.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [])]
      .filter(element => !element.disabled && element.getClientRects().length)
    const frame = requestAnimationFrame(() => controls()[0]?.focus({ preventScroll: true }))
    const keydown = event => {
      // A nested parent check owns its keys while it is in front.
      if (document.activeElement?.closest('[role="dialog"]') !== dialog.current) return
      if (event.key === 'Escape') { event.preventDefault(); close.current?.(); return }
      if (event.key !== 'Tab') return
      const list = controls(), first = list[0], last = list.at(-1)
      if (!first) { event.preventDefault(); return }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [open])
  return dialog
}
