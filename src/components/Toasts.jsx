import { useApp } from '../context/AppContext';

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div id="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="ts glass" style={{ background: 'var(--dk)' }}>
          <div className="i">{t.icon}</div>
          <div>
            <b>{t.title}</b>
            <small>{t.msg}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
