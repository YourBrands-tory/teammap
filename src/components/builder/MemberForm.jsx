import { useState, useEffect, useRef } from 'react';
import { COLORS, uid } from '../../lib/constants';
import { useStore } from '../../store/useStore';
import Modal from '../Modal';

export default function MemberForm({ data, onClose }) {
  const S = useStore(s => s.S);
  const upsertMember = useStore(s => s.upsertMember);
  const isEdit = !!data.id;
  const [name, setName] = useState(data.name || '');
  const [role, setRole] = useState(data.role || '');
  const [capacity, setCapacity] = useState(data.capacity ?? S.settings.maxCap);
  const [color, setColor] = useState(data.color || COLORS[Math.floor(Math.random() * COLORS.length)]);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await upsertMember({ ...data, name: trimmed, role: role.trim(), capacity: Number(capacity), ...(isEdit ? {} : { color }) });
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2>{isEdit ? 'Edit member' : 'Add team member'}</h2>

      <label className="fl">Full name *</label>
      <input ref={inputRef} type="text" placeholder="e.g. Jordan Lee" value={name} onChange={e => setName(e.target.value)} />

      <label className="fl">Role / title</label>
      <input type="text" placeholder="e.g. Account Manager" value={role} onChange={e => setRole(e.target.value)} />

      <label className="fl">Client capacity</label>
      <input type="number" value={capacity} min="1" max="20" style={{ width: 100 }} onChange={e => setCapacity(e.target.value)} />

      {!isEdit && (
        <>
          <label className="fl">Colour</label>
          <div className="cpick">
            {COLORS.map(c => (
              <div key={c} className="csw" style={{
                background: c,
                outline: color === c ? `2px solid ${c}` : '',
                outlineOffset: color === c ? '2px' : '',
              }} onClick={() => setColor(c)} />
            ))}
          </div>
        </>
      )}

      <div className="ma">
        <button className="btn btn-g" onClick={onClose}>Cancel</button>
        <button className="btn btn-p" onClick={save}>{isEdit ? 'Save' : 'Add'}</button>
      </div>
    </Modal>
  );
}
