import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRIORITIES, STATUS } from '../data/constants';
import { isLate } from '../data/permissions';
import TaskCard from '../components/TaskCard';

const COLUMNS = [
  ['title', 'Task'],
  ['assignee', 'Owner'],
  ['priority', 'Priority'],
  ['status', 'Status'],
  ['due', 'Due'],
];
const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

const sortValue = (t, key, nameOf) => {
  if (key === 'number') return t.number;
  if (key === 'assignee') return nameOf(t.assignee);
  if (key === 'priority') return PRIORITY_RANK[t.priority];
  if (key === 'status') return Object.keys(STATUS).indexOf(t.status);
  return t[key];
};

export default function Tasks({ query, onNew, onOpen }) {
  const { me, users, visible, moveTask, userById } = useApp();
  const nameOf = (id) => userById(id).name;
  const [tab, setTab] = useState('board');
  const [sort, setSort] = useState({ key: 'due', dir: 1 });
  const [prio, setPrio] = useState('');
  const [owner, setOwner] = useState('');
  const [over, setOver] = useState(null);

  const q = query.toLowerCase();
  const T = visible.filter(
    (t) =>
      (!q || (t.title + t.dept + t.key + nameOf(t.assignee)).toLowerCase().includes(q)) &&
      (!prio || t.priority === prio) &&
      (!owner || t.assignee === owner),
  );
  const owners = users.filter((u) => visible.some((t) => t.assignee === u.id));

  const sorted = [...T].sort((a, b) => {
    const x = sortValue(a, sort.key, nameOf);
    const y = sortValue(b, sort.key, nameOf);
    return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
  });

  const sortBy = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));

  return (
    <>
      <div className="toolbar">
        <h1>{me.perm.can_view_all ? 'All tasks' : me.perm.can_view_team ? me.dept + ' tasks' : 'My tasks'}</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="tabs" style={{ margin: 0 }}>
            <button className={tab === 'board' ? 'on' : ''} onClick={() => setTab('board')}>
              Board
            </button>
            <button className={tab === 'table' ? 'on' : ''} onClick={() => setTab('table')}>
              Table
            </button>
          </div>
          <button className="btn y" onClick={onNew}>
            + New task
          </button>
        </div>
      </div>

      <div className="filters" style={{ marginBottom: 14 }}>
        <select value={prio} onChange={(e) => setPrio(e.target.value)} aria-label="Filter by priority">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        {owners.length > 1 && (
          <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Filter by owner">
            <option value="">Everyone</option>
            {owners.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
        {(prio || owner || q) && <small className="muted" style={{ alignSelf: 'center' }}>{T.length} matching</small>}
      </div>

      {tab === 'board' ? (
        <div className="kb">
          {Object.entries(STATUS).map(([s, label]) => {
            const col = T.filter((t) => t.status === s);
            return (
              <div
                key={s}
                className={'glass col' + (over === s ? ' over' : '')}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(s);
                }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  moveTask(e.dataTransfer.getData('text/plain'), s);
                }}
              >
                <h3>
                  {label}
                  <span className="pill">{col.length}</span>
                </h3>
                {col.map((t) => (
                  <TaskCard key={t.id} task={t} onOpen={onOpen} />
                ))}
                {!col.length && <small className="muted">Drop a task here</small>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass card tw">
          <table>
            <thead>
              <tr>
                {COLUMNS.map(([k, label]) => (
                  <th key={k} tabIndex={0} onClick={() => sortBy(k)} onKeyDown={(e) => e.key === 'Enter' && sortBy(k)}>
                    {label}
                    {sort.key === k ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.id} onClick={() => onOpen(t.id)}>
                  <td>
                    <b>{t.title}</b>
                    <br />
                    <small>
                      {t.key} · {t.dept}
                    </small>
                  </td>
                  <td>{nameOf(t.assignee)}</td>
                  <td>
                    <span className={'pill p-' + t.priority}>{t.priority}</span>
                  </td>
                  <td>{STATUS[t.status]}</td>
                  <td style={isLate(t) ? { color: '#e5484d', fontWeight: 600 } : undefined}>{t.due}</td>
                </tr>
              ))}
              {!sorted.length && (
                <tr>
                  <td colSpan={5} className="muted">
                    No tasks match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
