import { useState } from 'react';
import Modal from '../Modal';

interface Props {
  tag?: { id: string; label: string } | null;
  onSave: (id: string, label: string) => void;
  onClose: () => void;
}

export default function TagModal({ tag, onSave, onClose }: Props) {
  const [label, setLabel] = useState(tag?.label || '');

  const save = () => {
    if (!tag) return;
    if (!label.trim()) return;
    onSave(tag.id, label.trim());
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2>Edit tag</h2>
      <label className="fl">Label</label>
      <input type="text" value={label} onChange={e => setLabel(e.target.value)} autoFocus />
      <div className="ma">
        <button className="btn btn-g" onClick={onClose}>Cancel</button>
        <button className="btn btn-p" onClick={save}>Save</button>
      </div>
    </Modal>
  );
}
