import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../data/seed';
import Avatar from './Avatar';
import Icon from './Icon';
import { ago } from '../utils/time';


export default function Header({ query, setQuery, onMenu }) {
  const { me, notes, unread, markAllRead, markRead, setTheme, still, setStill } = useApp();
  const [open, setOpen] = useState(null); // 'theme' | 'notes' | null
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = (k) => setOpen((o) => (o === k ? null : k));

  return (
    <header ref={ref}>
      <button className="ico menu" onClick={onMenu} aria-label="Menu">
        <Icon name="menu" />
      </button>
      <label className="glass sr" style={{ display: 'flex', flexDirection: 'row' }}>
        <Icon name="search" size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks, people, departments" aria-label="Search tasks" />
      </label>

      <div style={{ position: 'relative' }}>
        <button className="ico" onClick={() => toggle('theme')} aria-label="Themes">
          <Icon name="pal" />
        </button>
        <div className={'glass pop' + (open === 'theme' ? ' o' : '')}>
          <b style={{ padding: 8 }}>Theme</b>
          <div className="sw">
            {THEMES.map(([name, color]) => (
              <button key={name} style={{ background: color }} aria-label={name + ' theme'} onClick={() => setTheme(name)} />
            ))}
          </div>
          <label style={{ flexDirection: 'row', alignItems: 'center', display: 'flex', padding: 8, gap: 8 }}>
            <input type="checkbox" checked={still} onChange={(e) => setStill(e.target.checked)} /> Pause decorative motion
          </label>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <button className="ico" onClick={() => toggle('notes')} aria-label="Notifications">
          <Icon name="bell" />
          {unread > 0 && <span className="dot">{unread}</span>}
        </button>
        <div className={'glass pop' + (open === 'notes' ? ' o' : '')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px' }}>
            <b>Notifications</b>
            <button onClick={markAllRead} style={{ color: 'var(--mut)' }}>Mark all read</button>
          </div>
          {notes.length === 0 && <p className="muted" style={{ padding: 8 }}>You're all caught up.</p>}
          {notes.slice(0, 6).map((n) => {
            const read = n.readBy.includes(me.id);
            return (
              <div key={n.id} className={'note-row' + (read ? ' read' : '')} style={{ padding: '10px 8px', cursor: 'pointer' }} onClick={() => markRead(n.id)}>
                <span className="ndot" />
                <div>
                  <b>{n.title}</b>
                  <div style={{ fontSize: 13, color: 'var(--mut)' }}>{n.msg}</div>
                  <small className="muted">{ago(n.at)}</small>
                </div>
              </div>
            );
          })}
          <a href="#notes" onClick={() => setOpen(null)} style={{ display: 'block', padding: 8, fontWeight: 600, color: 'var(--ink)' }}>
            View all →
          </a>
        </div>
      </div>

      <Avatar user={me} className="ico" style={{ font: '700 13px var(--fb)', color: '#14130f' }} />
    </header>
  );
}
