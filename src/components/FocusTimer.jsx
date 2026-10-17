import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

const LEN = 25 * 60;
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

export default function FocusTimer({ tasks }) {
  const { notify } = useApp();
  const [left, setLeft] = useState(LEN);
  const [run, setRun] = useState(false);
  const [taskId, setTaskId] = useState('');
  const ring = useRef(null);

  useEffect(() => {
    if (!run) return;
    const iv = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(iv);
  }, [run]);

  useEffect(() => {
    if (left !== 0 || !run) return;
    setRun(false);
    setLeft(LEN);
    const t = tasks.find((x) => x.id === taskId);
    notify('Focus session complete', `25 minutes logged${t ? ' on ' + t.title : ''}. Take a short break.`);
  }, [left, run, tasks, taskId, notify]);

  const toggle = () => {
    if (!run && ring.current) {
      const r = ring.current;
      r.classList.remove('p');
      void r.offsetWidth;
      r.classList.add('p');
    }
    setRun(!run);
  };

  return (
    <div className="glass card timer">
      <div style={{ position: 'relative' }}>
        <span className="ring" ref={ring} />
        <img src="/images/timer.webp" width="110" height="110" alt="Focus timer" />
      </div>
      <div>
        <div className="tm">{fmt(left)}</div>
        <select value={taskId} onChange={(e) => setTaskId(e.target.value)} aria-label="Task to focus on">
          <option value="">{tasks.length ? 'Pick a task to focus on' : 'No task'}</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btn y" onClick={toggle}>
            {run ? 'Pause' : 'Start'}
          </button>
          <button
            className="btn g"
            onClick={() => {
              setRun(false);
              setLeft(LEN);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
