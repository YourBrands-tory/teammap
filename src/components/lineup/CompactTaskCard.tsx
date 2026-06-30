interface Task {
  id: string; name: string; mood: string; status: string;
  assignedTo?: string[]; isMilestone?: boolean;
}
interface Mood { id: string; icon: string; label: string; color: string; bg: string; }
interface Member { id: string; name: string; color: string; }
interface Client { id: string; name: string; color: string; }
interface S { members: Member[]; clients: Client[]; moods: Mood[]; }

interface Props {
  task: Task;
  mood: Mood | undefined;
  moodColor: string;
  moodBg: string;
  onOpen: (t: any) => void;
  onHide: (id: string) => void;
  onDelete?: (id: string) => void;
  sortableRef: any;
  sortableStyle: any;
  sortableHandleProps: any;
  isOverlay?: boolean;
}

export default function CompactTaskCard({ task, mood, moodColor, moodBg, onOpen, onHide, onDelete, sortableRef, sortableStyle, sortableHandleProps, isOverlay }: Props) {
  return (
    <div ref={sortableRef} style={sortableStyle}
      className="lu-card compact"
      onClick={() => onOpen(task)}>
      <div className="lu-mood-bar" style={{ background: moodColor }} />
      {!isOverlay && (
        <span className="lu-drag-handle" {...sortableHandleProps} onClick={e => e.stopPropagation()}>
          &#8942;
        </span>
      )}
      <div className="lu-mood-chip" style={{ background: moodBg }}>
        <span className="lu-mood-icon">{mood?.icon || '?'}</span>
      </div>
      <div className="lu-info">
        <div className="lu-title">{task.name}</div>
      </div>
      <div className="lu-actions">
        <button className="lu-open-btn" onClick={e => { e.stopPropagation(); onOpen(task); }}>Open</button>
        {onDelete && <button className="lu-del-btn" onClick={e => { e.stopPropagation(); onDelete(task.id); }} title="Delete">&#128465;</button>}
        <button className="lu-hide-btn" onClick={e => { e.stopPropagation(); onHide(task.id); }} title="Hide">&#10005;</button>
      </div>
    </div>
  );
}
