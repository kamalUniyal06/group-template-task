import { useApp } from '../context/AppContext';
import { canReviewTask, findUser } from '../data/permissions';
import Avatar from '../components/Avatar';

export default function Reviews({ onOpen }) {
  const { me, visible, moveTask } = useApp();
  const R = visible.filter((t) => t.status === 'review');

  if (!R.length)
    return (
      <div className="glass card sh big">
        <img src="/images/shield.webp" width="220" height="220" alt="Approval shield" />
        <h2>All reviews are up to date</h2>
        <p className="muted">New submissions will appear here.</p>
      </div>
    );

  return (
    <>
      <div className="glass card sh" style={{ marginBottom: 16 }}>
        <img src="/images/shield.webp" width="84" height="84" alt="Approval shield" />
        <div>
          <h1>
            {R.length} pending review{R.length > 1 ? 's' : ''}
          </h1>
          <p className="muted">Next up: {R[0].title}</p>
        </div>
      </div>
      <div className="glass card">
        {R.map((t) => {
          const u = findUser(t.assignee);
          return (
            <div className="row" key={t.id} style={{ flexWrap: 'wrap' }}>
              <Avatar user={u} />
              <div style={{ cursor: 'pointer' }} onClick={() => onOpen(t.id)}>
                <b>{t.title}</b>
                <br />
                <small>
                  {u.name} · {t.dept} · due {t.due}
                </small>
              </div>
              {canReviewTask(me, t) ? (
                <>
                  <button className="btn g" onClick={() => moveTask(t.id, 'prog')}>
                    Request changes
                  </button>
                  <button className="btn y" onClick={() => moveTask(t.id, 'done')}>
                    Approve
                  </button>
                </>
              ) : (
                <span className="pill">Awaiting reviewer</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
