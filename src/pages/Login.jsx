import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEMO_PASSWORD, USERS } from '../data/seed';

export default function Login() {
  const { login, toast } = useApp();
  const [who, setWho] = useState(USERS[0].id);
  const [pw, setPw] = useState(DEMO_PASSWORD);
  const [err, setErr] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const error = login(who, pw);
    if (error) setErr(error);
  };

  return (
    <div id="login">
      <div className="photo">
        <img src="/images/login.webp" width="1600" height="900" alt="Sunlit office with a yellow chair" />
        <div className="cap">
          <h2>Clear desks. Clear work.</h2>
          <p>Every task has an owner, a deadline and a reviewer.</p>
        </div>
      </div>
      <form className="lf" onSubmit={submit}>
        <div className="logo" style={{ padding: 0 }}>
          <b>T</b>Taskflow
        </div>
        <h1>Welcome back</h1>
        <p className="muted">Pick a team member to see their role-based view.</p>
        <label>
          Account
          <select value={who} onChange={(e) => setWho(Number(e.target.value))}>
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Password
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        </label>
        <div className="err">{err}</div>
        <button className="btn y" style={{ justifyContent: 'center' }}>
          Sign in
        </button>
        <button type="button" className="btn g" style={{ justifyContent: 'center' }} onClick={() => toast('Reset link sent', 'Demo only: no email is sent.')}>
          Forgot password
        </button>
        <p className="demo-hint">Demo mode: every account uses the password <b>demo1234</b>. Real authentication will come from the backend.</p>
      </form>
    </div>
  );
}
