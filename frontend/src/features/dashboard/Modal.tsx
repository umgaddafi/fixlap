import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export default function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    const trigger = document.activeElement as HTMLElement | null;
    node?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { node?.close(); document.body.style.overflow = overflow; trigger?.focus(); };
  }, []);
  return <dialog className="staff-modal" ref={dialog} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }} aria-labelledby="staff-dialog-title"><div className="staff-modal-head"><div><p className="staff-eyebrow">KENDAT FIXLAP WORKSPACE</p><h2 id="staff-dialog-title">{title}</h2>{subtitle && <p className="staff-muted">{subtitle}</p>}</div><button className="staff-icon-btn" onClick={onClose} aria-label="Close dialog"><X size={21}/></button></div><div className="staff-modal-body">{children}</div></dialog>;
}
