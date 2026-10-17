import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRIORITIES, day } from '../data/constants';
import { assignableUsers } from '../data/permissions';
import Modal from './Modal';

export default function TaskForm({ task, onClose }) {
  const { me, users: allUsers, createTask, updateTask, userById } = useApp();
  const users = assignableUsers(me, allUsers);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(
    task
      ? { title: task.title, description: task.description, assignee: task.assignee, priority: task.priority, due: task.due, hours: task.hours }
      : { title: '', description: '', assignee: me.id, priority: 'medium', due: day(3), hours: 4 },
  );
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const title = f.title.trim();
    if (title.length < 3) return setErr('Title must be at least 3 characters.');
    if (!f.due) return setErr('Pick a due date.');
    const data = { ...f, title, hours: Number(f.hours) || 1 };
    setSaving(true);
    if (task) await updateTask(task.id, data);
    else await createTask(data);
    setSaving(false);
    onClose();
  };

  // Keep the current assignee selectable even if the editor could not normally assign to them.
  const options = task && !users.some((u) => u.id === task.assignee) ? [...users, userById(task.assignee)] : users;

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose} wide>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Title
          <input autoFocus value={f.title} onChange={set('title')} maxLength={80} />
        </label>
        <label>
          Description
          <textarea rows={3} value={f.description} onChange={set('description')} placeholder="What needs to happen?" />
        </label>
        <div className="two">
          <label>
            Assignee
            <select value={f.assignee} onChange={set('assignee')}>
              {options.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role}{u.dept ? ` · ${u.dept}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select value={f.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" value={f.due} onChange={set('due')} />
          </label>
          <label>
            Estimate (hours)
            <input type="number" min="1" max="200" value={f.hours} onChange={set('hours')} />
          </label>
        </div>
        <div className="err">{err}</div>
        <div className="actions">
          <button type="button" className="btn g" onClick={onClose}>
            Cancel
          </button>
          <button className="btn y" disabled={saving}>{saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}</button>
        </div>
      </form>
    </Modal>
  );
}
