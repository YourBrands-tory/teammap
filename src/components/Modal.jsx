import { useEffect } from 'react';

export default function Modal({ onClose, children, large }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => {
      const target = e.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;
      if (isTyping) return;
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEsc);
    };
  }, [onClose]);

  return (
    <div className="mbg" onMouseDown={(e) => e.target.classList.contains('mbg') && onClose()}>
      <div className={`modal${large ? ' modal-lg' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
