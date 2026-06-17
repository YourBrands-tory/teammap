import { useUIStore } from '../store/useUIStore';

export default function Toast() {
  const toast = useUIStore(s => s.toast);
  const clearToast = useUIStore(s => s.clearToast);

  if (!toast) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--red)', color: '#fff', padding: '10px 20px',
      borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999,
      boxShadow: '0 4px 16px rgba(0,0,0,.2)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span>{toast}</span>
      <button onClick={clearToast} style={{
        background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff',
        borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12,
      }}>Dismiss</button>
    </div>
  );
}
