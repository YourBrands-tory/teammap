export const PG_ROWS = 20;
export const PG_COLS = 10;

export interface CellData {
  taskId: string;
}

export interface TabData {
  id: string;
  name: string;
  data: Record<string, CellData>;
}

export interface PlaygroundData {
  tabs: TabData[];
}

export function pgEsc(t: string): string {
  return (t || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function getCellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function getCellData(tab: TabData, row: number, col: number): CellData {
  const key = getCellKey(row, col);
  return tab.data[key] || { taskId: '' };
}

export function hasLinkedTask(
  tasks: Array<{ id: string; deleted?: boolean }>,
  cell: CellData | undefined,
): boolean {
  return !!(cell?.taskId && tasks.find(t => t.id === cell.taskId && !t.deleted));
}
