import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DEMO_ACCOUNTS } from '../data/constants';

export default function Login() {
  const { login, toast } = useApp();
  const [userName, setUserName] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !pw) return setErr('Enter your username and password.');
    setBusy(true);
    setErr('');
    const error = await login(userName, pw);
    setBusy(false);
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
        <p className="muted">Sign in with your CRM account. What you see depends on your role.</p>
        <label>
          Username
          <input value={userName} onChange={(e) => setUserName(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        </label>
        <div className="err">{err}</div>
        <button className="btn y" style={{ justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <button
          type="button"
          className="btn g"
          style={{ justifyContent: 'center' }}
          onClick={() => toast('Password reset', 'Ask your CRM administrator to reset it in SugarCRM (Admin > User Management).')}
        >
          Forgot password
        </button>
        <div className="demo-hint">
          Demo accounts (password <b>demo1234</b>):
          <div className="demo-list">
            {DEMO_ACCOUNTS.map(([u, label]) => (
              <button
                type="button"
                key={u}
                onClick={() => {
                  setUserName(u);
                  setPw('demo1234');
                  setErr('');
                }}
                title={label}
              >
                <b>{u}</b> <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
