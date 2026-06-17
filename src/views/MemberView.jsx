import { useState } from 'react';
import { useStore } from '../store/useStore';
import MemberLineUp from './MemberLineUp';
import MemberPlayground from './MemberPlayground';
import MemberKanban from './MemberKanban';
import Toast from '../components/Toast';

const TABS = [
  { id: 'lu', label: 'Line Up', icon: '📋' },
  { id: 'pg', label: 'Playground', icon: '◢' },
  { id: 'kb', label: 'Kanban', icon: '📌' },
];

export default function MemberView() {
  const [tab, setTab] = useState('lu');
  const memberSession = useStore(s => s.session);
  const signOut = useStore(s => s.signOut);

  return (
    <div className="app member-app">
      {/* ── Member nav bar ── */}
      <div className="nav" style={{display:'flex',alignItems:'center'}}>
        <div className="nav-brand" style={{fontSize:16}}>Team<span>Map</span></div>
        <div className="nav-desktop-items" style={{display:'flex',alignItems:'center',gap:0,marginLeft:16}}>
          {TABS.map(t => (
            <div key={t.id} className={`nt${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </div>
          ))}
        </div>
        <div className="ns" />
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 12px'}}>
          <span style={{fontSize:12,color:'var(--t2)'}}>
            {memberSession?.name || 'Member'}
          </span>
          <button className="btn btn-sm" style={{color:'var(--warn)'}} onClick={signOut}>
            Log out
          </button>
        </div>
      </div>

      {/* ── Tab content — all mounted, inactive hidden with display:none ── */}
      <div className="member-tab-content" style={{ display: tab === 'lu' ? '' : 'none' }}><MemberLineUp /></div>
      <div className="member-tab-content" style={{ display: tab === 'pg' ? '' : 'none' }}><MemberPlayground /></div>
      <div className="member-tab-content" style={{ display: tab === 'kb' ? '' : 'none' }}><MemberKanban /></div>
      <Toast />
    </div>
  );
}
