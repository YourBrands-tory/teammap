import { useCallback } from 'react';
import { today, STC, STB, taskTimeStr } from '../lib/constants';
import { useStore } from '../store/useStore';
import useTasksMilestones from '../hooks/useTasksMilestones';
import TaskGenerator from '../components/tasks/TaskGenerator';
import Milestones from '../components/tasks/Milestones';
import DeletedTasks from '../components/tasks/DeletedTasks';
import TaskModal from '../components/TaskModal';
import Modal from '../components/Modal';

export default function TasksMilestones() {
  const S = useStore(s => s.S);
  const upsertMilestone = useStore(s => s.upsertMilestone);
  const upsertTask = useStore(s => s.upsertTask);
  const upsertClient = useStore(s => s.upsertClient);
  const delMilestoneStore = useStore(s => s.delMilestone);
  const purgeTaskStore = useStore(s => s.purgeTask);

  const {
    ctab, dashDate, taskModal, msModal, sortedClients, tasksOnDate, deletedTasks, milestones,
    setCtab, setDashDate, shiftGenDate,
    openTaskForClient, openTaskForMS, openTaskDetail, delTask,
    openAddMS, openEditMS,
    recoverTask, purgeTask,
    setDragCid, reorderC, setTaskModal, setMsModal,
  } = useTasksMilestones();

  const handleSaveMS = useCallback(async () => {
    if (!msModal || !msModal.name.trim()) return;
    if (msModal._id) {
      await upsertMilestone({
        id: msModal._id,
        name: msModal.name.trim(),
        description: msModal.description || '',
        assignedTo: msModal.assignedTo || [],
      });
    } else {
      await upsertMilestone({
        name: msModal.name.trim(),
        description: msModal.description || '',
        assignedTo: msModal.assignedTo || [],
      });
    }
    setMsModal(null);
  }, [msModal, upsertMilestone, setMsModal]);

  const handleDelMS = useCallback(async (id: string) => {
    if (!confirm('Delete this milestone? Linked tasks will remain.')) return;
    const lt = S.tasks.filter((t: any) => t.milestoneId === id && !t.deleted);
    for (const t of lt) {
      await upsertTask({ ...t, milestoneId: null });
    }
    await delMilestoneStore(id);
  }, [S.tasks, upsertTask, delMilestoneStore]);

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

  const lt = msModal?._mode === 'edit' && msModal._id
    ? S.tasks.filter((t: any) => t.milestoneId === msModal._id && !t.deleted)
    : [];
  const totalMins = lt.reduce((a: number, t: any) => a + ((t.estH || 0) * 60 + (t.estM || 0)), 0);
  const timeDisp = totalMins ? `${Math.floor(totalMins / 60)}h${totalMins % 60 ? ' ' + totalMins % 60 + 'm' : ''}` : null;

  const tabs: { key: 'tg' | 'ms' | 'trash'; label: string }[] = [
    { key: 'tg', label: 'Task Generator' },
    { key: 'ms', label: 'Milestones' },
    { key: 'trash', label: 'Deleted Tasks' },
  ];

  return (
    <div className="view active" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {tabs.map(t => (
        <div key={t.key} style={{
          display: 'inline-block', padding: '7px 18px', fontSize: 12, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '.5px', cursor: 'pointer',
          borderBottom: ctab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
          color: ctab === t.key ? 'var(--accent)' : 'var(--t3)',
          transition: '.15s', background: ctab === t.key ? 'var(--al)' : 'transparent',
        }} onClick={() => setCtab(t.key)}>
          {t.label}
        </div>
      ))}

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
          />
        )}
        {ctab === 'ms' && (
          <Milestones
            milestones={milestones}
            onAdd={openAddMS}
            onEdit={openEditMS}
            onAddTask={openTaskForMS}
            onDelete={handleDelMS}
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

      {taskModal && (
        <TaskModal
          task={taskModal}
          onClose={() => setTaskModal(null)}
        />
      )}

      {msModal && (
        <Modal onClose={() => setMsModal(null)} large={msModal._mode === 'edit'}>
          <h2>{msModal._mode === 'edit' ? 'Edit Milestone' : 'New Milestone'}</h2>

          {msModal._mode === 'edit' && msModal._id ? (
            <>
              <label className="fl" style={{ marginTop: 0 }}>Linked tasks ({lt.length}){timeDisp ? ' · ' + timeDisp + ' total' : ''}</label>
              <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 6 }}>
                {lt.length ? lt.map((t: any, i: number) => (
                  <div key={t.id} className="lrow">
                    <div className="lord">{i + 1}</div>
                    <span style={{ flex: 1, fontSize: 12 }}>{t.name}</span>
                    {taskTimeStr(t) ? <span style={{ fontSize: 10, color: 'var(--t3)' }}>{taskTimeStr(t)}</span> : null}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: STB[t.status], color: STC[t.status] }}>{t.status}</span>
                  </div>
                )) : <div style={{ fontSize: 12, color: 'var(--t3)' }}>No tasks linked</div>}
              </div>
            </>
          ) : null}

          <label className="fl">Name *</label>
          <input type="text" placeholder="e.g. Q3 Campaign Launch"
            value={msModal.name} onChange={e => setMsModal({ ...msModal, name: e.target.value })} autoFocus />

          <label className="fl">Description</label>
          <textarea placeholder="What does this milestone represent?"
            value={msModal.description || ''} onChange={e => setMsModal({ ...msModal, description: e.target.value })} />

          <label className="fl">Assign to</label>
          <div className="ttag-row">
            {S.members.map((m: any) => {
              const on = (msModal.assignedTo || []).includes(m.id);
              return (
                <div key={m.id} className={`ttagopt${on ? ' on' : ''}`}
                  onClick={() => {
                    const next = on
                      ? (msModal.assignedTo || []).filter((x: string) => x !== m.id)
                      : [...(msModal.assignedTo || []), m.id];
                    setMsModal({ ...msModal, assignedTo: next });
                  }}>
                  {m.name}
                </div>
              );
            })}
          </div>

          <div className="ma">
            <button className="btn btn-g" onClick={() => setMsModal(null)}>Cancel</button>
            <button className="btn btn-p" onClick={handleSaveMS}>
              {msModal._mode === 'edit' ? 'Save' : 'Create'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
