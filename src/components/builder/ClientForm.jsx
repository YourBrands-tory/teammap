import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../../lib/constants';
import { useStore } from '../../store/useStore';
import Modal from '../Modal';

export default function ClientForm({ data, onClose }) {
  const S = useStore(s => s.S);
  const upsertClient = useStore(s => s.upsertClient);
  const isEdit = !!data.id;
  const [name, setName] = useState(data.name || '');
  const [industry, setIndustry] = useState(data.industry || '');
  const [color, setColor] = useState(data.color || COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [selectedCats, setSelectedCats] = useState(data.serviceCategoryIds || []);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const toggleCat = (id) => {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await upsertClient({
      ...data,
      name: trimmed,
      industry: industry.trim(),
      serviceCategoryIds: selectedCats,
      ...(isEdit ? {} : { color, order: S.clients.length }),
    });
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2>{isEdit ? 'Edit client' : 'Add client / project'}</h2>

      <label className="fl">Name *</label>
      <input ref={inputRef} type="text" placeholder="e.g. Apex Ventures" value={name} onChange={e => setName(e.target.value)} />

      <label className="fl">Industry / type</label>
      <input type="text" placeholder="e.g. Finance" value={industry} onChange={e => setIndustry(e.target.value)} />

      <label className="fl">Service categories</label>
      <div className="tag-chip-pick" style={{ marginTop: 0 }}>
        {(S.serviceCategories || []).map(sc => {
          const on = selectedCats.includes(sc.id);
          return (
            <span key={sc.id} className={`tcp${on ? ' on' : ''}`}
              style={on ? { background: sc.color || 'var(--accent)', borderColor: sc.color || 'var(--accent)' } : {}}
              onClick={() => toggleCat(sc.id)}>
              {sc.label}
            </span>
          );
        })}
        {(!S.serviceCategories || S.serviceCategories.length === 0) && (
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>No categories yet</span>
        )}
      </div>

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
