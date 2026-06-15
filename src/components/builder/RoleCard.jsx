import { PC, PB, CC, DAYS } from '../../utils/builderHelpers';

export default function RoleCard({ role, weekends, onEdit, onRemove }) {
  const show = weekends ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
  return (
    <div className="rrow">
      <span className="rname">{role.name}</span>
      <span className="rtag" style={{ background: PB[role.priority] || '#eee', color: PC[role.priority] || '#666' }}>
        {role.priority}
      </span>
      {role.category && (
        <span className="rtag" style={{ background: `${CC[role.category] || '#888'}18`, color: CC[role.category] || '#888' }}>
          {role.category}
        </span>
      )}
      <span className="rmeta">{role.hours}h/wk</span>
      <div className="rdays">
        {show.map(i => (
          <div key={i} className={`dd ${(role.days || []).includes(i) ? 'on' : 'off'}`}>{DAYS[i]}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
        <button className="btn btn-sm" style={{ padding: '3px 8px' }} onClick={onEdit}>&#9998;</button>
        <button className="btn btn-sm btn-d" style={{ padding: '3px 8px' }} onClick={onRemove}>&#10005;</button>
      </div>
    </div>
  );
}
