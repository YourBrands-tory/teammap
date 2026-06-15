import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { NAV_ICONS } from '../lib/constants';

export default function Nav({ current, onSwitch }) {
  const S = useStore(s => s.S);
  const saveFlash = useStore(s => s.saveFlash);
  const order = S.navOrder || [];
  const labels = S.navLabels || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSwitch = useCallback((v) => {
    onSwitch(v);
    setMenuOpen(false);
  }, [onSwitch]);

  return (
    <div className="nav">
      <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
        <span className={`nav-hamburger-line${menuOpen ? ' open' : ''}`} />
      </button>
      <div className="nav-brand">Team<span>Map</span></div>
      <div className="nav-desktop-items" style={{display:'flex',alignItems:'center',gap:0}}>
        {order.map(v => (
          <div key={v} className={`nt${current===v?' active':''}`} onClick={() => handleSwitch(v)}>
            <span>{NAV_ICONS[v]||''}</span> {labels[v]||v}
          </div>
        ))}
      </div>
      <div className="ns" />
      <div className="sb" key={saveFlash} style={{color:'var(--accent)'}}>
        <div className="sd" /><span>Auto-saved</span>
      </div>
      {menuOpen && (
        <div className="nav-mobile-menu" ref={menuRef}>
          {order.map(v => (
            <div key={v} className={`nav-mobile-item${current===v?' active':''}`} onClick={() => handleSwitch(v)}>
              <span style={{fontSize:16,width:24,textAlign:'center'}}>{NAV_ICONS[v]||' '}</span>
              <span>{labels[v]||v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
