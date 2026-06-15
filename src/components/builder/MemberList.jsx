import Avatar from '../Avatar';
import { getClientCount, isOverCapacity, getTotalHours } from '../../utils/builderHelpers';

export default function MemberList({ S, selectedMemberId, onSelect, onDragStart, onDragEnd, onAdd }) {
  return (
    <div className="panel">
      <div className="ph">
        <h3>Team Members</h3>
        <p>Drag to assign or click to select</p>
      </div>
      <div className="pb">
        {S.members.map(m => {
          const cnt = getClientCount(S, m.id);
          const cap = m.capacity || 6;
          const over = cnt > cap;
          const sel = selectedMemberId === m.id;
          const pct = Math.min(100, Math.round(cnt / cap * 100));
          const fill = over ? '#e76f51' : (cnt / cap > 0.8 ? '#d97706' : m.color);
          return (
            <div key={m.id}
              className={`mcard${sel ? ' sel' : ''}`}
              draggable
              onDragStart={() => onDragStart(m.id)}
              onDragEnd={onDragEnd}
              onClick={() => onSelect(m.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <Avatar name={m.name} color={m.color} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{m.role}</div>
                </div>
                {over && <span className="badge" style={{ background: 'var(--wl)', color: 'var(--warn)' }}>Over</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', marginBottom: 3 }}>
                <span>{cnt}/{cap}</span>
                <span>{getTotalHours(S, m.id)}h/wk</span>
              </div>
              <div className="cb"><div className="cf" style={{ width: `${pct}%`, background: fill }} /></div>
            </div>
          );
        })}
        <button className="addbtn" onClick={onAdd}>+ Add member</button>
      </div>
    </div>
  );
}
