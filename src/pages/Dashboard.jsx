import { useApp } from '../context/AppContext';
import { USERS } from '../data/seed';
import { isLate } from '../data/permissions';
import Avatar from '../components/Avatar';
import CountUp from '../components/CountUp';
import FocusTimer from '../components/FocusTimer';

const PRIORITY_COLORS = ['#e5484d', '#ff9a3d', 'var(--acc)', 'var(--line)'];
const R = 44;
const C = 2 * Math.PI * R;

// Tasks marked done per weekday over the last 7 days (based on due date for the demo).
const weekly = (tasks) => {
  const out = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  tasks
    .filter((t) => t.status === 'done')
    .forEach((t) => {
      const d = new Date(t.due);
      if ((now - d) / 864e5 <= 7) out[(d.getDay() + 6) % 7]++;
    });
  return out;
};

export default function Dashboard({ onNew, onOpen }) {
  const { me, visible: T } = useApp();
  const mine = T.filter((t) => t.assignee === me.id);
  const open = mine.filter((t) => t.status !== 'done');
  const done = T.filter((t) => t.status === 'done').length;
  const pct = T.length ? Math.round((done / T.length) * 100) : 0;
  const cnt = (s) => T.filter((t) => t.status === s).length;
  const overdue = T.filter(isLate).length;
  const pr = ['urgent', 'high', 'medium', 'low'].map((p) => T.filter((t) => t.priority === p).length);
  const wl = USERS.filter((u) => T.some((t) => t.assignee === u.id)).map((u) => [u, T.filter((t) => t.assignee === u.id && t.status !== 'done').length]);
  const mx = Math.max(1, ...wl.map((w) => w[1]));
  const wk = weekly(T);
  const wkMax = Math.max(1, ...wk);
  const allDone = mine.length > 0 && open.length === 0;
  const first = me.name.split(' ')[0];

  return (
    <>
      <section className="glass hero">
        <div>
          <h1>
            Hello, {first}.
            <br />
            {open.length ? `You've got ${open.length} task${open.length > 1 ? 's' : ''} open.` : 'Your list is clear.'}
          </h1>
          <p className="muted" style={{ marginBottom: 16 }}>
            {overdue ? `${overdue} overdue need attention.` : 'Nothing is overdue.'} {cnt('review')} waiting for review.
          </p>
          <button className="btn y" onClick={onNew}>
            + New task
          </button>
        </div>
        <img className="float" src="/images/hero.webp" width="260" height="173" alt="Stack of glass task cards" fetchPriority="high" />
      </section>

      <div className="grid g4" style={{ margin: '16px 0' }}>
        <div className="tile t1">
          <span>Total tasks</span>
          <CountUp value={T.length} />
        </div>
        <div className="tile t2">
          <span>In progress</span>
          <CountUp value={cnt('prog')} />
        </div>
        <div className="tile t3 glass">
          <span>Awaiting review</span>
          <CountUp value={cnt('review')} />
        </div>
        <div className="tile t3 glass">
          <span>Overdue</span>
          <CountUp value={overdue} style={{ color: overdue ? '#e5484d' : 'inherit' }} />
        </div>
      </div>

      <div className="grid g2">
        <div className="glass card">
          <h3>Today's focus</h3>
          {open.slice(0, 4).map((t) => (
            <div className="row" key={t.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(t.id)}>
              <div>
                <b>{t.title}</b>
                <div className="bar" style={{ marginTop: 6 }}>
                  <i style={{ width: (t.status === 'prog' ? 55 : t.status === 'review' ? 90 : 10) + '%' }} />
                </div>
              </div>
              <span className={'pill p-' + t.priority}>{t.priority}</span>
            </div>
          ))}
          {!open.length && <p className="muted">No open tasks assigned to you. Create one or enjoy the quiet.</p>}
        </div>
        <FocusTimer tasks={open} />
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="glass card">
          <h3>Completion</h3>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--line)" strokeWidth="12" />
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--acc)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} transform="rotate(-90 60 60)" />
              <text x="60" y="67" textAnchor="middle" fontSize="24" fontWeight="800" fill="var(--ink)" fontFamily="Bricolage Grotesque">
                {pct}%
              </text>
            </svg>
            <div style={{ flex: 1 }}>
              <small className="muted">Priority mix</small>
              <div style={{ display: 'flex', height: 14, borderRadius: 9, overflow: 'hidden', margin: '6px 0' }}>
                {pr.map((n, i) => (
                  <i key={i} style={{ flex: n, background: PRIORITY_COLORS[i] }} />
                ))}
              </div>
              <small className="muted">
                Urgent {pr[0]} · High {pr[1]} · Medium {pr[2]} · Low {pr[3]}
              </small>
            </div>
          </div>
        </div>
        <div className="glass card">
          <h3>Completed this week</h3>
          <div className="chart" style={{ marginBottom: 22 }}>
            {wk.map((v, i) => (
              <i key={i} style={{ height: Math.max(6, (v / wkMax) * 110) + 'px' }} title={`${v} done`}>
                <span>{'MTWTFSS'[i]}</span>
              </i>
            ))}
          </div>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <div className="glass card">
          <h3>Workload</h3>
          {wl.map(([u, n]) => (
            <div className="row" style={{ padding: '7px 0' }} key={u.id}>
              <Avatar user={u} />
              <div>
                <small>{u.name}</small>
                <div className="bar">
                  <i style={{ width: (n / mx) * 100 + '%' }} />
                </div>
              </div>
              <b>{n}</b>
            </div>
          ))}
        </div>
        {allDone ? (
          <div className="glass card win rv">
            <img src="/images/trophy.webp" width="170" height="170" alt="Crystal trophy" />
            <div>
              <h3>Day complete</h3>
              <p>
                All {mine.length} of your assigned tasks are done. Great work, {first}.
              </p>
            </div>
          </div>
        ) : (
          <div className="glass card">
            <h3>Next milestone</h3>
            <p className="muted">Finish all your assigned tasks to unlock today's trophy.</p>
            <div className="bar" style={{ margin: '12px 0' }}>
              <i style={{ width: (mine.length ? ((mine.length - open.length) / mine.length) * 100 : 0) + '%' }} />
            </div>
            <small>
              {mine.length - open.length} of {mine.length} done
            </small>
          </div>
        )}
      </div>
    </>
  );
}
