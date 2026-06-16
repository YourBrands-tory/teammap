import { useState, useRef, useEffect, useCallback } from 'react';
import { pgEsc, hasLinkedTask } from '../../utils/playgroundHelpers';
import type { CellData } from '../../utils/playgroundHelpers';

interface Task { id: string; deleted?: boolean; name?: string; }
interface Props {
  row: number;
  col: number;
  cell: CellData | undefined;
  tasks: Task[];
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onSelect: (r: number, c: number) => void;
  onConvertToTask: (r: number, c: number) => void;
  onOpenTask: (taskId: string) => void;
  onUnlink: (r: number, c: number) => void;
}

export default function SpreadsheetCell({
  row, col, cell, tasks, isSelected,
  isEditing, editValue, onEditValueChange,
  onSelect, onConvertToTask, onOpenTask, onUnlink,
}: Props) {
  const linked = hasLinkedTask(tasks, cell);
  const linkedTask = linked && cell?.taskId ? tasks.find(t => t.id === cell.taskId && !t.deleted) : null;
  const displayText = linkedTask?.name || '';

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onSelect(row, col);
  }, [onSelect, row, col]);

  const handleDoubleClick = useCallback(() => {
    if (linked && cell?.taskId) {
      onOpenTask(cell.taskId);
    }
  }, [linked, cell, onOpenTask]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleTouchStart = useCallback(() => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      const rect = document.querySelector('.pg-scroll-wrap')?.getBoundingClientRect();
      setContextMenu({ x: rect ? rect.left + 40 : 100, y: rect ? rect.top + 40 : 100 });
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleConvertToTask = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onConvertToTask(row, col);
  }, [onConvertToTask, row, col]);

  const handleClearCell = useCallback(() => {
    if (confirm('Clear this cell? This will remove the task from this cell.')) {
      onUnlink(row, col);
    }
    setContextMenu(null);
  }, [onUnlink, row, col]);

  return (
    <td
      onMouseEnter={(e) => {
        const a = e.currentTarget.querySelector('.pg-cell-actions') as HTMLElement;
        if (a) a.style.display = 'flex';
      }}
      onMouseLeave={(e) => {
        const a = e.currentTarget.querySelector('.pg-cell-actions') as HTMLElement;
        if (a) a.style.display = '';
      }}
    >
      <div
        className={`pg-cell${linked ? ' has-task' : ''}${isSelected ? ' selected' : ''}`}
        role="button"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        data-taskid={cell?.taskId || ''}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            className="pg-cell-input"
            type="text"
            value={editValue}
            onChange={e => onEditValueChange(e.target.value)}
          />
        ) : (
          linked ? pgEsc(displayText) : ''
        )}
      </div>
      <div className="pg-cell-actions">
        {linked && cell?.taskId ? (
          <>
            <button className="pg-cell-btn task-done" onClick={(e) => { e.stopPropagation(); onOpenTask(cell.taskId!); }} title="Open task">&#128196;</button>
            <button className="pg-cell-btn" onClick={(e) => { e.stopPropagation(); onUnlink(row, col); }} title="Unlink">&#10005;</button>
          </>
        ) : (
          <button className="pg-cell-btn" onClick={handleConvertToTask} title="Convert to task">&#10133;</button>
        )}
      </div>

      {contextMenu && (
        <div className="pg-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          <button className="pg-context-item pg-context-item-danger" onClick={handleClearCell}>
            Clear cell
          </button>
        </div>
      )}
    </td>
  );
}
