import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { STATUS } from '../data/seed';
import { canDeleteTask, canEditTask, canReviewTask, findUser, isLate } from '../data/permissions';
import { ago } from '../utils/time';
import Avatar from './Avatar';
import Modal from './Modal';

export default function TaskDetail({ id, onClose, onEdit }) {
  const { me, tasks, moveTask, deleteTask, addComment } = useApp();
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const t = tasks.find((x) => x.id === id);
  if (!t) return null;

  const owner = findUser(t.assignee);
  const creator = findUser(t.createdBy);
  const reviewer = canReviewTask(me, t);
  const editable = canEditTask(me, t);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addComment(t.id, text.trim());
    setText('');
  };

  return (
    <Modal title={t.title} onClose={onClose} wide>
      <div className="meta">
        <small className="muted">{t.id}</small>
        <span className={'pill p-' + t.priority}>{t.priority}</span>
        <span className="pill">{STATUS[t.status]}</span>
        <span className="pill">{t.dept}</span>
        {isLate(t) && <span className="pill p-urgent">overdue</span>}
      </div>
      <p className={t.description ? '' : 'muted'}>{t.description || 'No description yet.'}</p>
      <div className="two">
        <div className="mem" style={{ margin: 0 }}>
          <Avatar user={owner} />
          <div>
            <small className="muted">Assignee</small>
            <br />
            <b>{owner.name}</b>
          </div>
        </div>
        <div className="mem" style={{ margin: 0 }}>
          <Avatar user={creator} />
          <div>
            <small className="muted">Created by</small>
            <br />
            <b>{creator.name}</b>
          </div>
        </div>
      </div>
      <small className="muted">
        Due {t.due} · Estimate {t.hours}h
      </small>

      <label>
        Status
        <select value={t.status} onChange={(e) => moveTask(t.id, e.target.value)} disabled={!editable}>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>

      {t.status === 'review' && reviewer && (
        <div className="actions" style={{ justifyContent: 'flex-start' }}>
          <button className="btn g" onClick={() => moveTask(t.id, 'prog')}>
            Request changes
          </button>
          <button className="btn y" onClick={() => moveTask(t.id, 'done')}>
            Approve
          </button>
        </div>
      )}

      <h3 style={{ fontSize: 16 }}>Comments ({t.comments?.length || 0})</h3>
      {(t.comments || []).map((c) => (
        <div key={c.id} className="cmt">
          <small>
            {findUser(c.by).name} · {ago(c.at)}
          </small>
          <div>{c.text}</div>
        </div>
      ))}
      <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
        <input style={{ flex: 1, minWidth: 0 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" aria-label="Comment" />
        <button className="btn">Send</button>
      </form>

      <div className="actions">
        {canDeleteTask(me, t) &&
          (confirm ? (
            <button
              className="btn d"
              onClick={() => {
                deleteTask(t.id);
                onClose();
              }}
            >
              Confirm delete
            </button>
          ) : (
            <button className="btn g" onClick={() => setConfirm(true)}>
              Delete
            </button>
          ))}
        {editable && (
          <button className="btn y" onClick={() => onEdit(t)}>
            Edit task
          </button>
        )}
      </div>
    </Modal>
  );
}
