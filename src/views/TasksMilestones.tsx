import { useCallback, useState } from 'react';
import { today, fmtD } from '../lib/constants';
import { useStore } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import useTasksMilestones from '../hooks/useTasksMilestones';
import TaskGenerator from '../components/tasks/TaskGenerator';
import DeletedTasks from '../components/tasks/DeletedTasks';
import TaskModal from '../components/TaskModal';

export default function TasksMilestones() {
  const S = useStore(s => s.S);
  const upsertClient = useStore(s => s.upsertClient);
  const purgeTaskStore = useStore(s => s.purgeTask);

  const {
    ctab, dashDate, taskModal, sortedClients, tasksOnDate, deletedTasks,
    setCtab, setDashDate, shiftGenDate,
    openTaskForClient, openTaskDetail, delTask,
    recoverTask, purgeTask,
    setDragCid, reorderC, setTaskModal,
  } = useTasksMilestones();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const handlePurgeAll = useCallback(async () => {
    if (!confirm('Permanently delete all trashed tasks?')) return;
    const delTasks = S.tasks.filter((t: any) => t.deleted);
    for (const t of delTasks) {
      await purgeTaskStore(t.id);
    }
  }, [S.tasks, purgeTaskStore]);

  const handleAddClient = useCallback(() => {
    const name = prompt('Client name:');
    if (name && name.trim()) {
      upsertClient({ name: name.trim() });
    }
  }, [upsertClient]);

  const handleMobileSelectClient = useCallback((cid: string) => {
    setSelectedClientId(cid);
  }, []);

  const handleMobileBack = useCallback(() => {
    setSelectedClientId(null);
  }, []);

  const handleFabAddTask = useCallback(() => {
    if (selectedClientId) {
      openTaskForClient(selectedClientId);
    }
  }, [selectedClientId, openTaskForClient]);

  const tabs: { key: 'tg' | 'trash'; label: string }[] = [
    { key: 'tg', label: 'Task Generator' },
    { key: 'trash', label: 'Deleted Tasks' },
  ];

  return (
    <div className="view active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Desktop tabs */}
      <div className="tm-desk-tabs">
        {tabs.map(t => (
          <div key={t.key} style={{
            display: 'inline-block', padding: '7px 18px', fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.5px', cursor: 'pointer',
            borderBottom: ctab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: ctab === t.key ? 'var(--accent)' : 'var(--t3)',
            transition: '.15s', background: ctab === t.key ? 'var(--al)' : 'transparent',
          }} onClick={() => { setCtab(t.key); setSelectedClientId(null); }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Mobile tab bar */}
      <div className="tm-mob-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tm-mob-tab${ctab === t.key ? ' active' : ''}`}
            onClick={() => { setCtab(t.key); setSelectedClientId(null); }}>
            {t.label}
          </button>
        ))}
      </div>

      <div id="tcontent" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {ctab === 'tg' && (
          <TaskGenerator
            dashDate={dashDate}
            tasksOnDate={tasksOnDate}
            sortedClients={sortedClients}
            dragCid={null}
            onShift={shiftGenDate}
            onSetDate={setDashDate}
            onToday={() => setDashDate(today())}
            onOpenTaskForClient={openTaskForClient}
            onOpenTaskDetail={openTaskDetail}
            onDelTask={delTask}
            onDragStart={setDragCid}
            onDragEnd={() => setDragCid(null)}
            onDragOver={e => e.preventDefault()}
            onDrop={reorderC}
            onAddClient={handleAddClient}
            selectedClientId={selectedClientId}
            onSelectClient={handleMobileSelectClient}
            onBackToClients={handleMobileBack}
            onShowFilter={() => setShowFilterSheet(true)}
          />
        )}
        {ctab === 'trash' && (
          <DeletedTasks
            deletedTasks={deletedTasks}
            onRecover={recoverTask}
            onPurge={purgeTask}
            onPurgeAll={handlePurgeAll}
          />
        )}
      </div>

      {/* Mobile FAB */}
      {ctab === 'tg' && (
        <button className="tm-fab" onClick={handleFabAddTask}>+</button>
      )}

      {/* Mobile filter bottom sheet */}
      {showFilterSheet && (
        <div className="tm-sheet-overlay" onClick={() => setShowFilterSheet(false)}>
          <div className="tm-sheet" onClick={e => e.stopPropagation()}>
            <div className="tm-sheet-head">
              <span style={{ fontWeight: 700, fontSize: 15 }}>Filter by date</span>
              <button className="tm-sheet-close" onClick={() => setShowFilterSheet(false)}>✕</button>
            </div>
            <div className="tm-sheet-body">
              <div className="tm-sheet-section">
                <label className="tm-sheet-label">Date</label>
                <div className="tm-sheet-date-row">
                  <button className="btn btn-sm" style={{ padding: '3px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => shiftGenDate(-1)}>←</button>
                  <input type="date" value={dashDate} onChange={e => setDashDate(e.target.value)}
                    style={{ flex: 1, fontSize: 14, padding: '8px 10px' }} />
                  <button className="btn btn-sm" style={{ padding: '3px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => shiftGenDate(1)}>→</button>
                </div>
              </div>
              <div className="tm-sheet-section">
                <button className="btn btn-sm" onClick={() => { setDashDate(today()); setShowFilterSheet(false); }}
                  style={{ width: '100%', fontWeight: 700 }}>Today</button>
              </div>
              <div className="tm-sheet-section">
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>{fmtD(dashDate)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {taskModal && (
        <TaskModal
          task={taskModal}
          onClose={() => setTaskModal(null)}
          onSaveAsTemplate={(d: any) => { useUIStore.getState().triggerSaveAsTemplate(d); }}
        />
      )}
    </div>
  );
}
