import { useCallback } from 'react';
import SpreadsheetCell from './SpreadsheetCell';
import { PG_ROWS, PG_COLS, getCellData } from '../../utils/playgroundHelpers';
import type { TabData } from '../../utils/playgroundHelpers';

interface Task { id: string; deleted?: boolean; name?: string; }
interface Props {
  tab: TabData;
  tasks: Task[];
  onConvertToTask: (r: number, c: number) => void;
  onOpenTask: (taskId: string) => void;
  onUnlink: (r: number, c: number) => void;
}

export default function SpreadsheetGrid({ tab, tasks, onConvertToTask, onOpenTask, onUnlink }: Props) {
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
  for (let r = 0; r < PG_ROWS; r++) {
    const cells: JSX.Element[] = [];
    for (let c = 0; c < PG_COLS; c++) {
      const cell = getCellData(tab, r, c);
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

  return (
    <table className="pg-table">
      <colgroup>{Array(PG_COLS).fill(0).map((_, i) => <col key={i} />)}</colgroup>
      <tbody>{rows}</tbody>
    </table>
  );
}
