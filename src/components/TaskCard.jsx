import { STATUS } from '../data/constants';
import { isLate } from '../data/permissions';
import { useApp } from '../context/AppContext';
import Avatar from './Avatar';

export default function TaskCard({ task, onOpen }) {
  const { moveTask, userById } = useApp();
  const late = isLate(task);
  return (
    <div
      className="tk"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.currentTarget.classList.add('drag');
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove('drag')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <small className="muted">{task.key}</small>
        <span className={'pill p-' + task.priority}>{task.priority}</span>
      </div>
      <b onClick={() => onOpen(task.id)}>{task.title}</b>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <span className="avs">
          <Avatar user={userById(task.assignee)} />
        </span>
        <small style={late ? { color: '#e5484d', fontWeight: 600 } : { color: 'var(--mut)' }}>
          {task.comments?.length ? `💬 ${task.comments.length} · ` : ''}
          {task.due}
        </small>
      </div>
      <select value={task.status} onChange={(e) => moveTask(task.id, e.target.value)} aria-label="Move task">
        {Object.entries(STATUS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}
