import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import Nav from './components/Nav';
import Login from './views/Login';
import TaskDashboard from './views/TaskDashboard';
import { useStore } from './store/useStore';

const Settings = lazy(() => import('./views/Settings'));
const TeamDashboard = lazy(() => import('./views/TeamDashboard'));
const Builder = lazy(() => import('./views/Builder'));
const TasksMilestones = lazy(() => import('./views/TasksMilestones'));
const ListView = lazy(() => import('./views/ListView'));
const TaskGen2 = lazy(() => import('./views/TaskGen2'));
const LineUp = lazy(() => import('./views/LineUp'));
const Playground = lazy(() => import('./views/Playground'));

const ALL_VIEWS = {
  tkd: TaskDashboard,
  st:  Settings,
  td:  TeamDashboard,
  bl:  Builder,
  tk:  TasksMilestones,
  lv:  ListView,
  tg2: TaskGen2,
  lu:  LineUp,
  pg:  Playground,
};

const MEMBER_VIEWS = { lu: LineUp, pg: Playground };

function LoadingFallback() {
  return <div className="view active" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'var(--t3)'}}>Loading…</div>;
}

export default function App() {
  const session = useStore(s => s.session);
  const role = useStore(s => s.role);
  const loading = useStore(s => s.loading);
  const profileError = useStore(s => s.profileError);
  const signOut = useStore(s => s.signOut);

  const VIEWS = role === 'member' ? MEMBER_VIEWS : ALL_VIEWS;
  const defaultView = 'lu';

  const [view, setView] = useState(() => {
    const stored = sessionStorage.getItem('tm_view');
    const allowed = role === 'member' ? MEMBER_VIEWS : ALL_VIEWS;
    if (stored && allowed[stored]) return stored;
    return defaultView;
  });

  const scrollPos = useRef({});
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    sessionStorage.setItem('tm_view', view);
  }, [view]);

  useEffect(() => {
    const allowed = role === 'member' ? MEMBER_VIEWS : ALL_VIEWS;
    if (!allowed[view]) {
      setView(defaultView);
    }
  }, [role, view]);

  const handleSwitch = useCallback((v) => {
    if (v === viewRef.current) return;
    const allowed = role === 'member' ? MEMBER_VIEWS : ALL_VIEWS;
    if (!allowed[v]) return;
    const el = document.querySelector('.view.active');
    if (el) {
      scrollPos.current[viewRef.current] = el.scrollTop;
    }
    setView(v);
  }, [role]);

  useEffect(() => {
    const el = document.querySelector('.view.active');
    if (el && scrollPos.current[view] != null) {
      el.scrollTop = scrollPos.current[view];
    }
  }, [view]);

  if (loading) {
    return <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'var(--t2)'}}>Loading…</div>;
  }

  if (profileError) {
    return (
      <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
        <div className="modal" style={{width:400,textAlign:'center'}}>
          <div className="nav-brand" style={{fontSize:22,marginBottom:18}}>Team<span>Map</span></div>
          <div style={{color:'var(--warn)',fontSize:14,lineHeight:1.6,marginBottom:20}}>{profileError}</div>
          <button className="btn btn-sm" style={{color:'var(--warn)'}} onClick={signOut}>Log out</button>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const Render = VIEWS[view] || LineUp;
  return (
    <div className="app">
      <Nav current={view} onSwitch={handleSwitch} role={role} />
      <Suspense fallback={<LoadingFallback />}>
        <Render />
      </Suspense>
    </div>
  );
}
