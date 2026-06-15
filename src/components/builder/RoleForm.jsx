import { useState, useEffect, useRef } from 'react';
import { uid } from '../../lib/constants';
import { useStore } from '../../store/useStore';
import { CATS, PRIOS, CC, PC, PB, DAYS } from '../../utils/builderHelpers';
import Modal from '../Modal';

export default function RoleForm({ linkId, role, onClose }) {
  const S = useStore(s => s.S);
  const upsertLink = useStore(s => s.upsertLink);
  const isEdit = !!role;

  const [name, setName] = useState(role?.name || '');
  const [definition, setDefinition] = useState(role?.definition || '');
  const [hours, setHours] = useState(role?.hours ?? 2);
  const [days, setDays] = useState(role?.days ? [...role.days] : [0, 1, 2, 3, 4]);
  const [category, setCategory] = useState(role?.category || 'Operations');
  const [priority, setPriority] = useState(role?.priority || 'Medium');
  const [sop, setSop] = useState(role?.sop || '');

  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const toggleDay = (i) => {
    setDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const link = S.links.find(l => l.id === linkId);
    if (!link) return;
    const rd = { name: trimmed, definition: definition.trim(), hours: Number(hours), days: [...days], category, priority, sop: sop.trim() };
    let updatedRoles;
    if (isEdit) {
      updatedRoles = link.roles.map(r => r.id === role.id ? { ...r, ...rd } : r);
    } else {
      updatedRoles = [...link.roles, { id: uid(), ...rd }];
    }
    await upsertLink({ ...link, roles: updatedRoles });
    onClose();
  };

  const showDays = S.settings.weekends ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];

  return (
    <Modal onClose={onClose} large>
      <h2>{isEdit ? 'Edit role' : 'Add role'}</h2>

      <label className="fl">Role name *</label>
      <input ref={inputRef} type="text" value={name} onChange={e => setName(e.target.value)} />

      <label className="fl">Definition</label>
      <textarea value={definition} onChange={e => setDefinition(e.target.value)} />

      <label className="fl">Hours / week</label>
      <input type="number" value={hours} min="0.5" max="60" step="0.5" style={{ width: 100 }} onChange={e => setHours(e.target.value)} />

      <label className="fl">Days active</label>
      <div className="daypick">
        {showDays.map(i => (
          <button key={i} className={`daytog${days.includes(i) ? ' on' : ''}`} onClick={() => toggleDay(i)}>
            {DAYS[i]}
          </button>
        ))}
      </div>

      <label className="fl">Category</label>
      <div className="mpick" id="catpick">
        {CATS.map(cat => (
          <div key={cat} className={`mopt${category === cat ? ' on' : ''}`}
            style={category === cat ? { background: `${CC[cat]}18`, color: CC[cat], borderColor: `${CC[cat]}55` } : {}}
            onClick={() => setCategory(cat)}>{cat}</div>
        ))}
      </div>

      <label className="fl">Priority</label>
      <div className="mpick" id="priopick">
        {PRIOS.map(p => (
          <div key={p} className={`mopt${priority === p ? ' on' : ''}`}
            style={priority === p ? { background: PB[p], color: PC[p], borderColor: `${PC[p]}55` } : {}}
            onClick={() => setPriority(p)}>{p}</div>
        ))}
      </div>

      <label className="fl">SOP</label>
      <textarea style={{ minHeight: 80 }} value={sop} onChange={e => setSop(e.target.value)} />

      <div className="ma">
        <button className="btn btn-g" onClick={onClose}>Cancel</button>
        <button className="btn btn-p" onClick={save}>{isEdit ? 'Save' : 'Add role'}</button>
      </div>
    </Modal>
  );
}
