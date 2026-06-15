import { useCallback } from 'react';
import SpreadsheetCell from './SpreadsheetCell';
import { PG_COLS, ROW_HEIGHT, getCellData } from '../../utils/playgroundHelpers';
import type { TabData } from '../../utils/playgroundHelpers';

interface Task { id: string; deleted?: boolean; name?: string; }
interface Client { id: string; name: string; color: string; industry: string; order?: number; }
interface Props {
  tab: TabData;
  tasks: Task[];
  clients: Client[];
  selectedClientId?: string | null;
  onConvertToTask: (r: number, c: number) => void;
  onOpenTask: (taskId: string) => void;
  onUnlink: (r: number, c: number) => void;
}

export default function SpreadsheetGrid({ tab, tasks, clients, selectedClientId, onConvertToTask, onOpenTask, onUnlink }: Props) {
  const sortedClients = [...clients].sort((a, b) => (a.order || 0) - (b.order || 0));

  let rowIndices: number[];
  if (selectedClientId) {
    const idx = sortedClients.findIndex(c => c.id === selectedClientId);
    rowIndices = idx >= 0 ? [idx] : [0];
  } else {
    rowIndices = sortedClients.length > 0
      ? sortedClients.map((_, i) => i)
      : [0];
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    const allCells = document.querySelectorAll<HTMLElement>('.pg-cell');
    const idx = row * PG_COLS + col;

    const move = (nextIdx: number) => {
      const target = allCells[nextIdx];
      if (target) { e.preventDefault(); target.focus(); }
    };

    if (e.key === 'Tab') { e.preventDefault(); move(idx + 1); }
    else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); move(idx + PG_COLS); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); move(idx + PG_COLS); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(idx - PG_COLS); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); move(idx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); move(idx - 1); }
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
          onConvertToTask={onConvertToTask}
          onOpenTask={onOpenTask}
          onUnlink={onUnlink}
          onKeyDown={handleKeyDown}
        />,
      );
    }
    rows.push(<tr key={r}>{cells}</tr>);
  }

  console.log('[PG DEBUG]', {
    cols: PG_COLS,
    renderedCellsPerRow: rowIndices.length > 0 ? PG_COLS : 0,
    gridWidth: PG_COLS * 160,
    totalRows: rowIndices.length,
    linkedTasks: taskCount,
    selectedClientId,
    sortedClientsCount: sortedClients.length,
  });

  return (
    <table className="pg-table">
      <colgroup>{Array(PG_COLS).fill(0).map((_, i) => <col key={i} style={{ width: 160, minWidth: 120 }} />)}</colgroup>
      <tbody>{rows}</tbody>
    </table>
  );
}
