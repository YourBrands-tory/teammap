import { useCallback, useState, useRef, useEffect } from 'react';
import SpreadsheetCell from './SpreadsheetCell';
import { PG_COLS, getCellData, getCellKey } from '../../utils/playgroundHelpers';
import type { TabData } from '../../utils/playgroundHelpers';

interface Task { id: string; deleted?: boolean; name?: string; }
interface Client { id: string; name: string; color: string; industry: string; order?: number; }
interface Props {
  tab: TabData;
  tasks: Task[];
  clients: Client[];
  onConvertToTask: (r: number, c: number) => void;
  onOpenTask: (taskId: string) => void;
  onUnlink: (r: number, c: number) => void;
  onUpdateTaskName: (taskId: string, name: string) => void;
  onQuickCreate: (r: number, c: number, name: string) => void;
}

export default function SpreadsheetGrid({
  tab, tasks, clients,
  onConvertToTask, onOpenTask, onUnlink,
  onUpdateTaskName, onQuickCreate,
}: Props) {
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const gridRef = useRef<HTMLDivElement>(null);
  const wasEditing = useRef(false);
  const draftsRef = useRef<Record<string, string>>({});

  const sortedClients = [...clients].sort((a, b) => (a.order || 0) - (b.order || 0));

  const rowIndices = sortedClients.length > 0
    ? sortedClients.map((_, i) => i)
    : [0];

  const totalRows = rowIndices.length;

  const moveTo = useCallback((row: number, col: number) => {
    if (row < 0 || row >= totalRows) return;
    if (col < 0 || col >= PG_COLS) return;
    setSelectedRow(row);
    setSelectedCol(col);
  }, [totalRows]);

  const saveDraft = useCallback(() => {
    if (isEditing) {
      draftsRef.current[getCellKey(selectedRow, selectedCol)] = editValue;
    }
  }, [isEditing, selectedRow, selectedCol, editValue]);

  const loadCellEditing = useCallback((row: number, col: number): boolean => {
    if (row < 0 || row >= totalRows) return false;
    if (col < 0 || col >= PG_COLS) return false;
    saveDraft();
    const key = getCellKey(row, col);
    const existingDraft = draftsRef.current[key];
    if (existingDraft !== undefined) {
      setEditValue(existingDraft);
    } else {
      const cell = getCellData(tab, row, col);
      const linkedTask = cell?.taskId ? tasks.find(t => t.id === cell.taskId && !t.deleted) : null;
      setEditValue(linkedTask?.name || '');
    }
    setSelectedRow(row);
    setSelectedCol(col);
    return true;
  }, [totalRows, saveDraft, tab, tasks]);

  const handleCellSelect = useCallback((row: number, col: number) => {
    saveDraft();
    const key = getCellKey(row, col);
    const existingDraft = draftsRef.current[key];
    if (existingDraft !== undefined) {
      setEditValue(existingDraft);
    } else {
      const cell = getCellData(tab, row, col);
      const linkedTask = cell?.taskId ? tasks.find(t => t.id === cell.taskId && !t.deleted) : null;
      setEditValue(linkedTask?.name || '');
    }
    setSelectedRow(row);
    setSelectedCol(col);
    setIsEditing(true);
  }, [saveDraft, tab, tasks]);

  const handleCreateFromDraft = useCallback((row: number, col: number) => {
    const draft = (isEditing && selectedRow === row && selectedCol === col)
      ? editValue.trim()
      : '';
    if (draft) {
      onQuickCreate(row, col, draft);
      setEditValue('');
      delete draftsRef.current[getCellKey(row, col)];
    } else {
      onConvertToTask(row, col);
    }
  }, [isEditing, selectedRow, selectedCol, editValue, onQuickCreate, onConvertToTask]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isEditing) {
      switch (e.key) {
        case 'ArrowLeft': {
          const pos = (e.target as HTMLInputElement)?.selectionStart ?? 0;
          if (pos === 0) {
            e.preventDefault();
            loadCellEditing(selectedRow, selectedCol - 1);
          }
          return;
        }
        case 'ArrowRight': {
          const target = e.target as HTMLInputElement;
          const pos = target?.selectionStart ?? 0;
          const len = target?.value.length ?? 0;
          if (pos >= len) {
            e.preventDefault();
            loadCellEditing(selectedRow, selectedCol + 1);
          }
          return;
        }
        case 'ArrowUp': {
          const pos = (e.target as HTMLInputElement)?.selectionStart ?? 0;
          if (pos === 0) {
            e.preventDefault();
            loadCellEditing(selectedRow - 1, selectedCol);
          }
          return;
        }
        case 'ArrowDown': {
          const target = e.target as HTMLInputElement;
          const pos = target?.selectionStart ?? 0;
          const len = target?.value.length ?? 0;
          if (pos >= len) {
            e.preventDefault();
            loadCellEditing(selectedRow + 1, selectedCol);
          }
          return;
        }
        case 'Tab': {
          e.preventDefault();
          saveDraft();
          const dir = e.shiftKey ? -1 : 1;
          const nextCol = selectedCol + dir;
          if (nextCol < 0 || nextCol >= PG_COLS) {
            const nextRow = selectedRow + dir;
            if (nextRow < 0 || nextRow >= totalRows) return;
            loadCellEditing(nextRow, dir < 0 ? PG_COLS - 1 : 0);
          } else {
            loadCellEditing(selectedRow, nextCol);
          }
          return;
        }
        case 'Enter':
        case 'Escape':
          e.preventDefault();
          setIsEditing(false);
          return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveTo(selectedRow - 1, selectedCol);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveTo(selectedRow + 1, selectedCol);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveTo(selectedRow, selectedCol - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveTo(selectedRow, selectedCol + 1);
        break;
      case 'Tab': {
        e.preventDefault();
        const dir = e.shiftKey ? -1 : 1;
        const nextCol = selectedCol + dir;
        if (nextCol < 0 || nextCol >= PG_COLS) {
          const nextRow = selectedRow + dir;
          if (nextRow < 0 || nextRow >= totalRows) return;
          moveTo(nextRow, dir < 0 ? PG_COLS - 1 : 0);
        } else {
          moveTo(selectedRow, nextCol);
        }
        break;
      }
      case 'Enter':
        e.preventDefault();
        handleCellSelect(selectedRow, selectedCol);
        break;
      case 'Escape':
        e.preventDefault();
        setSelectedRow(0);
        setSelectedCol(0);
        break;
    }
  }, [isEditing, selectedRow, selectedCol, totalRows, saveDraft, loadCellEditing, moveTo, handleCellSelect]);

  useEffect(() => {
    gridRef.current?.focus();
  }, []);

  useEffect(() => {
    if (wasEditing.current && !isEditing) {
      gridRef.current?.focus();
    }
    wasEditing.current = isEditing;
  }, [isEditing]);

  const handleContainerClick = useCallback(() => {
    gridRef.current?.focus();
  }, []);

  const rows: JSX.Element[] = [];
  let taskCount = 0;
  for (const r of rowIndices) {
    const cells: JSX.Element[] = [];
    for (let c = 0; c < PG_COLS; c++) {
      const cell = getCellData(tab, r, c);
      if (cell?.taskId) taskCount++;
      cells.push(
        <SpreadsheetCell
          key={`${r},${c}`}
          row={r} col={c} cell={cell} tasks={tasks}
          isSelected={selectedRow === r && selectedCol === c}
          isEditing={isEditing && selectedRow === r && selectedCol === c}
          editValue={editValue}
          onEditValueChange={setEditValue}
          onSelect={handleCellSelect}
          onConvertToTask={handleCreateFromDraft}
          onOpenTask={onOpenTask}
          onUnlink={onUnlink}
        />,
      );
    }
    rows.push(<tr key={r}>{cells}</tr>);
  }

  return (
    <div
      ref={gridRef}
      tabIndex={0}
      className="pg-grid-container"
      onKeyDown={handleKeyDown}
      onClick={handleContainerClick}
    >
      <table className="pg-table">
        <colgroup>{Array(PG_COLS).fill(0).map((_, i) => <col key={i} style={{ width: 160, minWidth: 120 }} />)}</colgroup>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
