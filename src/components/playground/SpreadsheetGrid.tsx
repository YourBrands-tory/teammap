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
  const [anchorRow, setAnchorRow] = useState(0);
  const [anchorCol, setAnchorCol] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const gridRef = useRef<HTMLDivElement>(null);
  const wasEditing = useRef(false);
  const isDragging = useRef(false);

  const sortedClients = [...clients].sort((a, b) => (a.order || 0) - (b.order || 0));
  const rowIndices = sortedClients.length > 0
    ? sortedClients.map((_, i) => i)
    : [0];
  const totalRows = rowIndices.length;

  const isInSelection = useCallback((r: number, c: number): boolean => {
    const minRow = Math.min(anchorRow, selectedRow);
    const maxRow = Math.max(anchorRow, selectedRow);
    const minCol = Math.min(anchorCol, selectedCol);
    const maxCol = Math.max(anchorCol, selectedCol);
    return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
  }, [anchorRow, anchorCol, selectedRow, selectedCol]);

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
    setAnchorRow(row);
    setAnchorCol(col);
    setSelectedRow(row);
    setSelectedCol(col);
    setEditValue(cell.text);
    setIsEditing(true);
  }, [tab]);

  const clearSelectedCells = useCallback(() => {
    const minRow = Math.min(anchorRow, selectedRow);
    const maxRow = Math.max(anchorRow, selectedRow);
    const minCol = Math.min(anchorCol, selectedCol);
    const maxCol = Math.max(anchorCol, selectedCol);
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        onUpdateCellText(r, c, '');
        onUnlink(r, c);
      }
    }
    gridRef.current?.focus();
  }, [anchorRow, anchorCol, selectedRow, selectedCol, onUpdateCellText, onUnlink]);

  const handleCellSelect = useCallback((row: number, col: number, shiftKey?: boolean) => {
    if (isEditing && row === selectedRow && col === selectedCol) return;
    commitEdit();
    if (shiftKey) {
      setSelectedRow(row);
      setSelectedCol(col);
    } else {
      setAnchorRow(row);
      setAnchorCol(col);
      setSelectedRow(row);
      setSelectedCol(col);
    }
    gridRef.current?.focus();
  }, [isEditing, selectedRow, selectedCol, commitEdit]);

  const moveTo = useCallback((row: number, col: number) => {
    if (row < 0 || row >= totalRows) return;
    if (col < 0 || col >= PG_COLS) return;
    commitEdit();
    setAnchorRow(row);
    setAnchorCol(col);
    setSelectedRow(row);
    setSelectedCol(col);
  }, [totalRows, commitEdit]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || e.shiftKey) return;
    const td = (e.target as HTMLElement).closest('td');
    if (!td) return;
    const row = parseInt(td.dataset.row ?? '');
    const col = parseInt(td.dataset.col ?? '');
    if (isNaN(row) || isNaN(col)) return;
    if (isEditing && row === selectedRow && col === selectedCol) return;
    commitEdit();
    setAnchorRow(row);
    setAnchorCol(col);
    setSelectedRow(row);
    setSelectedCol(col);
    isDragging.current = true;
    gridRef.current?.focus();
  }, [isEditing, selectedRow, selectedCol, commitEdit]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const td = (e.target as HTMLElement).closest('td');
    if (!td) return;
    const row = parseInt(td.dataset.row ?? '');
    const col = parseInt(td.dataset.col ?? '');
    if (isNaN(row) || isNaN(col)) return;
    setSelectedRow(row);
    setSelectedCol(col);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => { isDragging.current = false; };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isEditing) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          commitEdit();
          moveTo(selectedRow - 1, selectedCol);
          return;
        case 'ArrowDown':
          e.preventDefault();
          commitEdit();
          moveTo(selectedRow + 1, selectedCol);
          return;
        case 'ArrowLeft':
          e.preventDefault();
          commitEdit();
          moveTo(selectedRow, selectedCol - 1);
          return;
        case 'ArrowRight':
          e.preventDefault();
          commitEdit();
          moveTo(selectedRow, selectedCol + 1);
          return;
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
      case 'ArrowUp': {
        e.preventDefault();
        commitEdit();
        if (e.shiftKey) {
          setSelectedRow(Math.max(selectedRow - 1, 0));
        } else {
          moveTo(selectedRow - 1, selectedCol);
        }
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        commitEdit();
        if (e.shiftKey) {
          setSelectedRow(Math.min(selectedRow + 1, totalRows - 1));
        } else {
          moveTo(selectedRow + 1, selectedCol);
        }
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        commitEdit();
        if (e.shiftKey) {
          setSelectedCol(Math.max(selectedCol - 1, 0));
        } else {
          moveTo(selectedRow, selectedCol - 1);
        }
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        commitEdit();
        if (e.shiftKey) {
          setSelectedCol(Math.min(selectedCol + 1, PG_COLS - 1));
        } else {
          moveTo(selectedRow, selectedCol + 1);
        }
        break;
      }
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
      case 'F2':
      case 'Enter':
        e.preventDefault();
        startEdit(selectedRow, selectedCol);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        clearSelectedCells();
        break;
      case 'Escape':
        e.preventDefault();
        setAnchorRow(0);
        setAnchorCol(0);
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
  }, [isEditing, selectedRow, selectedCol, totalRows, tab, saveEdit, cancelEdit, moveTo, startEdit, clearSelectedCells]);

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
          isSelected={isInSelection(r, c)}
          isActive={selectedRow === r && selectedCol === c}
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
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
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
