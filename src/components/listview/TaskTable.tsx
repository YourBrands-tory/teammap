import TaskRow from './TaskRow';
import type { LVSort } from '../../utils/listViewHelpers';

interface Props {
  tasks: any[];
  S: any;
  lvSort: LVSort;
  onSortBy: (col: string) => void;
  onOpenTask: (task: any) => void;
  onDeleteTask: (taskId: string) => void;
}

const HEADERS = [
  { col: 'date', label: 'Date' },
  { col: 'name', label: 'Task name' },
  { col: 'mood', label: 'Mood' },
  { col: 'status', label: 'Status' },
  { col: 'client', label: 'Client' },
  { col: 'assignee', label: 'Assigned to' },
  { col: 'time', label: 'Est. time' },
];

export default function TaskTable({ tasks, S, lvSort, onSortBy, onOpenTask, onDeleteTask }: Props) {
  return (
    <div className="lv-table-wrap">
      <table className="lv-table">
        <thead>
          <tr>
            {HEADERS.map(h => (
              <th
                key={h.col}
                onClick={() => onSortBy(h.col)}
                className={lvSort.col === h.col ? `sort-${lvSort.dir}` : ''}
              >
                {h.label}
              </th>
            ))}
            <th>Tags</th>
            <th>Milestone</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              S={S}
              onOpen={onOpenTask}
              onDelete={onDeleteTask}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
