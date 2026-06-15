import { pgEsc, hasLinkedTask } from '../../utils/playgroundHelpers';
import type { CellData } from '../../utils/playgroundHelpers';

interface Task { id: string; deleted?: boolean; name?: string; }
interface Props {
  row: number;
  col: number;
  cell: CellData | undefined;
  tasks: Task[];
  onConvertToTask: (r: number, c: number) => void;
  onOpenTask: (taskId: string) => void;
  onUnlink: (r: number, c: number) => void;
  onKeyDown: (e: React.KeyboardEvent, r: number, c: number) => void;
}

export default function SpreadsheetCell({ row, col, cell, tasks, onConvertToTask, onOpenTask, onUnlink, onKeyDown }: Props) {
  const linked = hasLinkedTask(tasks, cell);
  const linkedTask = linked && cell?.taskId ? tasks.find(t => t.id === cell.taskId && !t.deleted) : null;
  const displayText = linkedTask?.name || '';

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
        className={`pg-cell${linked ? ' has-task' : ''}`}
        tabIndex={0}
        role="button"
        onClick={() => { if (linked && cell?.taskId) onOpenTask(cell.taskId); else onConvertToTask(row, col); }}
        onKeyDown={(e) => onKeyDown(e, row, col)}
        data-taskid={cell?.taskId || ''}
      >
        {linked ? pgEsc(displayText) : ''}
      </div>
      <div className="pg-cell-actions">
        {linked && cell?.taskId ? (
          <>
            <button className="pg-cell-btn task-done" onClick={(e) => { e.stopPropagation(); onOpenTask(cell.taskId!); }} title="Open task">&#128196;</button>
            <button className="pg-cell-btn" onClick={(e) => { e.stopPropagation(); onUnlink(row, col); }} title="Unlink">&#10005;</button>
          </>
        ) : (
          <button className="pg-cell-btn" onClick={(e) => { e.stopPropagation(); onConvertToTask(row, col); }} title="Convert to task">&#10133;</button>
        )}
      </div>
    </td>
  );
}
