import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getStatusMaps, getStatusesForRole } from '../utils/statusUtils';

// Port of showStPop/setTaskStatus — a floating status picker anchored to a chip.
export default function StatusPopup({ taskId, anchorRect, onClose }) {
  const ref = useRef(null);
  const setTaskStatus = useStore(s => s.setTaskStatus);
  const session = useStore(s => s.session);
  const role = session?.role || 'member';
  const S = useStore.getState().S;
  const { STATS, STC, STB } = getStatusMaps(S.task_statuses);
  const roleStatuses = getStatusesForRole(S.task_statuses, role);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const t = setTimeout(() => document.addEventListener('click', onDoc), 10);
    return () => { clearTimeout(t); document.removeEventListener('click', onDoc); };
  }, [onClose]);

  if (!anchorRect) return null;
  return (
    <div ref={ref} className="st-popup open"
      style={{ position:'fixed', zIndex:500, top:anchorRect.bottom+4, left:anchorRect.left }}>
      {roleStatuses.map(s => (
        <div key={s} className="st-popopt" style={{ background:STB[s], color:STC[s] }}
          onClick={(ev)=>{ ev.stopPropagation(); setTaskStatus(taskId, s); onClose(); }}>
          {s}
        </div>
      ))}
    </div>
  );
}
