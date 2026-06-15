import { useState } from 'react';
import Nav from './components/Nav';
import TaskDashboard from './views/TaskDashboard';
import Builder from './views/Builder';
import LineUp from './views/LineUp';
import Playground from './views/Playground';
import ListView from './views/ListView';
import TaskGen2 from './views/TaskGen2';
import TasksMilestones from './views/TasksMilestones';
import TeamDashboard from './views/TeamDashboard';
import Settings from './views/Settings';
import Stub from './views/Stub';

const VIEWS = {
  tkd: () => <TaskDashboard />,
  st:  () => <Settings />,
  td:  () => <TeamDashboard />,
  bl:  () => <Builder />,
  tk:  () => <TasksMilestones />,
  lv:  () => <ListView />,
  tg2: () => <TaskGen2 />,
  lu:  () => <LineUp />,
  pg:  () => <Playground />,
};

export default function App() {
  const [view, setView] = useState('tkd');
  const Render = VIEWS[view] || VIEWS.tkd;
  return (
    <div className="app">
      <Nav current={view} onSwitch={setView} />
      <Render />
    </div>
  );
}
