import { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { uid, today } from '../lib/constants';
import { getCellData } from '../utils/playgroundHelpers';
import type { TabData, PlaygroundData } from '../utils/playgroundHelpers';

export default function usePlayground() {
  const S = useStore(s => s.S);
  const setStateKey = useStore(s => s.setStateKey);
  const upsertTask = useStore(s => s.upsertTask);
  const uiViewState = useUIStore(s => s.viewStates.pg || {});
  const setViewState = useUIStore(s => s.setViewState);

  const pg: PlaygroundData = S.playground || { tabs: [{ id: uid(), name: 'Sheet 1', data: {} }] };
  const [activeTab, setActiveTab] = useState(uiViewState.activeTab ?? 0);
  const [sidebarOpen, setSidebarOpen] = useState(uiViewState.sidebarOpen ?? true);
  const [taskModal, setTaskModal] = useState<any>(null);
  const [renameModal, setRenameModal] = useState<{ tabIndex: number; name: string } | null>(null);
  const [pendingCell, setPendingCell] = useState<{ row: number; col: number } | null>(null);
  const [fromCellText, setFromCellText] = useState('');

  useEffect(() => {
    setViewState('pg', { activeTab, sidebarOpen });
  }, [activeTab, sidebarOpen, setViewState]);

  const tabs = pg.tabs;
  const tab = tabs[activeTab] || tabs[0];

  const persist = useCallback((updatedTabs: TabData[]) => {
    setStateKey('playground', { tabs: updatedTabs });
  }, [setStateKey]);

  const addTab = useCallback(() => {
    const updated = [...tabs, { id: uid(), name: `Sheet ${tabs.length + 1}`, data: {} }];
    setActiveTab(updated.length - 1);
    persist(updated);
  }, [tabs, persist]);

  const deleteTab = useCallback((i: number) => {
    if (tabs.length === 1) { alert('Cannot delete the last sheet.'); return; }
    if (!confirm('Delete this sheet?')) return;
    const updated = tabs.filter((_, idx) => idx !== i);
    setActiveTab((prev: number) => Math.min(prev, updated.length - 1));
    persist(updated);
  }, [tabs, persist]);

  const renameTab = useCallback((i: number) => {
    setRenameModal({ tabIndex: i, name: tabs[i].name });
  }, [tabs]);

  const saveRename = useCallback((i: number, name: string) => {
    const updated = tabs.map((t, idx) => idx === i ? { ...t, name } : t);
    persist(updated);
    setRenameModal(null);
  }, [tabs, persist]);

  const clearTab = useCallback((i: number) => {
    if (!confirm('Clear all content in this sheet?')) return;
    const updated = tabs.map((t, idx) => idx === i ? { ...t, data: {} } : t);
    persist(updated);
  }, [tabs, persist]);

  const updateCellText = useCallback((row: number, col: number, text: string) => {
    const key = `${row},${col}`;
    const updated: TabData[] = tabs.map((t, i) => {
      if (i !== activeTab) return t;
      const existing = t.data[key] || { text: '', taskId: undefined };
      return { ...t, data: { ...t.data, [key]: { ...existing, text } } };
    });
    persist(updated);
  }, [tabs, activeTab, persist]);

  const convertToTask = useCallback((row: number, col: number) => {
    const cell = getCellData(tab, row, col);
    setPendingCell({ row, col });
    setFromCellText(cell.text || '');
    setTaskModal({ date: today(), name: cell.text || '' });
  }, [tab]);

  const handleTaskSaved = useCallback(async (savedTask: any) => {
    if (!pendingCell) return;
    const key = `${pendingCell.row},${pendingCell.col}`;
    const updated: TabData[] = tabs.map((t, i) => {
      if (i !== activeTab) return t;
      const existing = t.data[key] || { text: '', taskId: undefined };
      return { ...t, data: { ...t.data, [key]: { ...existing, taskId: savedTask.id } } };
    });
    setPendingCell(null);
    setFromCellText('');
    await persist(updated);
  }, [pendingCell, tabs, activeTab, persist]);

  const openTask = useCallback((taskId: string) => {
    const t = S.tasks.find((x: any) => x.id === taskId);
    if (t) {
      setPendingCell(null);
      setTaskModal({ ...t });
    }
  }, [S.tasks]);

  const unlinkCell = useCallback((row: number, col: number, taskId?: string) => {
    const key = `${row},${col}`;
    const updated: TabData[] = tabs.map((t, i) => {
      if (i !== activeTab) return t;
      if (taskId) {
        const existing = t.data[key] || { text: '', taskId: undefined };
        if (existing.taskId === taskId) {
          return { ...t, data: { ...t.data, [key]: { ...existing, taskId: undefined } } };
        }
        return t;
      }
      const newData = { ...t.data };
      delete newData[key];
      return { ...t, data: newData };
    });
    persist(updated);
  }, [tabs, activeTab, persist]);

  const quickCreateTask = useCallback(async (row: number, col: number, name: string) => {
    const firstMood = S.moods[0]?.id || '';
    const saved = await upsertTask({
      name: name.trim(), date: today(), mood: firstMood, status: 'Not Started',
      subtasks: [], links: [],
    });
    const key = `${row},${col}`;
    const updated: TabData[] = tabs.map((t, i) => {
      if (i !== activeTab) return t;
      const existing = t.data[key] || { text: '', taskId: undefined };
      return { ...t, data: { ...t.data, [key]: { ...existing, taskId: saved.id } } };
    });
    await persist(updated);
    return saved;
  }, [S.moods, tabs, activeTab, upsertTask, persist]);

  const updateCellTaskName = useCallback(async (taskId: string, name: string) => {
    const existing = S.tasks.find((t: any) => t.id === taskId);
    if (existing) {
      await upsertTask({ ...existing, subtasks: existing.subtasks || [], links: existing.links || [], name: name.trim() });
    }
  }, [S.tasks, upsertTask]);

  return {
    S, tabs, tab, activeTab, sidebarOpen, taskModal, renameModal, pendingCell, fromCellText,
    setActiveTab, setSidebarOpen, setTaskModal, setPendingCell, setFromCellText,
    addTab, deleteTab, renameTab, saveRename, clearTab,
    convertToTask, handleTaskSaved, openTask, unlinkCell, setRenameModal,
    upsertTask, updateCellText, quickCreateTask, updateCellTaskName,
  };
}
