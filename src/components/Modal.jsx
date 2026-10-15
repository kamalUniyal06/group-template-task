import { useEffect } from 'react';
import Icon from './Icon';

export default function Modal({ title, onClose, wide, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ov o" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'glass md' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <h2>
          {title}
          <button type="button" className="x" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </h2>
        {children}
      </div>
    </div>
  );
}
