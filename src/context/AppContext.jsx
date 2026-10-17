import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createRecord, deleteRecord, fetchAll, login as apiLogin, updateRecord } from '../api/gateway';
import { STATUS } from '../data/constants';
import { canDeleteTask, canMoveTo, visibleTasks } from '../data/permissions';

const PREFS_KEY = 'taskflow-prefs';
const SESSION_KEY = 'taskflow-session';
const POLL_MS = 15000;

const AppContext = createContext(null);

const readJSON = (store, key) => {
  try {
    return JSON.parse(store.getItem(key)) || null;
  } catch {
    return null;
  }
};
const writeJSON = (store, key, value) => {
  try {
    if (value == null) store.removeItem(key);
    else store.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

const bool = (v) => v === true || v === 1 || v === '1';

// SugarCRM HTML-encodes text fields (e.g. " comes back as &quot;).
const decoder = document.createElement('textarea');
const text = (s) => {
  if (!s) return '';
  decoder.innerHTML = s;
  return decoder.value;
};

// SmartGateway returns date fields in the CRM display format. Normalise to YYYY-MM-DD.
// It uses the site-wide 'datef' setting (m/d/Y by default); set VITE_CRM_DATE_FORMAT if yours differs.
const SLASH_ORDER = (import.meta.env.VITE_CRM_DATE_FORMAT || 'm/d/Y').toLowerCase().replace(/[^mdy]/g, '');
const isoDate = (s) => {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parts = s.split(/[/.-]/);
  if (parts.length !== 3) return s;
  const p = Object.fromEntries([...SLASH_ORDER].map((k, i) => [k, parts[i]]));
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
};

// Datetimes arrive as "<date> HH:MM" (or "hh:mmam") in UTC, since the gateway has no logged-in user.
const utc = (s) => {
  if (!s) return Date.now();
  const [d, ...rest] = s.trim().split(/\s+/);
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?$/i.exec(rest.join(''));
  if (!m) return Date.parse(isoDate(d) + 'T00:00:00Z') || Date.now();
  let h = Number(m[1]) % (m[4] ? 12 : 24);
  if (m[4]?.toLowerCase() === 'pm') h += 12;
  return Date.parse(`${isoDate(d)}T${String(h).padStart(2, '0')}:${m[2]}:${m[3] || '00'}Z`) || Date.now();
};

const mapRole = (r) => ({
  id: r.id,
  name: text(r.name),
  level: Number(r.level) || 99,
  can_view_all: bool(r.can_view_all),
  can_view_team: bool(r.can_view_team),
  can_assign_any: bool(r.can_assign_any),
  can_assign_team: bool(r.can_assign_team),
  can_review: bool(r.can_review),
  can_delete_any: bool(r.can_delete_any),
});

const mapTask = (t, deptName) => ({
  id: t.id,
  number: Number(t.task_number),
  key: 'T-' + t.task_number,
  title: text(t.name),
  description: text(t.description),
  deptId: t.tf_department_id || '',
  dept: deptName(t.tf_department_id),
  assignee: t.assigned_user_id || '',
  priority: t.priority || 'medium',
  status: t.status || 'todo',
  due: isoDate(t.date_due),
  hours: Number(t.estimate_hours) || 0,
  createdBy: t.owner_id || '',
  createdAt: utc(t.date_entered),
});

const TASK_FIELDS = ['name', 'description', 'task_number', 'status', 'priority', 'date_due', 'estimate_hours', 'assigned_user_id', 'tf_department_id', 'owner_id', 'date_entered'];

export function AppProvider({ children }) {
  const prefs = useRef(readJSON(localStorage, PREFS_KEY) || {}).current;
  const [theme, setTheme] = useState(prefs.theme || 'sun');
  const [collapsed, setCollapsed] = useState(!!prefs.collapsed);
  const [still, setStill] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [session, setSession] = useState(() => readJSON(sessionStorage, SESSION_KEY));
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [depts, setDepts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const seenNotes = useRef(null);

  useEffect(() => writeJSON(localStorage, PREFS_KEY, { theme, collapsed }), [theme, collapsed]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    document.body.classList.toggle('still', still);
  }, [still]);

  const toast = useCallback((title, msg, icon = '✓') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [{ id, title, msg, icon }, ...t].slice(0, 4));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const fail = useCallback((e) => toast('Something went wrong', e.message, '!'), [toast]);

  // ---------- derived lookups ----------
  const deptName = useCallback((id) => depts.find((d) => d.id === id)?.name || 'Unassigned', [depts]);
  const unknownUser = useMemo(() => ({ id: '', name: 'Unknown user', role: '', dept: '' }), []);
  const userById = useCallback((id) => users.find((u) => u.id === id) || unknownUser, [users, unknownUser]);

  const me = useMemo(() => {
    if (!session) return null;
    const u = users.find((x) => x.id === session.user.id);
    const base = u || {
      id: session.user.id,
      name: `${session.user.first_name || ''} ${session.user.last_name || ''}`.trim(),
      role: session.role?.name || '',
      roleId: session.user.tf_role_id,
      deptId: session.user.tf_department_id,
      dept: session.department?.name || '',
    };
    const role = roles.find((r) => r.id === base.roleId) || (session.role ? mapRole(session.role) : null);
    return { ...base, perm: role || {} };
  }, [session, users, roles]);

  // ---------- loading ----------
  const loadTasks = useCallback(async () => {
    const [t, c] = await Promise.all([
      fetchAll('tf_Tasks', { fields: TASK_FIELDS, order_by: 'task_number', order_dir: 'ASC' }),
      fetchAll('tf_Comments', { fields: ['tf_task_id', 'description', 'author_id', 'date_entered'], order_by: 'date_entered', order_dir: 'ASC' }),
    ]);
    setTasks(t);
    setComments(c.map((x) => ({ id: x.id, taskId: x.tf_task_id, by: x.author_id, text: text(x.description), at: utc(x.date_entered) })));
  }, []);

  const loadNotes = useCallback(
    async (userId, announce) => {
      const n = await fetchAll('tf_Notifications', {
        fields: ['name', 'description', 'is_read', 'notif_type', 'tf_task_id', 'actor_id', 'date_entered'],
        filters: { assigned_user_id: userId },
      });
      const list = n.map((x) => ({
        id: x.id,
        title: text(x.name),
        msg: text(x.description),
        read: bool(x.is_read),
        type: x.notif_type,
        taskId: x.tf_task_id,
        at: utc(x.date_entered),
      }));
      // Pop a toast for notifications that arrived since the last poll.
      if (announce && seenNotes.current) {
        list.filter((x) => !x.read && !seenNotes.current.has(x.id)).slice(0, 3).forEach((x) => toast(x.title, x.msg, '🔔'));
      }
      seenNotes.current = new Set(list.map((x) => x.id));
      setNotes(list);
    },
    [toast],
  );

  const loadAll = useCallback(
    async (userId) => {
      setLoading(true);
      setError('');
      try {
        const [u, r, d] = await Promise.all([
          fetchAll('Users', {
            fields: ['user_name', 'first_name', 'last_name', 'tf_role_id', 'tf_department_id'],
            filters: { status: 'Active', tf_role_id: { neq: '' } },
            order_by: 'first_name',
            order_dir: 'ASC',
          }),
          fetchAll('tf_Roles', { order_by: 'level', order_dir: 'ASC' }),
          fetchAll('tf_Departments', { fields: ['name', 'color', 'description'], order_by: 'name', order_dir: 'ASC' }),
        ]);
        const roleList = r.map(mapRole);
        const deptList = d.map((x) => ({ id: x.id, name: text(x.name), color: x.color || '#ffc61a', description: text(x.description) }));
        setRoles(roleList);
        setDepts(deptList);
        setUsers(
          u.map((x) => {
            const role = roleList.find((y) => y.id === x.tf_role_id);
            return {
              id: x.id,
              userName: x.user_name,
              name: text(`${x.first_name || ''} ${x.last_name || ''}`.trim()) || x.user_name,
              email: x.email1 || '',
              roleId: x.tf_role_id,
              role: role?.name || '',
              level: role?.level ?? 99,
              deptId: x.tf_department_id || '',
              dept: deptList.find((y) => y.id === x.tf_department_id)?.name || '',
            };
          }),
        );
        seenNotes.current = null;
        await Promise.all([loadTasks(), loadNotes(userId, false)]);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [loadTasks, loadNotes],
  );

  // Initial load + polling while signed in.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    loadAll(userId);
    const iv = setInterval(() => {
      loadTasks().catch(() => {});
      loadNotes(userId, true).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(iv);
  }, [userId, loadAll, loadTasks, loadNotes]);

  const allTasks = useMemo(() => {
    const byTask = {};
    comments.forEach((c) => (byTask[c.taskId] ||= []).push(c));
    return tasks.map((t) => ({ ...mapTask(t, deptName), comments: byTask[t.id] || [] }));
  }, [tasks, comments, deptName]);

  // ---------- auth ----------
  const login = async (userName, password) => {
    try {
      const res = await apiLogin(userName.trim(), password);
      if (!res.role) return 'This user has no Taskflow role yet. Ask an admin to set one in SugarCRM (Users > Taskflow Role).';
      writeJSON(sessionStorage, SESSION_KEY, res);
      setSession(res);
      setTimeout(() => toast('Signed in as ' + res.role.name, `Welcome, ${res.user.first_name || res.user.user_name}.`), 300);
      return null;
    } catch (e) {
      return e.message;
    }
  };

  const logout = () => {
    writeJSON(sessionStorage, SESSION_KEY, null);
    setSession(null);
    setUsers([]);
    setTasks([]);
    setComments([]);
    setNotes([]);
  };

  // ---------- task actions ----------
  const refresh = () => Promise.all([loadTasks(), loadNotes(me.id, false)]);

  const createTask = async (data) => {
    const assignee = userById(data.assignee);
    const deptId = assignee.deptId || me.deptId || depts[0]?.id || '';
    try {
      await createRecord('tf_Tasks', {
        name: data.title,
        description: data.description || '',
        assigned_user_id: assignee.id,
        priority: data.priority,
        status: 'todo',
        date_due: data.due,
        estimate_hours: Number(data.hours) || 4,
        tf_department_id: deptId,
        owner_id: me.id,
        last_actor_id: me.id,
      });
      toast('Task created', `${data.title} → ${assignee.name}`);
      await refresh();
    } catch (e) {
      fail(e);
    }
  };

  const updateTask = async (id, data) => {
    const patch = {
      name: data.title,
      description: data.description || '',
      assigned_user_id: data.assignee,
      priority: data.priority,
      date_due: data.due,
      estimate_hours: Number(data.hours) || 1,
      last_actor_id: me.id,
    };
    const assignee = userById(data.assignee);
    if (assignee.deptId) patch.tf_department_id = assignee.deptId;
    try {
      await updateRecord('tf_Tasks', id, patch);
      toast('Task updated', data.title);
      await refresh();
    } catch (e) {
      fail(e);
    }
  };

  const moveTask = async (id, status) => {
    const t = allTasks.find((x) => x.id === id);
    if (!t || t.status === status) return false;
    if (!canMoveTo(me, t, status)) {
      toast(
        status === 'done' ? 'Needs review' : 'Not allowed',
        status === 'done' ? 'Submit this task for review first. Only a reviewer can mark it done.' : 'You can only change tasks you own, created or review.',
        '!',
      );
      return false;
    }
    const old = t.status;
    setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, status } : x))); // optimistic
    try {
      await updateRecord('tf_Tasks', id, { status, last_actor_id: me.id });
      const msg =
        status === 'review' ? ['Submitted for review', 'Reviewers were notified: ' + t.title]
        : status === 'done' ? [old === 'review' ? 'Approved' : 'Completed', t.title]
        : status === 'blocked' ? ['Task blocked', 'Reviewers were notified: ' + t.title]
        : old === 'review' && status === 'prog' ? ['Changes requested', t.title]
        : ['Status updated', `${t.title} → ${STATUS[status]}`];
      toast(...msg);
      await refresh();
      return true;
    } catch (e) {
      setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, status: old } : x)));
      fail(e);
      return false;
    }
  };

  const deleteTask = async (id) => {
    const t = allTasks.find((x) => x.id === id);
    if (!t || !canDeleteTask(me, t)) return;
    try {
      await deleteRecord('tf_Tasks', id);
      toast('Task deleted', t.title);
      await refresh();
    } catch (e) {
      fail(e);
    }
  };

  const addComment = async (taskId, text) => {
    try {
      await createRecord('tf_Comments', { name: text.slice(0, 50), description: text, tf_task_id: taskId, author_id: me.id });
      await refresh();
    } catch (e) {
      fail(e);
    }
  };

  // ---------- notifications ----------
  const notify = async (title, msg) => {
    try {
      await createRecord('tf_Notifications', { name: title, description: msg, assigned_user_id: me.id, actor_id: me.id, notif_type: 'system', is_read: 0 });
      toast(title, msg, '🔔');
      await loadNotes(me.id, false);
    } catch (e) {
      fail(e);
    }
  };

  const markRead = async (noteId) => {
    setNotes((ns) => ns.map((n) => (n.id === noteId ? { ...n, read: true } : n)));
    try {
      await updateRecord('tf_Notifications', noteId, { is_read: 1 });
    } catch (e) {
      fail(e);
    }
  };

  const markAllRead = async () => {
    const ids = notes.filter((n) => !n.read).map((n) => n.id);
    setNotes((ns) => ns.map((n) => ({ ...n, read: true })));
    try {
      await Promise.all(ids.map((id) => updateRecord('tf_Notifications', id, { is_read: 1 })));
    } catch (e) {
      fail(e);
    }
  };

  const value = {
    me: session ? me : null,
    session,
    users,
    roles,
    depts,
    tasks: allTasks,
    visible: me ? visibleTasks(me, allTasks) : [],
    notes,
    unread: notes.filter((n) => !n.read).length,
    loading,
    error,
    reload: () => me && loadAll(me.id),
    userById,
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
