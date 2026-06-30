import { useState } from 'react';
import Modal from '../Modal';
import { COLORS } from '../../lib/constants';

interface Props {
  client?: { id: string; name: string; industry?: string; color?: string; serviceCategoryIds?: string[] } | null;
  serviceCategories?: { id: string; label: string; color?: string }[];
  onSave: (id: string | null, name: string, industry: string, color: string, serviceCategoryIds: string[]) => void;
  onClose: () => void;
}

export default function ClientModal({ client, serviceCategories, onSave, onClose }: Props) {
  const [name, setName] = useState(client?.name || '');
  const [industry, setIndustry] = useState(client?.industry || '');
  const [color, setColor] = useState(client?.color || COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [selectedCats, setSelectedCats] = useState<string[]>(client?.serviceCategoryIds || []);

  const toggleCat = (id: string) => {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const save = () => {
    if (!name.trim()) return;
    onSave(client?.id || null, name.trim(), industry.trim(), color, selectedCats);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2>{client ? 'Edit client' : 'Add client / project'}</h2>
      <label className="fl">Name *</label>
      <input type="text" placeholder="e.g. Apex Ventures" value={name}
        onChange={e => setName(e.target.value)} autoFocus />

      <label className="fl">Industry / type</label>
      <input type="text" placeholder="e.g. Finance" value={industry}
        onChange={e => setIndustry(e.target.value)} />

      <label className="fl">Service categories</label>
      <div className="tag-chip-pick" style={{ marginTop: 0 }}>
        {(serviceCategories || []).map(sc => {
          const on = selectedCats.includes(sc.id);
          return (
            <span key={sc.id} className={`tcp${on ? ' on' : ''}`}
              style={on ? { background: sc.color || 'var(--accent)', borderColor: sc.color || 'var(--accent)' } : {}}
              onClick={() => toggleCat(sc.id)}>
              {sc.label}
            </span>
          );
        })}
        {(!serviceCategories || serviceCategories.length === 0) && (
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>No categories yet</span>
        )}
      </div>

      {!client && (
        <>
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
        </>
      )}

      <div className="ma">
        <button className="btn btn-g" onClick={onClose}>Cancel</button>
        <button className="btn btn-p" onClick={save}>{client ? 'Save' : 'Add'}</button>
      </div>
    </Modal>
  );
}
