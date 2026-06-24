import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import SpreadsheetCell from './SpreadsheetCell';
import { PG_COLS, getCellData } from '../../utils/playgroundHelpers';
import type { CellData, TabData } from '../../utils/playgroundHelpers';

interface Task { id: string; deleted?: boolean; name?: string; }
interface Client { id: string; name: string; color: string; industry: string; order?: number; }

interface CellPosition { row: number; col: number; }

interface Props {
  tab: TabData;
  tasks: Task[];
  clients: Client[];
  onConvertToTask: (r: number, c: number) => void;
  onOpenTask: (taskId: string) => void;
  onUnlink: (r: number, c: number, taskId?: string) => void;
  onUpdateCellText: (r: number, c: number, text: string) => void;
  onBulkClearCells: (cells: CellPosition[]) => void;
}

export default function SpreadsheetGrid({
  tab, tasks, clients,
  onConvertToTask, onOpenTask, onUnlink, onUpdateCellText,
  onBulkClearCells,
}: Props) {
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [anchorRow, setAnchorRow] = useState(0);
  const [anchorCol, setAnchorCol] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [toggledCells, setToggledCells] = useState<Set<string>>(new Set());

  const gridRef = useRef<HTMLDivElement>(null);
  const wasEditing = useRef(false);
  const isDragging = useRef(false);
  const clipboardRef = useRef<{ text: string; taskId?: string } | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => { setToast(null); toastTimer.current = null; }, 1500);
  }, []);

  const sortedClients = [...clients].sort((a, b) => (a.order || 0) - (b.order || 0));
  const rowIndices = sortedClients.length > 0
    ? sortedClients.map((_, i) => i)
    : [0];
  const totalRows = rowIndices.length;

  const isInSelection = useCallback((r: number, c: number): boolean => {
    if (toggledCells.has(`${r},${c}`)) return true;
    const minRow = Math.min(anchorRow, selectedRow);
    const maxRow = Math.max(anchorRow, selectedRow);
    const minCol = Math.min(anchorCol, selectedCol);
    const maxCol = Math.max(anchorCol, selectedCol);
    return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
  }, [anchorRow, anchorCol, selectedRow, selectedCol, toggledCells]);

  const selectedCells = useMemo((): CellPosition[] => {
    const cells: CellPosition[] = [];
    const minRow = Math.min(anchorRow, selectedRow);
    const maxRow = Math.max(anchorRow, selectedRow);
    const minCol = Math.min(anchorCol, selectedCol);
    const maxCol = Math.max(anchorCol, selectedCol);
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cells.push({ row: r, col: c });
      }
    }
    const set = new Set(cells.map(c => `${c.row},${c.col}`));
    toggledCells.forEach(key => {
      if (!set.has(key)) {
        const [r, c] = key.split(',').map(Number);
        cells.push({ row: r, col: c });
        set.add(key);
      }
    });
    return cells;
  }, [anchorRow, anchorCol, selectedRow, selectedCol, toggledCells]);

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

  const getActiveCellData = useCallback((): CellData => {
    return getCellData(tab, selectedRow, selectedCol);
  }, [tab, selectedRow, selectedCol]);

  const handleCopy = useCallback(() => {
    const cell = getActiveCellData();
    clipboardRef.current = { text: cell.text || '', taskId: cell.taskId };
    try { navigator.clipboard.writeText(cell.text || ''); } catch { /* fallback */ }
    showToast('Copied');
  }, [getActiveCellData, showToast]);

  const handleCut = useCallback(() => {
    const cell = getActiveCellData();
    clipboardRef.current = { text: cell.text || '', taskId: cell.taskId };
    try { navigator.clipboard.writeText(cell.text || ''); } catch { /* fallback */ }
    onUpdateCellText(selectedRow, selectedCol, '');
    showToast('Cut');
  }, [getActiveCellData, selectedRow, selectedCol, onUpdateCellText, showToast]);

  const handlePaste = useCallback(async () => {
    let text = clipboardRef.current?.text ?? null;
    if (text === null) {
      try { text = await navigator.clipboard.readText(); } catch { return; }
    }
    if (text != null) {
      onUpdateCellText(selectedRow, selectedCol, text);
      showToast('Pasted');
    }
  }, [selectedRow, selectedCol, onUpdateCellText, showToast]);

  const clearSelectedCells = useCallback(() => {
    if (selectedCells.length === 0) return;
    onBulkClearCells(selectedCells);
    setToggledCells(new Set());
    gridRef.current?.focus();
  }, [selectedCells, onBulkClearCells]);

  const handleCellSelect = useCallback((row: number, col: number, shiftKey?: boolean, ctrlKey?: boolean) => {
    if (isEditing && row === selectedRow && col === selectedCol) return;
    commitEdit();
    if (ctrlKey) {
      setToggledCells(prev => {
        const next = new Set(prev);
        const key = `${row},${col}`;
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
      });
      return;
    }
    if (shiftKey) {
      setSelectedRow(row);
      setSelectedCol(col);
    } else {
      setToggledCells(new Set());
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
    if (e.ctrlKey || e.metaKey) {
      setToggledCells(prev => {
        const next = new Set(prev);
        const key = `${row},${col}`;
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
      });
      return;
    }
    setToggledCells(new Set());
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
      case 'Escape':
        e.preventDefault();
        setAnchorRow(0);
        setAnchorCol(0);
        setSelectedRow(0);
        setSelectedCol(0);
        break;
      default:
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
          const k = e.key.toLowerCase();
          if (k === 'c') { e.preventDefault(); handleCopy(); return; }
          if (k === 'x') { e.preventDefault(); handleCut(); return; }
          if (k === 'v') { e.preventDefault(); handlePaste(); return; }
        }
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setEditValue(e.key);
          setIsEditing(true);
        }
        break;
    }
  }, [isEditing, selectedRow, selectedCol, totalRows, tab, saveEdit, cancelEdit, moveTo, startEdit, clearSelectedCells, handleCopy, handleCut, handlePaste]);

  useEffect(() => {
    gridRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;
      if (isTyping) return;

      if (isEditing) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCells.length > 0) {
          e.preventDefault();
          clearSelectedCells();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, selectedCells, clearSelectedCells]);

  useEffect(() => {
    if (wasEditing.current && !isEditing) {
      gridRef.current?.focus();
    }
    wasEditing.current = isEditing;
  }, [isEditing]);

  const rangeMinRow = Math.min(anchorRow, selectedRow);
  const rangeMaxRow = Math.max(anchorRow, selectedRow);
  const rangeMinCol = Math.min(anchorCol, selectedCol);
  const rangeMaxCol = Math.max(anchorCol, selectedCol);
  const multiSelected = rangeMinRow !== rangeMaxRow || rangeMinCol !== rangeMaxCol || toggledCells.size > 0;

  const rows: JSX.Element[] = [];
  for (const r of rowIndices) {
    const cells: JSX.Element[] = [];
    for (let c = 0; c < PG_COLS; c++) {
      const cell = getCellData(tab, r, c);
      const inRange = r >= rangeMinRow && r <= rangeMaxRow && c >= rangeMinCol && c <= rangeMaxCol;
      const rangeEdge = multiSelected && inRange
        ? ((r === rangeMinRow ? 't' : '') + (r === rangeMaxRow ? 'b' : '') + (c === rangeMinCol ? 'l' : '') + (c === rangeMaxCol ? 'r' : ''))
        : '';
      cells.push(
        <SpreadsheetCell
          key={`${r},${c}`}
          row={r} col={c} cell={cell} tasks={tasks}
          isSelected={isInSelection(r, c)}
          isActive={selectedRow === r && selectedCol === c}
          isEditing={isEditing && selectedRow === r && selectedCol === c}
          editValue={editValue}
          rangeEdge={rangeEdge}
          onEditValueChange={setEditValue}
          onSelect={handleCellSelect}
          onStartEdit={startEdit}
          onSaveEdit={saveEdit}
          onCancelEdit={cancelEdit}
          onConvertToTask={onConvertToTask}
          onOpenTask={onOpenTask}
          onUnlink={onUnlink}
          onClearSelectedCells={clearSelectedCells}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
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
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#323232', color: '#fff', padding: '8px 20px', borderRadius: 6,
          fontSize: 13, zIndex: 9999, pointerEvents: 'none', transition: 'opacity 0.2s',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
