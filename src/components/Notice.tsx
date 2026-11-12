import { useEffect, useState } from 'react'
import { Check, Info, X } from 'lucide-react'

export function Notice({
  notice,
  onClose,
}: {
  notice: { text: string; error: boolean }
  onClose: () => void
}) {
  const { text, error } = notice
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (error || paused) return
    const timer = window.setTimeout(onClose, 8000)
    return () => window.clearTimeout(timer)
  }, [notice, error, paused, onClose])

  return (
    <div
      className={error ? 'toast error-toast' : 'toast'}
      role={error ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {error ? <Info size={20} /> : <Check size={20} />}
      <span>{text}</span>
      <button className="icon-button" aria-label="إغلاق الإشعار" onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  )
}
