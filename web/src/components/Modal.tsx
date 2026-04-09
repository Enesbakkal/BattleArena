import { useEffect, type ReactNode } from 'react'
import './Modal.css'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-dialog__header">
          <h2 id="modal-title" className="modal-dialog__title">
            {title}
          </h2>
          <button type="button" className="modal-dialog__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="modal-dialog__body">{children}</div>
        {footer != null ? <footer className="modal-dialog__footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
