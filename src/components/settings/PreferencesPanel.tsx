import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';

interface Props {
  maxCap: number;
  weekends: boolean;
  onUpdateSettings: (patch: any) => void;
  onExport: () => void;
  onImport: (parsed: any) => Promise<void>;
}

export default function PreferencesPanel({ maxCap, weekends, onUpdateSettings, onExport, onImport }: Props) {
  const role = useStore(s => s.role);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setMsg('Importing…');
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      await onImport(parsed);
      setMsg('✓ Imported!');
    } catch (err: any) {
      setMsg('✕ Import failed: ' + (err.message || 'invalid file'));
    }
    setBusy(false);
    e.target.value = '';
  };

  const handleReset = () => {
    if (!confirm('Reset ALL data?')) return;
    const loadAll = useStore.getState().loadAll;
    loadAll(true);
  };

  const handleLogout = async () => {
    if (!confirm('Log out?')) return;
    await useStore.getState().signOut();
  };

  return (
    <div className="st-panel">
      <div className="st-panel-head"><h3>Preferences &amp; Data</h3></div>
      <div className="st-panel-body" style={{ padding: 0 }}>
        <div className="st-li" style={{ flexWrap: 'wrap' }}>
          <span className="st-li-name">Default capacity</span>
          <input type="number" value={maxCap} min={1} max={20}
            onChange={e => onUpdateSettings({ maxCap: parseInt(e.target.value) || 6 })}
            style={{ width: 60, textAlign: 'center', fontSize: 12, padding: 4 }} />
        </div>
        <div className="st-li" style={{ flexWrap: 'wrap' }}>
          <span className="st-li-name">Show weekends in day picker</span>
          <input type="checkbox" checked={weekends}
            onChange={e => onUpdateSettings({ weekends: e.target.checked })} />
        </div>
        <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-sm" onClick={onExport}>⬇ Export JSON</button>
          <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
            ⬆ Import JSON
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />
          </label>
          <button className="btn btn-sm btn-d" onClick={handleReset}>↻ Reset</button>
        </div>
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-sm" style={{ color:'var(--warn)' }} onClick={handleLogout}>🚪 Log out</button>
        </div>
        {msg && <div style={{
          padding: '0 12px 12px', fontSize: 12, fontWeight: 600,
          color: msg.startsWith('✓') ? 'var(--accent)' : msg.startsWith('✕') ? 'var(--warn)' : 'var(--t2)',
        }}>{msg}</div>}
      </div>
    </div>
  );
}
