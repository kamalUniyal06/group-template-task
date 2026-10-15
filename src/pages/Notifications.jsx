import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ago } from '../utils/time';

export default function Notifications() {
  const { me, notes, unread, markRead, markAllRead, notify, resetDemo } = useApp();
  const [filter, setFilter] = useState('all');
  const list = filter === 'unread' ? notes.filter((n) => !n.readBy.includes(me.id)) : notes;

  return (
    <>
      <div className="toolbar">
        <h1>Notifications</h1>
        <div className="tabs" style={{ margin: 0 }}>
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
            All
          </button>
          <button className={filter === 'unread' ? 'on' : ''} onClick={() => setFilter('unread')}>
            Unread ({unread})
          </button>
        </div>
      </div>
      <div className="glass card">
        {list.map((n) => {
          const read = n.readBy.includes(me.id);
          return (
            <div key={n.id} className={'note-row' + (read ? ' read' : '')}>
              <span className="ndot" />
              <div>
                <b>{n.title}</b>
                <br />
                <small className="muted">{n.msg}</small>
                <br />
                <small className="muted">{ago(n.at)}</small>
              </div>
              {!read && (
                <button className="btn g" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => markRead(n.id)}>
                  Mark read
                </button>
              )}
            </div>
          );
        })}
        {!list.length && <p className="muted">Nothing here. You're all caught up.</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="btn g" onClick={markAllRead}>
            Mark all read
          </button>
          <button className="btn g" onClick={() => notify('Deadline tomorrow', 'Brand refresh moodboard is due in 24 hours.', [me.id])}>
            Send test notification
          </button>
          {me.role === 'Company Head' && (
            <button className="btn g" onClick={resetDemo}>
              Reset demo data
            </button>
          )}
        </div>
      </div>
    </>
  );
}
