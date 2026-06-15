import { useStore } from '../store/useStore';
import { NAV_ICONS } from '../lib/constants';

export default function Nav({ current, onSwitch }) {
  const S = useStore(s => s.S);
  const saveFlash = useStore(s => s.saveFlash);
  const order = S.navOrder || [];
  const labels = S.navLabels || {};

  return (
    <div className="nav">
      <div className="nav-brand">Team<span>Map</span></div>
      <div style={{display:'flex',alignItems:'center',gap:0}}>
        {order.map(v => (
          <div key={v} className={`nt${current===v?' active':''}`} onClick={()=>onSwitch(v)}>
            <span>{NAV_ICONS[v]||''}</span> {labels[v]||v}
          </div>
        ))}
      </div>
      <div className="ns" />
      {/* re-keyed by saveFlash so it briefly re-highlights on each save */}
      <div className="sb" key={saveFlash} style={{color:'var(--accent)'}}>
        <div className="sd" /><span>Auto-saved</span>
      </div>
    </div>
  );
}
