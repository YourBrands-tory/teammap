import { useState } from 'react';
import Modal from '../Modal';
import { COLORS, uid } from '../../lib/constants';

interface Props {
  member?: { id: string; name: string; role?: string; capacity: number; color: string } | null;
  defaultCap: number;
  onSave: (id: string | null, name: string, role: string, capacity: number, color: string) => void;
  onClose: () => void;
}

export default function MemberModal({ member, defaultCap, onSave, onClose }: Props) {
  const [name, setName] = useState(member?.name || '');
  const [role, setRole] = useState(member?.role || '');
  const [capacity, setCapacity] = useState(member?.capacity ?? defaultCap);
  const [color, setColor] = useState(member?.color || COLORS[Math.floor(Math.random() * COLORS.length)]);

  const save = () => {
    if (!name.trim()) return;
    onSave(member?.id || null, name.trim(), role.trim(), capacity, color);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2>{member ? 'Edit member' : 'Add team member'}</h2>
      <label className="fl">Full name *</label>
      <input type="text" placeholder="e.g. Jordan Lee" value={name}
        onChange={e => setName(e.target.value)} autoFocus />

      <label className="fl">Role / title</label>
      <input type="text" placeholder="e.g. Account Manager" value={role}
        onChange={e => setRole(e.target.value)} />

      <label className="fl">Daily Task Limit</label>
      <input type="number" value={capacity} min={1} max={20}
        onChange={e => setCapacity(parseInt(e.target.value) || 6)}
        style={{ width: 100 }} />

      <label className="fl">Colour</label>
      <div className="cpick" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        {COLORS.map(c => (
          <div key={c} className="csw" style={{
            background: c, width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
            outline: color === c ? `2px solid ${c}` : 'none',
            outlineOffset: color === c ? 2 : 0,
          }} onClick={() => setColor(c)} />
        ))}
      </div>

      <div className="ma">
        <button className="btn btn-g" onClick={onClose}>Cancel</button>
        <button className="btn btn-p" onClick={save}>{member ? 'Save' : 'Add'}</button>
      </div>
    </Modal>
  );
}
