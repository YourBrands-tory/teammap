import { useEffect, useRef, useCallback } from 'react';

interface Task { id: string; mood: string; name: string; deleted?: boolean; }
interface Mood { id: string; icon: string; }
interface S { tasks: Task[]; moods: Mood[]; lineUpHidden: Record<string, string[]>; }

interface Props {
  S: S;
  date: string;
  panelWidth: number;
  onResize: (w: number) => void;
  onRestore: (id: string) => void;
}

export default function HiddenPanel({ S, date, panelWidth, onResize, onRestore }: Props) {
  const resizerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const container = resizerRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let newWidth = rect.right - e.clientX;
      newWidth = Math.max(160, Math.min(450, newWidth));
      onResize(newWidth);
    };
    const handleMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize]);

  const hiddenIds = S.lineUpHidden[date] || [];
  const hiddenTasks = hiddenIds.map((id: string) => S.tasks.find(t => t.id === id && !t.deleted)).filter(Boolean) as Task[];

  return (
    <>
      <div className="lu-resizer" ref={resizerRef} onMouseDown={handleMouseDown} />
      <div className="lu-hidden-panel" style={{ width: panelWidth }}>
        <div className="lu-hidden-head">
          &#128065;&#8203;&#128450; Hidden
          <span style={{ background: 'var(--s2)', color: 'var(--t2)', padding: '1px 7px', borderRadius: 10, fontSize: 11 }}>
            {hiddenTasks.length}
          </span>
        </div>
        <div className="lu-hidden-body">
          {!hiddenTasks.length ? (
            <div style={{ fontSize: 12, color: 'var(--t3)', padding: '12px 6px', textAlign: 'center' }}>No hidden tasks</div>
          ) : hiddenTasks.map(t => {
            const mood = S.moods.find(m => m.id === t.mood);
            return (
              <div key={t.id} className="lu-hidden-card">
                <span style={{ fontSize: 13 }}>{mood?.icon || '?'}</span>
                <span className="lu-title" style={{ flex: 1 }}>{t.name}</span>
                <button className="lu-restore-btn" onClick={() => onRestore(t.id)} title="Bring back to line up">&#8630;</button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
