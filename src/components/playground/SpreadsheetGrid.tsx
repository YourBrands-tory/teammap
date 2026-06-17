import { useCallback, useState, useRef, useEffect } from 'react';
import SpreadsheetCell from './SpreadsheetCell';
import { PG_COLS, getCellData } from '../../utils/playgroundHelpers';
import type { TabData } from '../../utils/playgroundHelpers';

interface Task { id: string; deleted?: boolean; name?: string; }
interface Client { id: string; name: string; color: string; industry: string; order?: number; }
interface Props {
  tab: TabData;
  tasks: Task[];
  clients: Client[];
  onConvertToTask: (r: number, c: number) => void;
  onOpenTask: (taskId: string) => void;
  onUnlink: (r: number, c: number, taskId?: string) => void;
  onUpdateCellText: (r: number, c: number, text: string) => void;
}

export default function SpreadsheetGrid({
  tab, tasks, clients,
  onConvertToTask, onOpenTask, onUnlink, onUpdateCellText,
}: Props) {
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const gridRef = useRef<HTMLDivElement>(null);
  const wasEditing = useRef(false);

  const sortedClients = [...clients].sort((a, b) => (a.order || 0) - (b.order || 0));
  const rowIndices = sortedClients.length > 0
    ? sortedClients.map((_, i) => i)
    : [0];
  const totalRows = rowIndices.length;

  const saveEdit = useCallback(() => {
    if (!isEditing) return;
    const cell = getCellData(tab, selectedRow, selectedCol);
    if (editValue !== cell.text) {
      onUpdateCellText(selectedRow, selectedCol, editValue);
    }
  }, [isEditing, selectedRow, selectedCol, editValue, tab, onUpdateCellText]);

  const commitEdit = useCallback(() => {
    saveEdit();
    setIsEditing(false);
    setEditValue('');
  }, [saveEdit]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  const startEdit = useCallback((row: number, col: number) => {
    const cell = getCellData(tab, row, col);
    setSelectedRow(row);
    setSelectedCol(col);
    setEditValue(cell.text);
    setIsEditing(true);
  }, [tab]);

  const handleCellSelect = useCallback((row: number, col: number) => {
    if (isEditing && row === selectedRow && col === selectedCol) return;
    commitEdit();
    setSelectedRow(row);
    setSelectedCol(col);
  }, [isEditing, selectedRow, selectedCol, commitEdit]);

  const moveTo = useCallback((row: number, col: number) => {
    if (row < 0 || row >= totalRows) return;
    if (col < 0 || col >= PG_COLS) return;
    commitEdit();
    setSelectedRow(row);
    setSelectedCol(col);
  }, [totalRows, commitEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isEditing) {
      switch (e.key) {
        case 'Enter': {
          e.preventDefault();
          saveEdit();
          const dir = e.shiftKey ? -1 : 1;
          const nextRow = selectedRow + dir;
          if (nextRow >= 0 && nextRow < totalRows) {
            startEdit(nextRow, selectedCol);
          } else {
            setIsEditing(false);
            setEditValue('');
          }
          return;
        }
        case 'Tab': {
          e.preventDefault();
          saveEdit();
          const dir = e.shiftKey ? -1 : 1;
          const nextCol = selectedCol + dir;
          if (nextCol >= 0 && nextCol < PG_COLS) {
            startEdit(selectedRow, nextCol);
          } else {
            setIsEditing(false);
            setEditValue('');
          }
          return;
        }
        case 'Escape':
          e.preventDefault();
          cancelEdit();
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
          moveTo(selectedRow + dir, dir < 0 ? PG_COLS - 1 : 0);
        } else {
          moveTo(selectedRow, nextCol);
        }
        break;
      }
      case 'Enter':
        e.preventDefault();
        startEdit(selectedRow, selectedCol);
        break;
      case 'Escape':
        e.preventDefault();
        setSelectedRow(0);
        setSelectedCol(0);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          const cell = getCellData(tab, selectedRow, selectedCol);
          setEditValue(e.key);
          setIsEditing(true);
        }
        break;
    }
  }, [isEditing, selectedRow, selectedCol, totalRows, tab, saveEdit, cancelEdit, moveTo, startEdit]);

  useEffect(() => {
    gridRef.current?.focus();
  }, []);

  useEffect(() => {
    if (wasEditing.current && !isEditing) {
      gridRef.current?.focus();
    }
    wasEditing.current = isEditing;
  }, [isEditing]);

  const rows: JSX.Element[] = [];
  for (const r of rowIndices) {
    const cells: JSX.Element[] = [];
    for (let c = 0; c < PG_COLS; c++) {
      const cell = getCellData(tab, r, c);
      cells.push(
        <SpreadsheetCell
          key={`${r},${c}`}
          row={r} col={c} cell={cell} tasks={tasks}
          isSelected={selectedRow === r && selectedCol === c}
          isEditing={isEditing && selectedRow === r && selectedCol === c}
          editValue={editValue}
          onEditValueChange={setEditValue}
          onSelect={handleCellSelect}
          onStartEdit={startEdit}
          onSaveEdit={saveEdit}
          onCancelEdit={cancelEdit}
          onConvertToTask={onConvertToTask}
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
    >
      <table className="pg-table">
        <colgroup>
          {Array(PG_COLS).fill(0).map((_, i) => (
            <col key={i} style={{ width: 160, minWidth: 120 }} />
          ))}
        </colgroup>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
