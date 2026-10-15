import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEMO_PASSWORD, STATUS, seedNotes, seedTasks } from '../data/seed';
import { canDeleteTask, canMoveTo, findUser, reviewersFor, visibleTasks } from '../data/permissions';

const STORE_KEY = 'taskflow-v1';
const SESSION_KEY = 'taskflow-user';

const AppContext = createContext(null);

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch {
    return {};
  }
};

const uid = () => Math.random().toString(36).slice(2, 9);

export function AppProvider({ children }) {
  const initial = useRef(load()).current;
  const [tasks, setTasks] = useState(initial.tasks || seedTasks);
  const [notes, setNotes] = useState(initial.notes || seedNotes);
  const [theme, setTheme] = useState(initial.theme || 'sun');
  const [collapsed, setCollapsed] = useState(!!initial.collapsed);
  const [still, setStill] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [meId, setMeId] = useState(() => {
    try {
      return Number(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch {
      return null;
    }
  });

  const me = meId ? findUser(meId) : null;

  // Persist everything except the session.
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ tasks, notes, theme, collapsed }));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  }, [tasks, notes, theme, collapsed]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('still', still);
  }, [still]);

  const toast = useCallback((title, msg, icon = '✓') => {
    const id = uid();
    setToasts((t) => [{ id, title, msg, icon }, ...t].slice(0, 4));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  // Persistent notification for a set of users ('all' or an array of ids).
  const notify = useCallback(
    (title, msg, to = 'all', { silent = false } = {}) => {
      setNotes((n) => [{ id: uid(), title, msg, to, readBy: [], at: Date.now() }, ...n].slice(0, 100));
      if (!silent) toast(title, msg);
    },
    [toast],
  );

  const login = (id, password) => {
    if (!password || password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== DEMO_PASSWORD) return 'Wrong password. Demo password is demo1234.';
    const u = findUser(id);
    setMeId(u.id);
    try {
      sessionStorage.setItem(SESSION_KEY, String(u.id));
    } catch {
      /* ignore */
    }
    const mine = visibleTasks(u, tasks).filter((t) => t.status !== 'done');
    setTimeout(() => toast('Signed in as ' + u.role, `${u.name}, you have ${mine.length} open tasks.`), 300);
    return null;
  };

  const logout = () => {
    setMeId(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  };

  const createTask = (data) => {
    const assignee = findUser(data.assignee);
    const nextNum = Math.max(100, ...tasks.map((t) => Number(t.id.slice(2)) || 0)) + 1;
    const task = {
      id: 'T-' + nextNum,
      title: data.title,
      description: data.description || '',
      dept: assignee.dept === 'All' ? 'Operations' : assignee.dept,
      assignee: assignee.id,
      priority: data.priority,
      status: 'todo',
      due: data.due,
      hours: Number(data.hours) || 4,
      createdBy: me.id,
      comments: [],
      createdAt: Date.now(),
    };
    setTasks((t) => [...t, task]);
    toast('Task created', `${task.title} → ${assignee.name}`);
    if (assignee.id !== me.id) notify('New task assigned', `${me.name} assigned you "${task.title}" (due ${task.due}).`, [assignee.id], { silent: true });
    return task;
  };

  const updateTask = (id, patch) => {
    const old = tasks.find((t) => t.id === id);
    if (!old) return;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (patch.assignee && patch.assignee !== old.assignee) {
      notify('Task reassigned to you', `${me.name} assigned you "${old.title}".`, [patch.assignee], { silent: true });
    }
    toast('Task updated', old.title);
  };

  const moveTask = (id, status) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === status) return false;
    if (!canMoveTo(me, t, status)) {
      toast('Needs review', 'Submit this task for review first. Only a reviewer can mark it done.', '!');
      return false;
    }
    const old = t.status;
    setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, status } : x)));

    const others = (ids) => ids.filter((x) => x !== me.id);
    if (status === 'review') {
      notify('Review requested', `${me.name} submitted "${t.title}" for review.`, others(reviewersFor(t)), { silent: true });
      toast('Submitted for review', t.title);
    } else if (status === 'done') {
      notify(old === 'review' ? 'Task approved' : 'Task completed', `"${t.title}" was marked done by ${me.name}.`, others([t.assignee, t.createdBy]), { silent: true });
      toast(old === 'review' ? 'Approved' : 'Completed', t.title);
    } else if (status === 'blocked') {
      notify('Task blocked', `${me.name} flagged "${t.title}" as blocked.`, others(reviewersFor(t)), { silent: true });
      toast('Task blocked', 'Your reviewers were notified: ' + t.title, '!');
    } else if (old === 'review' && status === 'prog') {
      notify('Changes requested', `${me.name} asked for changes on "${t.title}".`, others([t.assignee]), { silent: true });
      toast('Changes requested', t.title);
    } else {
      toast('Status updated', `${t.title} → ${STATUS[status]}`);
    }
    return true;
  };

  const deleteTask = (id) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || !canDeleteTask(me, t)) return;
    setTasks((ts) => ts.filter((x) => x.id !== id));
    toast('Task deleted', t.title);
  };

  const addComment = (id, text) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const c = { id: uid(), by: me.id, text, at: Date.now() };
    setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, comments: [...(x.comments || []), c] } : x)));
    const to = [...new Set([t.assignee, t.createdBy])].filter((x) => x !== me.id);
    if (to.length) notify('New comment', `${me.name} on "${t.title}": ${text.slice(0, 60)}`, to, { silent: true });
  };

  const myNotes = useMemo(
    () => (me ? notes.filter((n) => n.to === 'all' || (Array.isArray(n.to) && n.to.includes(me.id))) : []),
    [notes, me],
  );
  const unread = me ? myNotes.filter((n) => !n.readBy.includes(me.id)).length : 0;

  const markRead = (noteId) =>
    setNotes((ns) => ns.map((n) => (n.id === noteId && !n.readBy.includes(me.id) ? { ...n, readBy: [...n.readBy, me.id] } : n)));

  const markAllRead = () =>
    setNotes((ns) => ns.map((n) => (myNotes.some((m) => m.id === n.id) && !n.readBy.includes(me.id) ? { ...n, readBy: [...n.readBy, me.id] } : n)));

  const resetDemo = () => {
    setTasks(seedTasks());
    setNotes(seedNotes());
    toast('Demo data reset', 'All tasks and notifications are back to the starting state.');
  };

  const value = {
    me,
    tasks,
    visible: me ? visibleTasks(me, tasks) : [],
    notes: myNotes,
    unread,
    theme,
    setTheme,
    collapsed,
    setCollapsed,
    still,
    setStill,
    toasts,
    toast,
    notify,
    login,
    logout,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    addComment,
    markRead,
    markAllRead,
    resetDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
