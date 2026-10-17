import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PERMISSION_LABELS } from '../data/permissions';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';

export default function Teams() {
  const { me, users, roles, depts, tasks, notify } = useApp();
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const canInvite = me.perm.can_assign_any || me.perm.can_assign_team;
  const openCount = (id) => tasks.filter((t) => t.assignee === id && t.status !== 'done').length;

  const send = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.');
    setInvite(false);
    await notify('Invite noted', `Ask a CRM admin to create a user for ${email} and set their Taskflow role and department.`);
    setEmail('');
    setErr('');
  };

  return (
    <>
      <section className="glass card tt" style={{ marginBottom: 16 }}>
        <img className="float" src="/images/team.webp" width="230" height="230" alt="Connected glass spheres" />
        <div style={{ position: 'relative' }}>
          <h1>Your teams</h1>
          <p className="muted" style={{ margin: '6px 0 12px' }}>
            {users.length} people across {depts.length} departments.
          </p>
          <span className="avs">
            {users.slice(0, 7).map((u) => (
              <Avatar key={u.id} user={u} />
            ))}
          </span>
          {canInvite && (
            <div style={{ marginTop: 14 }}>
              <button className="btn y" onClick={() => setInvite(true)}>
                Invite teammate
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="grid g2">
        {depts.map((d) => {
          const members = users.filter((u) => u.deptId === d.id).sort((a, b) => a.level - b.level);
          return (
            <div className="glass card" key={d.id}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: d.color, display: 'inline-block' }} />
                {d.name}
              </h3>
              {d.description && <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>{d.description}</p>}
              {members.map((u) => (
                <div className="mem" key={u.id}>
                  <Avatar user={u} />
                  <div style={{ flex: 1 }}>
                    <b>{u.name}</b>
                    <br />
                    <small className="muted">
                      {u.role}
                      {u.email ? ` · ${u.email}` : ''}
                    </small>
                  </div>
                  <span className="pill">{openCount(u.id)} open</span>
                </div>
              ))}
              {!members.length && <p className="muted">No members yet.</p>}
            </div>
          );
        })}
      </div>

      <div className="glass card tw" style={{ marginTop: 16 }}>
        <h3>Role permissions</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
          Managed in SugarCRM under Task Roles. Changes apply the next time people sign in.
        </p>
        <table className="perm">
          <thead>
            <tr>
              <th>Permission</th>
              {roles.map((r) => (
                <th key={r.id} style={r.id === me.roleId ? { color: 'var(--ink)' } : undefined}>
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_LABELS.map(([flag, label]) => (
              <tr key={flag}>
                <td>{label}</td>
                {roles.map((r) => (
                  <td key={r.id}>{r[flag] ? '✓' : '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invite && (
        <Modal title="Invite teammate" onClose={() => setInvite(false)}>
          <form onSubmit={send} style={{ display: 'grid', gap: 12 }}>
            <label>
              Email
              <input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            </label>
            <div className="err">{err}</div>
            <div className="actions">
              <button type="button" className="btn g" onClick={() => setInvite(false)}>
                Cancel
              </button>
              <button className="btn y">Send invite</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
