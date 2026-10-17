import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ago } from '../utils/time';

export default function Notifications({ onOpen }) {
  const { notes, tasks, unread, markRead, markAllRead, notify, reload } = useApp();
  const [filter, setFilter] = useState('all');
  const list = filter === 'unread' ? notes.filter((n) => !n.read) : notes;

  const open = (n) => {
    if (!n.read) markRead(n.id);
    if (n.taskId && tasks.some((t) => t.id === n.taskId)) onOpen(n.taskId);
  };

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
        {list.map((n) => (
          <div key={n.id} className={'note-row' + (n.read ? ' read' : '')} style={{ cursor: n.taskId ? 'pointer' : 'default' }} onClick={() => open(n)}>
            <span className="ndot" />
            <div>
              <b>{n.title}</b>
              <br />
              <small className="muted">{n.msg}</small>
              <br />
              <small className="muted">{ago(n.at)}</small>
            </div>
            {!n.read && (
              <button
                className="btn g"
                style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={(e) => {
                  e.stopPropagation();
                  markRead(n.id);
                }}
              >
                Mark read
              </button>
            )}
          </div>
        ))}
        {!list.length && <p className="muted">Nothing here. You're all caught up.</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="btn g" onClick={markAllRead}>
            Mark all read
          </button>
          <button className="btn g" onClick={() => notify('Test notification', 'Notifications are stored in SugarCRM (Task Notifications module).')}>
            Send test notification
          </button>
          <button className="btn g" onClick={reload}>
            Refresh
          </button>
        </div>
      </div>
    </>
  );
}
