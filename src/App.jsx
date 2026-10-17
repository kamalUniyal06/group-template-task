import { useEffect, useState } from 'react';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TaskDetail from './components/TaskDetail';
import TaskForm from './components/TaskForm';
import Toasts from './components/Toasts';
import { NAV } from './data/nav';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Notifications from './pages/Notifications';
import Reviews from './pages/Reviews';
import Tasks from './pages/Tasks';
import Teams from './pages/Teams';

const PAGES = { dash: Dashboard, tasks: Tasks, review: Reviews, teams: Teams, notes: Notifications };

const readHash = () => {
  const v = window.location.hash.slice(1);
  return NAV.some((n) => n[0] === v) ? v : 'dash';
};

export default function App() {
  const { me, loading, error, reload, users } = useApp();
  const [view, setView] = useState(readHash);
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);
  const [form, setForm] = useState(null); // null | { task?: object }
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const onHash = () => {
      setView(readHash());
      setMenu(false);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Typing in the search box jumps to the task list.
  const search = (v) => {
    setQuery(v);
    if (v && view !== 'tasks') window.location.hash = 'tasks';
  };

  if (!me)
    return (
      <>
        <Toasts />
        <Login />
      </>
    );

  const Page = PAGES[view];

  return (
    <>
      <Toasts />
      <div id="app">
        <Sidebar view={view} mobileOpen={menu} onNavigate={() => setMenu(false)} />
        <main>
          <Header query={query} setQuery={search} onMenu={() => setMenu(!menu)} />
          <div className="pg" key={view}>
            {error && (
              <div className="banner">
                <span>
                  <b>Could not load data from SugarCRM.</b> {error}
                </span>
                <button className="btn g" onClick={reload}>
                  Retry
                </button>
              </div>
            )}
            {loading && !users.length ? <div className="loading">Loading your workspace…</div> : <Page query={query} onNew={() => setForm({})} onOpen={setOpenId} />}
          </div>
        </main>
      </div>
      {openId && (
        <TaskDetail
          id={openId}
          onClose={() => setOpenId(null)}
          onEdit={(task) => {
            setOpenId(null);
            setForm({ task });
          }}
        />
      )}
      {form && <TaskForm task={form.task} onClose={() => setForm(null)} />}
    </>
  );
}
