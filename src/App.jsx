import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import Nav from './components/Nav';
import TaskDashboard from './views/TaskDashboard';

const Settings = lazy(() => import('./views/Settings'));
const TeamDashboard = lazy(() => import('./views/TeamDashboard'));
const Builder = lazy(() => import('./views/Builder'));
const TasksMilestones = lazy(() => import('./views/TasksMilestones'));
const ListView = lazy(() => import('./views/ListView'));
const TaskGen2 = lazy(() => import('./views/TaskGen2'));
const LineUp = lazy(() => import('./views/LineUp'));
const Playground = lazy(() => import('./views/Playground'));

const VIEWS = {
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

function LoadingFallback() {
  return <div className="view active" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'var(--t3)'}}>Loading…</div>;
}

export default function App() {
  const [view, setView] = useState(() => sessionStorage.getItem('tm_view') || 'tkd');
  const scrollPos = useRef({});
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    sessionStorage.setItem('tm_view', view);
  }, [view]);

  const handleSwitch = useCallback((v) => {
    if (v === viewRef.current) return;
    const el = document.querySelector('.view.active');
    if (el) {
      scrollPos.current[viewRef.current] = el.scrollTop;
    }
    setView(v);
  }, []);

  useEffect(() => {
    const el = document.querySelector('.view.active');
    if (el && scrollPos.current[view] != null) {
      el.scrollTop = scrollPos.current[view];
    }
  }, [view]);

  const Render = VIEWS[view] || TaskDashboard;
  return (
    <div className="app">
      <Nav current={view} onSwitch={handleSwitch} />
      <Suspense fallback={<LoadingFallback />}>
        <Render />
      </Suspense>
    </div>
  );
}
