import { useState } from 'react';
import Modal from '../Modal';

interface Props {
  status?: { id: string; label: string } | null;
  onSave: (id: string, label: string) => void;
  onClose: () => void;
}

export default function StatusModal({ status, onSave, onClose }: Props) {
  const [label, setLabel] = useState(status?.label || '');

  const save = () => {
    if (!status) return;
    if (!label.trim()) return;
    onSave(status.id, label.trim());
    onClose();
  };

  return (
    <Modal onClose={onClose} large={false}>
      <h2>Edit status</h2>
      <label className="fl">Label</label>
      <input type="text" value={label} onChange={e => setLabel(e.target.value)} autoFocus />
      <div className="ma">
        <button className="btn btn-g" onClick={onClose}>Cancel</button>
        <button className="btn btn-p" onClick={save}>Save</button>
      </div>
    </Modal>
  );
}
