import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { pgEsc, hasLinkedTask } from '../../utils/playgroundHelpers';
import type { CellData } from '../../utils/playgroundHelpers';

interface Task { id: string; deleted?: boolean; name?: string; }
interface Props {
  row: number;
  col: number;
  cell: CellData | undefined;
  tasks: Task[];
  isSelected: boolean;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onSelect: (r: number, c: number, shiftKey?: boolean) => void;
  onStartEdit: (r: number, c: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onConvertToTask: (r: number, c: number) => void;
  onOpenTask: (taskId: string) => void;
  onUnlink: (r: number, c: number, taskId?: string) => void;
}

export default function SpreadsheetCell({
  row, col, cell, tasks, isSelected, isActive,
  isEditing, editValue, onEditValueChange,
  onSelect, onStartEdit, onSaveEdit, onCancelEdit,
  onConvertToTask, onOpenTask, onUnlink,
}: Props) {
  const linked = hasLinkedTask(tasks, cell);
  const linkedTask = linked && cell?.taskId ? tasks.find(t => t.id === cell.taskId && !t.deleted) : null;

  const isTouchDevice = useMemo(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0, []);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const touchHandled = useRef(false);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      const val = el.value;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(val.length, val.length);
      });
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
    if (touchHandled.current) {
      touchHandled.current = false;
      return;
    }
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onSelect(row, col, e.shiftKey);
    if (isTouchDevice) {
      onStartEdit(row, col);
    }
  }, [onSelect, onStartEdit, row, col, isTouchDevice]);

  const handleDoubleClick = useCallback(() => {
    onStartEdit(row, col);
  }, [onStartEdit, row, col]);

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTouchDevice) {
      e.preventDefault();
    }
    longPressFired.current = false;
    touchHandled.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      const rect = document.querySelector('.pg-scroll-wrap')?.getBoundingClientRect();
      setContextMenu({ x: rect ? rect.left + 40 : 100, y: rect ? rect.top + 40 : 100 });
    }, 500);
  }, [isTouchDevice]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isTouchDevice && !longPressFired.current) {
      touchHandled.current = true;
      onSelect(row, col);
      onStartEdit(row, col);
    }
  }, [onSelect, onStartEdit, row, col, isTouchDevice]);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClearCell = useCallback(() => {
    if (confirm('Clear this cell? This will remove all content and tasks from this cell.')) {
      onUnlink(row, col);
    }
    setContextMenu(null);
  }, [onUnlink, row, col]);

  const handleRemoveTask = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (cell?.taskId) onUnlink(row, col, cell.taskId);
  }, [onUnlink, row, col, cell]);

  const handleOpenTask = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (cell?.taskId) onOpenTask(cell.taskId);
  }, [onOpenTask, cell]);

  const handleConvertToTask = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onConvertToTask(row, col);
  }, [onConvertToTask, row, col]);

  const value = isEditing ? editValue : (cell?.text || '');
  const showPlus = value.trim().length > 0 && !cell?.taskId;

  return (
    <td
      data-row={row}
      data-col={col}
      className={`pg-cell-td${isSelected ? ' range-selected' : ''}${isActive ? ' selected' : ''}${isEditing ? ' editing' : ''}`}
      onMouseEnter={(e) => {
        const a = e.currentTarget.querySelector('.pg-cell-actions') as HTMLElement;
        if (a) a.style.display = 'flex';
      }}
      onMouseLeave={(e) => {
        const a = e.currentTarget.querySelector('.pg-cell-actions') as HTMLElement;
        if (a) a.style.display = '';
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="cell-editor"
          value={editValue}
          onChange={e => onEditValueChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={handleEditorKeyDown}
        />
      ) : (
        <div
          className={`pg-cell${linked ? ' has-task' : ''}${isActive ? ' selected' : ''}`}
          role="button"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          {value ? (
            <div className="cell-text">{pgEsc(value)}</div>
          ) : null}
          {linked && linkedTask && (
            <div className="cell-task-badges">
              <span className="cell-task-chip" style={{ background: '#e8f0fe' }}>
                <span style={{ fontSize: 11, marginRight: 2 }}>📌</span>
                <span className="cell-task-chip-name">{pgEsc(linkedTask.name || '')}</span>
                <button className="cell-task-chip-btn" onClick={handleOpenTask} title="Open task">📄</button>
                <button className="cell-task-chip-btn" onClick={handleRemoveTask} title="Remove from cell">✕</button>
              </span>
            </div>
          )}
        </div>
      )}
      {showPlus && (
        <div className="pg-cell-actions">
          <button className="pg-cell-btn" onClick={handleConvertToTask} title="Convert to task">+</button>
        </div>
      )}

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
