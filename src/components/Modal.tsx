import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const subtitleId = useId()
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    dialog
      ?.querySelector<HTMLElement>('[data-autofocus], input:not([type="radio"]), textarea')
      ?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const nodes = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        ).filter((node) => node.getClientRects().length > 0)
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onClick={(event) => {
        const bounds = ref.current?.getBoundingClientRect()
        if (
          event.target === ref.current &&
          bounds &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom)
        )
          onClose()
      }}
    >
      <header className="modal-header">
        <div>
          <span className="eyebrow">مساحة لخير بيتك</span>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p id={subtitleId}>{subtitle}</p>}
        </div>
        <button type="button" className="icon-button" aria-label="إغلاق النافذة" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  )
}

export function ConfirmModal({
  title,
  children,
  confirm,
  onConfirm,
  onClose,
  danger = false,
}: {
  title: string
  children: ReactNode
  confirm: string
  onConfirm: () => void
  onClose: () => void
  danger?: boolean
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm-copy">{children}</div>
      <div className="modal-actions">
        <button
          type="button"
          className={danger ? 'button danger' : 'button primary'}
          onClick={onConfirm}
        >
          {confirm}
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={onClose}
          autoFocus
          data-autofocus
        >
          إلغاء
        </button>
      </div>
    </Modal>
  )
}
