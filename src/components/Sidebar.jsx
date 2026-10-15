import { useApp } from '../context/AppContext';
import { isReviewer } from '../data/permissions';
import Icon from './Icon';
import { NAV } from '../data/nav';

export default function Sidebar({ view, mobileOpen, onNavigate }) {
  const { me, visible, unread, collapsed, setCollapsed, logout } = useApp();
  const pending = visible.filter((t) => t.status === 'review').length;
  const badge = { review: isReviewer(me) ? pending : 0, notes: unread };

  return (
    <nav className={'glass' + (collapsed ? ' c' : '') + (mobileOpen ? ' m' : '')} style={{ borderRadius: '0 26px 26px 0' }}>
      <div className="logo">
        <b>T</b>
        <span className="lb">Taskflow</span>
      </div>
      {NAV.map(([key, label, icon]) => (
        <a key={key} href={'#' + key} className={view === key ? 'on' : ''} onClick={onNavigate}>
          <Icon name={icon} />
          <span className="lb" style={{ flex: 1 }}>{label}</span>
          {badge[key] > 0 && <span className="pill lb" style={{ background: 'var(--acc)', color: 'var(--on)' }}>{badge[key]}</span>}
        </a>
      ))}
      <div style={{ flex: 1 }} />
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          logout();
        }}
      >
        <Icon name="out" />
        <span className="lb">Sign out</span>
      </a>
      <button className="cb btn g" onClick={() => setCollapsed(!collapsed)} aria-label="Collapse sidebar">
        ⇔<span className="lb">Collapse</span>
      </button>
    </nav>
  );
}
