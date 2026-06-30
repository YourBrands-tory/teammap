import { useEffect, useRef, useCallback } from 'react';

interface Task { id: string; mood: string; name: string; }
interface Mood { id: string; icon: string; }

interface Props {
  hiddenTasks: Task[];
  moods: Mood[];
  onRestore: (id: string) => void;
  panelWidth?: number;
  onResize?: (w: number) => void;
}

export default function HiddenTasksPanel({ hiddenTasks, moods, onRestore, panelWidth, onResize }: Props) {
  const resizerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onResize) return;
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  }, [onResize]);

  useEffect(() => {
    if (!onResize) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const container = resizerRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let newWidth = rect.right - e.clientX;
      newWidth = Math.max(200, Math.min(600, newWidth));
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

  return (
    <>
      {onResize && <div className="lu-resizer" ref={resizerRef} onMouseDown={handleMouseDown} />}
      <div className="lu-hidden-panel" style={{ width: panelWidth || 280 }}>
        <div className="lu-hidden-head">
          <span>Hidden</span>
          <span className="lu-hidden-count">
            {hiddenTasks.length}
          </span>
        </div>
        <div className="lu-hidden-body">
          {!hiddenTasks.length ? (
            <div className="lu-hidden-empty">No hidden tasks</div>
          ) : hiddenTasks.map(t => {
            const mood = moods.find(m => m.id === t.mood);
            return (
              <div key={t.id} className="lu-hidden-card">
                <span className="lu-hidden-mood-icon">{mood?.icon || '?'}</span>
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
