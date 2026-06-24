import { useState } from 'react';
import Modal from '../Modal';

interface Props {
  mood?: any | null;
  index: number;
  onSave: (index: number, data: any) => void;
  onClose: () => void;
}

export default function MoodModal({ mood, index, onSave, onClose }: Props) {
  const [label, setLabel] = useState(mood?.label || '');
  const [icon, setIcon] = useState(mood?.icon || '');
  const [desc, setDesc] = useState(mood?.desc || '');
  const [max, setMax] = useState(mood?.max ?? '');
  const [cardSize, setCardSize] = useState(mood?.cardSize || 'narrow');
  const [visible, setVisible] = useState(mood?.visible ?? true);

  const save = () => {
    if (!label.trim()) return;
    onSave(index, {
      label: label.trim(),
      icon: icon.trim() || '📌',
      desc: desc.trim(),
      max: max === '' ? null : parseInt(max),
      cardSize,
      visible,
    });
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2>{mood ? 'Edit mood' : 'Add mood'}</h2>
      <label className="fl">Label *</label>
      <input type="text" placeholder="e.g. Focus" value={label}
        onChange={e => setLabel(e.target.value)} autoFocus />

      <label className="fl">Icon (emoji)</label>
      <input type="text" value={icon} onChange={e => setIcon(e.target.value)}
        style={{ width: 80, fontSize: 20 }} />

      <label className="fl">Description</label>
      <input type="text" placeholder="What this mood means" value={desc}
        onChange={e => setDesc(e.target.value)} />

      <label className="fl">Max tasks/day (blank = no limit)</label>
      <input type="number" value={max} placeholder="No limit"
        onChange={e => setMax(e.target.value)} style={{ width: 120 }} min={1} />

      {mood && (
        <>
          <label className="fl">Line Up card size</label>
          <select value={cardSize} onChange={e => setCardSize(e.target.value)}
            style={{ width: 140, marginTop: 6 }}>
            <option value="narrow">narrow</option>
            <option value="mid">mid</option>
            <option value="big">big</option>
          </select>

          <label className="fl">Dashboard visibility</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <input type="checkbox" id="moodvis" checked={visible}
              onChange={e => setVisible(e.target.checked)}
              style={{ width: 16, height: 16 }} />
            <label htmlFor="moodvis" style={{ fontSize: 13, cursor: 'pointer' }}>Visible on all dashboards</label>
          </div>
        </>
      )}

      <div className="ma">
        <button className="btn btn-g" onClick={onClose}>Cancel</button>
        <button className="btn btn-p" onClick={save}>{mood ? 'Save' : 'Add mood'}</button>
      </div>
    </Modal>
  );
}
