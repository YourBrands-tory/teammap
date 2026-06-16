import { useState, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { today } from '../lib/constants';
import { getFilteredAndSortedTasks, dayProgress } from '../utils/lineUpHelpers';
import type { DragEndEvent } from '@dnd-kit/core';

type SortMode = 'mood' | 'team' | 'client';
type Filters = { member: string; client: string; mood: string };

export default function useLineUp() {
  const S = useStore(s => s.S);
  const upsertTask = useStore(s => s.upsertTask);
  const setStateKey = useStore(s => s.setStateKey);
  const uiViewState = useUIStore(s => s.viewStates.lu || {});
  const setViewState = useUIStore(s => s.setViewState);

  const [date, setDate] = useState(uiViewState.date || today());
  const [sortMode, setSortMode] = useState<SortMode>((uiViewState.sortMode as SortMode) || 'mood');
  const [filters, setFilters] = useState<Filters>(uiViewState.filters || { member: '', client: '', mood: '' });
  const [panelWidth, setPanelWidth] = useState(uiViewState.panelWidth || 240);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [taskModal, setTaskModal] = useState<any>(null);

  // Persist UI state on change
  useEffect(() => {
    setViewState('lu', { date, sortMode, filters, panelWidth });
  }, [date, sortMode, filters, panelWidth, setViewState]);

  const shift = useCallback((days: number) => {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  }, [date]);

  const goToday = useCallback(() => setDate(today()), []);

  const tasks = getFilteredAndSortedTasks(S, date, filters, sortMode);
  const allOnDate = S.tasks.filter((t: any) => t.date === date && !t.deleted);
  const prog = dayProgress(allOnDate);

  const totalMins = allOnDate.reduce((a: number, t: any) => a + ((t.estH || 0) * 60 + (t.estM || 0)), 0);

  const setStatus = useCallback(async (taskId: string, status: string) => {
    const t = S.tasks.find((x: any) => x.id === taskId);
    if (t) await upsertTask({ ...t, status });
  }, [S.tasks, upsertTask]);

  const hideTask = useCallback(async (taskId: string) => {
    const hidden = [...(S.lineUpHidden[date] || []), taskId];
    const order = S.lineUpOrder[date] ? S.lineUpOrder[date].filter((id: string) => id !== taskId) : undefined;
    await setStateKey('lineUpHidden', { ...S.lineUpHidden, [date]: hidden });
    if (order) await setStateKey('lineUpOrder', { ...S.lineUpOrder, [date]: order });
  }, [S.lineUpHidden, S.lineUpOrder, date, setStateKey]);

  const restoreTask = useCallback(async (taskId: string) => {
    if (!S.lineUpHidden[date]) return;
    const hidden = S.lineUpHidden[date].filter((id: string) => id !== taskId);
    await setStateKey('lineUpHidden', { ...S.lineUpHidden, [date]: hidden });
  }, [S.lineUpHidden, date, setStateKey]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) { setActiveId(null); return; }
    const ids = tasks.map(t => t.id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) { setActiveId(null); return; }
    ids.splice(oldIdx, 1);
    ids.splice(newIdx, 0, active.id as string);
    setStateKey('lineUpOrder', { ...S.lineUpOrder, [date]: ids });
    setActiveId(null);
  }, [tasks, S.lineUpOrder, date, setStateKey]);

  const setFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return {
    S, date, sortMode, filters, tasks, allOnDate, prog, totalMins,
    panelWidth, activeId, taskModal,
    setDate, shift, goToday, setSortMode, setFilter,
    setStatus, hideTask, restoreTask,
    handleDragEnd, setActiveId, setTaskModal, setPanelWidth,
  };
}
