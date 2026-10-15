import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ROLES, USERS } from '../data/seed';
import { PERMISSIONS } from '../data/permissions';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';

export default function Teams() {
  const { me, tasks, notify } = useApp();
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const depts = [...new Set(USERS.map((u) => u.dept).filter((d) => d !== 'All'))];
  const canInvite = ['Company Head', 'Manager', 'Team Leader'].includes(me.role);

  const send = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.');
    notify('Invite sent', `${email} was invited by ${me.name}.`, [me.id]);
    setInvite(false);
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
            {USERS.length} people across {depts.length} departments.
          </p>
          <span className="avs">
            {USERS.slice(0, 7).map((u) => (
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
        {depts.map((d) => (
          <div className="glass card" key={d}>
            <h3>{d}</h3>
            {USERS.filter((u) => u.dept === d)
              .sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role))
              .map((u) => (
                <div className="mem" key={u.id}>
                  <Avatar user={u} />
                  <div style={{ flex: 1 }}>
                    <b>{u.name}</b>
                    <br />
                    <small className="muted">{u.role}</small>
                  </div>
                  <span className="pill">{tasks.filter((t) => t.assignee === u.id && t.status !== 'done').length} open</span>
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="glass card tw" style={{ marginTop: 16 }}>
        <h3>Role permissions</h3>
        <table className="perm">
          <thead>
            <tr>
              <th>Permission</th>
              {ROLES.map((r) => (
                <th key={r} style={r === me.role ? { color: 'var(--ink)' } : undefined}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(([label, roles]) => (
              <tr key={label}>
                <td>{label}</td>
                {ROLES.map((r) => (
                  <td key={r}>{roles.includes(r) ? '✓' : '—'}</td>
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
