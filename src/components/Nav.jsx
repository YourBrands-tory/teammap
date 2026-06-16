import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { NAV_ICONS } from '../lib/constants';

const MEMBER_NAV = ['lu', 'pg'];

export default function Nav({ current, onSwitch, role }) {
  const S = useStore(s => s.S);
  const saveFlash = useStore(s => s.saveFlash);
  const order = role === 'member' ? MEMBER_NAV : (S.navOrder || []);
  const labels = S.navLabels || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.nav-hamburger')) {
        closeMenu();
      }
    };
    const onEsc = (e) => e.key === 'Escape' && closeMenu();
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen, closeMenu]);

  const handleSwitch = useCallback((v) => {
    onSwitch(v);
    closeMenu();
  }, [onSwitch, closeMenu]);

  const handleLogout = async () => {
    closeMenu();
    if (!confirm('Log out?')) return;
    await useStore.getState().signOut();
  };

  return (
    <div className="nav">
      <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} onTouchStart={() => setMenuOpen(o => !o)} aria-label="Menu">
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
          <div className="nav-mobile-close-row">
            <span className="nav-mobile-title">Menu</span>
            <button className="nav-mobile-x" onClick={closeMenu} onTouchStart={closeMenu} aria-label="Close menu">✕</button>
          </div>
          {order.map(v => (
            <div key={v} className={`nav-mobile-item${current===v?' active':''}`} onClick={() => handleSwitch(v)}>
              <span style={{fontSize:16,width:24,textAlign:'center'}}>{NAV_ICONS[v]||' '}</span>
              <span>{labels[v]||v}</span>
            </div>
          ))}
          <div style={{borderTop:'1px solid var(--border)',margin:'8px 0'}} />
          <div className="nav-mobile-item" onClick={handleLogout} style={{color:'var(--warn)'}}>
            <span style={{fontSize:16,width:24,textAlign:'center'}}>🚪</span>
            <span>Log out</span>
          </div>
        </div>
      )}
    </div>
  );
}
