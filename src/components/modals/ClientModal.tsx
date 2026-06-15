import { useState } from 'react';
import Modal from '../Modal';
import { COLORS } from '../../lib/constants';

interface Props {
  client?: { id: string; name: string; industry?: string; color?: string } | null;
  onSave: (id: string | null, name: string, industry: string, color: string) => void;
  onClose: () => void;
}

export default function ClientModal({ client, onSave, onClose }: Props) {
  const [name, setName] = useState(client?.name || '');
  const [industry, setIndustry] = useState(client?.industry || '');
  const [color, setColor] = useState(client?.color || COLORS[Math.floor(Math.random() * COLORS.length)]);

  const save = () => {
    if (!name.trim()) return;
    onSave(client?.id || null, name.trim(), industry.trim(), color);
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
