import { useState, useMemo, useCallback } from 'react';
import { useStore, sel } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { today } from '../lib/constants';
import { getCompleteStatus, getPassStatus, getStatusMaps } from '../utils/statusUtils';
import Avatar from '../components/Avatar';
import TaskModal from '../components/TaskModal';

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

const DATE_FILTERS = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'done', label: 'Done' },
];

function filterByDate(tasks, dateFilter) {
  if (dateFilter === 'all') return tasks;
  const range = dateFilter === 'week' ? getWeekRange() : getMonthRange();
  return tasks.filter(t => t.date >= range.start && t.date <= range.end);
}

function filterByStatus(tasks, statusFilter, completeStatus, passStatus) {
  if (statusFilter === 'all') return tasks;
  if (statusFilter === 'pending') return tasks.filter(t => t.status !== completeStatus && t.status !== passStatus);
  return tasks.filter(t => t.status === completeStatus || t.status === passStatus);
}

export default function DelegatedView() {
  const S = useStore(s => s.S);
  const session = useStore(s => s.session);
  const memberId = session?.memberId;
  const role = session?.role;
  const isAdmin = role === 'admin';
  const completeStatus = getCompleteStatus(S.task_statuses);
  const passStatus = getPassStatus(S.task_statuses);
  const { STC, STB } = getStatusMaps(S.task_statuses);

  const [dateFilter, setDateFilter] = useState('week');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);

  const openTask = useCallback((t) => setModal(t), []);
  const closeModal = useCallback(() => setModal(null), []);

  // ── Left column: tasks assigned by me to others ──
  const delegatedByMe = useMemo(() => {
    if (!memberId) return {};
    let tasks = S.tasks.filter(t =>
      !t.deleted &&
      !t.hidden &&
      t.createdBy === memberId &&
      t.assignedTo.length > 0 &&
      !t.assignedTo.includes(memberId)
    );
    tasks = filterByDate(tasks, dateFilter);
    tasks = filterByStatus(tasks, statusFilter, completeStatus, passStatus);
    const groups = {};
    tasks.forEach(t => {
      const rid = t.assignedTo[0];
      if (!groups[rid]) groups[rid] = [];
      groups[rid].push(t);
    });
    return groups;
  }, [S.tasks, memberId, dateFilter, statusFilter, completeStatus, passStatus]);

  // ── Right column: tasks assigned by team (admin only) ──
  const delegatedByTeam = useMemo(() => {
    if (!memberId || !isAdmin) return [];
    let tasks = S.tasks.filter(t =>
      !t.deleted &&
      !t.hidden &&
      t.createdBy &&
      t.createdBy !== memberId &&
      t.assignedTo.length > 0 &&
      !t.assignedTo.includes(t.createdBy)
    );
    tasks = filterByDate(tasks, dateFilter);
    tasks = filterByStatus(tasks, statusFilter, completeStatus, passStatus);
    return tasks;
  }, [S.tasks, memberId, isAdmin, dateFilter, statusFilter, completeStatus, passStatus]);

  const delegatedTotal = Object.values(delegatedByMe).reduce((a, arr) => a + arr.length, 0);
  const delegatedDone = Object.values(delegatedByMe).reduce((a, arr) => a + arr.filter(t => t.status === completeStatus || t.status === passStatus).length, 0);

  const teamTotal = delegatedByTeam.length;
  const teamDone = delegatedByTeam.filter(t => t.status === completeStatus || t.status === passStatus).length;

  return (
    <div className="view active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Header ── */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span className="stl">Delegated Tasks</span>

        {/* Date filter pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {DATE_FILTERS.map(f => (
            <button key={f.id}
              onClick={() => setDateFilter(f.id)}
              style={{
                padding: '4px 12px', borderRadius: 16, border: '1px solid var(--border)',
                background: dateFilter === f.id ? 'var(--accent)' : 'var(--s2)',
                color: dateFilter === f.id ? '#fff' : 'var(--t2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                padding: '4px 12px', borderRadius: 16, border: '1px solid var(--border)',
                background: statusFilter === f.id ? 'var(--a2)' : 'var(--s2)',
                color: statusFilter === f.id ? '#fff' : 'var(--t2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div style={{
        flex: 1, overflow: 'hidden', display: 'flex',
        flexWrap: 'wrap', gap: 0,
      }}>
        {/* ── LEFT COLUMN: Assigned by me ── */}
        <div style={{
          flex: '1 1 50%', minWidth: 320, overflow: 'auto',
          borderRight: isAdmin ? '1px solid var(--border)' : 'none',
          padding: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--t1)' }}>
            Assigned by me
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--t3)', marginLeft: 8 }}>
              {delegatedTotal} tasks · {delegatedDone} done
            </span>
          </div>

          {Object.keys(delegatedByMe).length === 0 ? (
            <EmptyState icon="📤" message="No delegated tasks matching filters" />
          ) : (
            Object.entries(delegatedByMe).map(([recipientId, tasks]) => {
              const recipient = sel.gm(S, recipientId);
              if (!recipient) return null;
              const doneCount = tasks.filter(t => t.status === completeStatus || t.status === passStatus).length;
              return (
                <div key={recipientId} style={{ marginBottom: 16 }}>
                  {/* Recipient header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                    padding: '6px 8px', background: 'var(--s2)', borderRadius: 6,
                  }}>
                    <Avatar name={recipient.name} color={recipient.color} size={24} />
                    <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{recipient.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                      {tasks.length} tasks
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                      {doneCount}✓
                    </span>
                  </div>
                  {/* Task rows */}
                  {tasks.map(t => (
                    <DelegatedTaskRow
                      key={t.id} task={t} S={S}
                      STC={STC} STB={STB}
                      onClick={() => openTask(t)}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* ── RIGHT COLUMN: Assigned by team (admin only) ── */}
        {isAdmin && (
          <div style={{ flex: '1 1 50%', minWidth: 320, overflow: 'auto', padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--t1)' }}>
              Assigned by team
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--t3)', marginLeft: 8 }}>
                {teamTotal} tasks · {teamDone} done
              </span>
            </div>

            {delegatedByTeam.length === 0 ? (
              <EmptyState icon="👥" message="No team-assigned tasks matching filters" />
            ) : (
              delegatedByTeam.map(t => {
                const creator = sel.gm(S, t.createdBy);
                const assignee = sel.gm(S, t.assignedTo[0]);
                return (
                  <div key={t.id}
                    onClick={() => openTask(t)}
                    style={{
                      padding: '8px 10px', borderBottom: '1px solid var(--border)',
                      cursor: 'pointer', transition: 'background .15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--s2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <MoodIcon task={t} S={S} />
                      <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: 'var(--t1)' }}>
                        {t.name}
                      </span>
                      <span className="tcs" style={{ background: STB[t.status], color: STC[t.status], fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {t.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--t3)' }}>
                      <span>From</span>
                      <Avatar name={creator?.name || '?'} color={creator?.color || 'var(--t3)'} size={18} />
                      <span style={{ fontWeight: 600 }}>{creator?.name || 'Unknown'}</span>
                      <span>→ to</span>
                      <Avatar name={assignee?.name || '?'} color={assignee?.color || 'var(--t3)'} size={18} />
                      <span style={{ fontWeight: 600 }}>{assignee?.name || 'Unknown'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {modal && <TaskModal task={modal} onClose={closeModal} onSaveAsTemplate={(d) => { useUIStore.getState().triggerSaveAsTemplate(d); }} />}
    </div>
  );
}

function DelegatedTaskRow({ task, S, STC, STB, onClick }) {
  const mood = sel.gmood(S, task.mood);
  const client = sel.gc(S, task.clientId);
  return (
    <div onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
        borderBottom: '1px solid var(--border)', cursor: 'pointer',
        transition: 'background .15s', fontSize: 12,
      }}
      onMouseOver={e => e.currentTarget.style.background = 'var(--s2)'}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{mood?.icon || '📋'}</span>
      <span style={{ flex: 1, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.name}
      </span>
      {client && (
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 4,
          background: (mood?.color || 'var(--t3)') + '22',
          color: mood?.color || 'var(--t3)', fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          {client.name}
        </span>
      )}
      <span style={{ fontSize: 10, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{task.date}</span>
      <span className="tcs" style={{
        background: STB[task.status], color: STC[task.status],
        fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, whiteSpace: 'nowrap',
      }}>
        {task.status}
      </span>
    </div>
  );
}

function MoodIcon({ task, S }) {
  const mood = sel.gmood(S, task.mood);
  return <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{mood?.icon || '📋'}</span>;
}

function EmptyState({ icon, message }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 40, gap: 8, color: 'var(--t3)',
    }}>
      <div style={{ fontSize: 32, opacity: 0.5 }}>{icon}</div>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)', textAlign: 'center' }}>{message}</p>
    </div>
  );
}
