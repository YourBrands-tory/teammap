import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { taskTimeStr, STC, STB, STATS } from '../../lib/constants';
import { getCardSize } from '../../utils/lineUpHelpers';

interface Task {
  id: string; name: string; mood: string; status: string; clientId?: string;
  assignedTo?: string[]; isMilestone?: boolean; notes?: string;
  estH?: number; estM?: number;
}
interface Member { id: string; name: string; color: string; }
interface Client { id: string; name: string; color: string; }
interface Mood { id: string; icon: string; label: string; color: string; bg: string; }
interface S { members: Member[]; clients: Client[]; moods: Mood[]; }

interface Props {
  task: Task;
  S: S;
  onOpen: (t: any) => void;
  onStatusChange: (id: string, s: string) => void;
  onHide: (id: string) => void;
  isOverlay?: boolean;
}

export default function LineUpCard({ task, S, onOpen, onStatusChange, onHide, isOverlay }: Props) {
  const cardSize = getCardSize(task.mood, S.moods);
  const isNarrow = cardSize === 'narrow';
  const isBig = cardSize === 'big';
  const mood = S.moods.find(m => m.id === task.mood);
  const client = S.clients.find(c => c.id === task.clientId);
  const moodColor = mood?.color || '#888';
  const moodBg = mood?.bg || '#f2f0ec';
  const assignees = (task.assignedTo || []).map(id => S.members.find(m => m.id === id)).filter(Boolean) as Member[];
  const timeStr = taskTimeStr(task as any);

  let sortable: any = {};
  if (!isOverlay) {
    const hook = useSortable({ id: task.id });
    sortable = {
      ref: hook.setNodeRef,
      style: {
        transform: CSS.Transform.toString(hook.transform),
        transition: hook.transition,
        opacity: hook.isDragging ? 0.4 : 1,
      },
      handleProps: { ...hook.attributes, ...hook.listeners },
    };
  }

  return (
    <div ref={sortable.ref} style={sortable.style}
      className={`lu-card size-${cardSize}`}
      onClick={() => onOpen(task)}>
      <div className="lu-mood-bar" style={{ background: moodColor }} />
      {!isOverlay && (
        <span className="lu-drag-handle" {...sortable.handleProps} onClick={e => e.stopPropagation()}>
          &#8942;
        </span>
      )}
      <div className="lu-mood-chip" style={{ background: moodBg }}>
        <span style={{ fontSize: isBig ? 26 : isNarrow ? 14 : 20 }}>{mood?.icon || '?'}</span>
        {!isNarrow && <span className="lu-mood-name" style={{ color: moodColor }}>{mood?.label || ''}</span>}
      </div>
      <div className="lu-info">
        <div className="lu-title">{task.isMilestone ? '\u{1F3C1} ' : ''}{task.name}</div>
        {!isNarrow && (
          <div className="lu-meta-row">
            {client && <span className="lu-meta-chip" style={{ background: `${client.color}15`, color: client.color }}>{client.name}</span>}
            {assignees.map(m => (
              <span key={m.id} className="lu-meta-chip" style={{ background: `${m.color}12`, color: m.color }}>{m.name}</span>
            ))}
            <select className="lu-status-sel"
              style={{ background: STB[task.status], color: STC[task.status], borderColor: `${STC[task.status]}33` }}
              onClick={e => e.stopPropagation()}
              onChange={e => { e.stopPropagation(); onStatusChange(task.id, e.target.value); }}
              value={task.status}>
              {STATS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {timeStr && <span className="lu-time-chip">{timeStr}</span>}
          </div>
        )}
        {isBig && task.notes && (
          <div style={{
            fontSize: 12, color: 'var(--t2)', marginTop: 4, lineHeight: 1.5,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', opacity: 0.7
          }}>{task.notes}</div>
        )}
      </div>
      <div className="lu-actions">
        {!isNarrow && <button className="lu-open-btn" onClick={e => { e.stopPropagation(); onOpen(task); }}>Open</button>}
        <button className="lu-hide-btn" onClick={e => { e.stopPropagation(); onHide(task.id); }} title="Hide">&#10005;</button>
      </div>
    </div>
  );
}
