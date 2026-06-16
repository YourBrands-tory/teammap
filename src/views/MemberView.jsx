import { useState } from 'react';
import { useStore } from '../store/useStore';
import MemberLineUp from './MemberLineUp';

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
    <div className="app">
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

      {/* ── Tab content ── */}
      {tab === 'lu' && <MemberLineUp />}
      {tab === 'pg' && (
        <div className="view active" style={{display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:24,fontWeight:700,color:'var(--t2)',marginBottom:8}}>Playground</div>
            <div style={{fontSize:14}}>Your personal spreadsheet — coming in the next step</div>
          </div>
        </div>
      )}
      {tab === 'kb' && (
        <div className="view active" style={{display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:24,fontWeight:700,color:'var(--t2)',marginBottom:8}}>Kanban</div>
            <div style={{fontSize:14}}>Your tasks grouped by mood — coming in the next step</div>
          </div>
        </div>
      )}
    </div>
  );
}
