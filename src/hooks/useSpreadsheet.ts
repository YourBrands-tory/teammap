import { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { uid, today } from '../lib/constants';
import { getDefaultStatus } from '../utils/statusUtils';
import { getCellData } from '../utils/playgroundHelpers';
import type { TabData } from '../utils/playgroundHelpers';

interface UseSpreadsheetOptions {
  initialTabs: TabData[];
  persist: (tabs: TabData[]) => void;
  S: { tasks: any[]; moods: any[]; clients: any[]; [key: string]: any };
  upsertTask: (task: any) => Promise<any>;
  memberId?: string;
}

export default function useSpreadsheet({
  initialTabs,
  persist,
  S,
  upsertTask,
  memberId,
}: UseSpreadsheetOptions) {
  const [tabs, setTabs] = useState<TabData[]>(initialTabs);
  const uiViewState = useUIStore(s => s.viewStates.pg || {});
  const setViewState = useUIStore(s => s.setViewState);
  const [activeTab, setActiveTab] = useState(uiViewState.activeTab ?? 0);
  const [sidebarOpen, setSidebarOpen] = useState(uiViewState.sidebarOpen ?? true);
  const [taskModal, setTaskModal] = useState<any>(null);
  const [renameModal, setRenameModal] = useState<{ tabIndex: number; name: string } | null>(null);
  const [pendingCell, setPendingCell] = useState<{ row: number; col: number } | null>(null);
  const [fromCellText, setFromCellText] = useState('');

  useEffect(() => {
    setTabs(initialTabs);
  }, [initialTabs]);

  useEffect(() => {
    setViewState('pg', { activeTab, sidebarOpen });
  }, [activeTab, sidebarOpen, setViewState]);

  const tab = tabs[activeTab] || tabs[0];

  const addTab = useCallback(() => {
    const updated = [...tabs, { id: uid(), name: `Sheet ${tabs.length + 1}`, data: {} }];
    setActiveTab(updated.length - 1);
    setTabs(updated);
    persist(updated);
  }, [tabs, persist]);

  const deleteTab = useCallback((i: number) => {
    if (tabs.length === 1) { alert('Cannot delete the last sheet.'); return; }
    if (!confirm('Delete this sheet?')) return;
    const updated = tabs.filter((_, idx) => idx !== i);
    setActiveTab((prev: number) => Math.min(prev, updated.length - 1));
    setTabs(updated);
    persist(updated);
  }, [tabs, persist]);

  const renameTab = useCallback((i: number) => {
    setRenameModal({ tabIndex: i, name: tabs[i].name });
  }, [tabs]);

  const saveRename = useCallback((i: number, name: string) => {
    const updated = tabs.map((t, idx) => idx === i ? { ...t, name } : t);
    setTabs(updated);
    persist(updated);
    setRenameModal(null);
  }, [tabs, persist]);

  const clearTab = useCallback((i: number) => {
    if (!confirm('Clear all content in this sheet?')) return;
    const updated = tabs.map((t, idx) => idx === i ? { ...t, data: {} } : t);
    setTabs(updated);
    persist(updated);
  }, [tabs, persist]);

  const updateCellText = useCallback((row: number, col: number, text: string) => {
    const key = `${row},${col}`;
    const updated: TabData[] = tabs.map((t, i) => {
      if (i !== activeTab) return t;
      const existing = t.data[key] || { text: '', taskId: undefined };
      return { ...t, data: { ...t.data, [key]: { ...existing, text } } };
    });
    setTabs(updated);
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
    setTabs(updated);
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
    setTabs(updated);
    persist(updated);
  }, [tabs, activeTab, persist]);

  const quickCreateTask = useCallback(async (row: number, col: number, name: string) => {
    const firstMood = S.moods[0]?.id || '';
    const saved = await upsertTask({
      name: name.trim(), date: today(), mood: firstMood, status: getDefaultStatus(S.task_statuses),
      ...(memberId ? { assignedTo: [memberId] } : {}),
      subtasks: [], links: [],
    });
    const key = `${row},${col}`;
    const updated: TabData[] = tabs.map((t, i) => {
      if (i !== activeTab) return t;
      const existing = t.data[key] || { text: '', taskId: undefined };
      return { ...t, data: { ...t.data, [key]: { ...existing, taskId: saved.id } } };
    });
    setTabs(updated);
    await persist(updated);
    return saved;
  }, [S.moods, tabs, activeTab, memberId, upsertTask, persist]);

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
