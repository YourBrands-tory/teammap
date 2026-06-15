import { useState, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { LVFilters, LVSort } from '../utils/listViewHelpers';
import { filterAndSortTasks, toggleSort, DEFAULT_FILTERS, DEFAULT_SORT } from '../utils/listViewHelpers';

export default function useListView() {
  const S = useStore(s => s.S);
  const softDeleteTask = useStore(s => s.softDeleteTask);

  const [lvSort, setLvSort] = useState<LVSort>(DEFAULT_SORT);
  const [lvFilters, setLvFilters] = useState<LVFilters>(DEFAULT_FILTERS);
  const [taskModal, setTaskModal] = useState<any>(null);

  const lookup = useMemo(() => ({
    members: S.members,
    clients: S.clients,
    moods: S.moods,
    tags: S.tags,
  }), [S.members, S.clients, S.moods, S.tags]);

  const tasks = useMemo(() =>
    filterAndSortTasks(S.tasks, lvFilters, lvSort, lookup),
    [S.tasks, lvFilters, lvSort, lookup],
  );

  const activeCount = tasks.length;
  const totalCount = useMemo(() =>
    S.tasks.filter((t: any) => !t.deleted).length,
    [S.tasks],
  );

  const setFilter = useCallback((key: string, value: string) => {
    setLvFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setLvFilters(prev => ({
      member: '', client: '', mood: '', status: '', tag: '',
      hideCompleted: prev.hideCompleted,
    }));
  }, []);

  const toggleHideCompleted = useCallback(() => {
    setLvFilters(prev => ({ ...prev, hideCompleted: !prev.hideCompleted }));
  }, []);

  const sortBy = useCallback((col: string) => {
    setLvSort(prev => toggleSort(prev, col));
  }, []);

  const openTask = useCallback((task: any) => {
    setTaskModal(task);
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await softDeleteTask(taskId);
  }, [softDeleteTask]);

  return {
    S, tasks, lvSort, lvFilters, taskModal, activeCount, totalCount,
    setFilter, clearFilters, toggleHideCompleted, sortBy, openTask, setTaskModal, deleteTask,
  };
}
