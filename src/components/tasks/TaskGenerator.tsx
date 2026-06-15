import { useStore, sel } from '../../store/useStore';
import { fmtD, taskTimeStr, STC, STB } from '../../lib/constants';
import type { Task } from '../../utils/milestoneHelpers';

interface Props {
  dashDate: string;
  tasksOnDate: Task[];
  sortedClients: any[];
  dragCid: string | null;
  onShift: (days: number) => void;
  onSetDate: (d: string) => void;
  onToday: () => void;
  onOpenTaskForClient: (cid: string) => void;
  onOpenTaskDetail: (task: any) => void;
  onDelTask: (id: string) => void;
  onDragStart: (cid: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (cid: string) => void;
  onAddClient: () => void;
  selectedClientId: string | null;
  onSelectClient: (cid: string) => void;
  onBackToClients: () => void;
  onShowFilter?: () => void;
}

export default function TaskGenerator({
  dashDate, tasksOnDate, sortedClients, dragCid,
  onShift, onSetDate, onToday,
  onOpenTaskForClient, onOpenTaskDetail, onDelTask,
  onDragStart, onDragEnd, onDragOver, onDrop, onAddClient,
  selectedClientId, onSelectClient, onBackToClients, onShowFilter,
}: Props) {
  const S = useStore(s => s.S);

  const clientTasks = selectedClientId
    ? tasksOnDate.filter(t => t.clientId === selectedClientId)
    : [];
  const selClient = selectedClientId
    ? sortedClients.find(c => c.id === selectedClientId)
    : null;

  return (
    <>
      {/* Desktop layout */}
      <div className="tg-desk">
        <div className="tgen">
          <div className="tgl">
            <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>Clients / Projects</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>Drag to reorder</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {sortedClients.map(c => (
                <div key={c.id} className="ctr" id={`ctr-${c.id}`} draggable
                  onDragStart={() => onDragStart(c.id)}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(c.id)}>
                  <div style={{ padding: '8px 6px', color: 'var(--t3)', cursor: 'grab', fontSize: 16 }}>☰</div>
                  <div style={{ flex: 1, padding: '10px 8px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{c.industry}</div>
                  </div>
                  <div style={{ padding: '6px 10px' }}>
                    <button className="btn btn-xs btn-p" onClick={() => onOpenTaskForClient(c.id)}>+ Task</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 15px', borderTop: '1px solid var(--border)', background: 'var(--s2)' }}>
              <button className="btn btn-sm" onClick={onAddClient} style={{ width: '100%' }}>+ Add client</button>
            </div>
          </div>
          <div className="tgr">
            <div style={{
              padding: '11px 16px', borderBottom: '1px solid var(--border)',
              background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            }}>
              <span className="stl">Tasks for</span>
              <button className="btn btn-sm" style={{ padding: '3px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => onShift(-1)}>←</button>
              <input type="date" value={dashDate} onChange={e => onSetDate(e.target.value)} style={{ width: 145, fontSize: 12 }} />
              <button className="btn btn-sm" style={{ padding: '3px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => onShift(1)}>→</button>
              <button className="btn btn-xs" onClick={onToday} style={{ fontWeight: 700 }}>Today</button>
              <span style={{ fontSize: 12, color: 'var(--t2)' }}>{fmtD(dashDate)}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {!tasksOnDate.length ? (
                <div style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', padding: '40px 0' }}>
                  No tasks for {fmtD(dashDate)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tasksOnDate.map(t => {
                    const mood = sel.gmood(S, t.mood);
                    const client = sel.gc(S, t.clientId);
                    const assignees = t.assignedTo ? t.assignedTo.map(id => { const m = sel.gm(S, id); return m ? m.name : '' }).filter(Boolean) : [];
                    const timeStr = taskTimeStr(t);
                    if (!mood) return null;
                    return (
                      <div key={t.id} style={{
                        background: 'var(--surface)', border: `1px solid var(--border)`,
                        borderLeft: `3px solid ${mood.color}`, borderRadius: 'var(--r)',
                        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                        cursor: 'pointer', transition: '.15s',
                      }}
                        onClick={() => onOpenTaskDetail(t)}
                        onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--a2)')}
                        onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                        <span style={{ fontSize: 16 }}>{mood.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{t.isMilestone ? '🏁 ' : ''}{t.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                            {client ? client.name + ' · ' : ''}{assignees.join(', ') || 'Unassigned'}{timeStr ? ' · ' + timeStr : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10, background: STB[t.status], color: STC[t.status], whiteSpace: 'nowrap' }}>
                          {t.status}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 10, background: mood.bg, color: mood.color, whiteSpace: 'nowrap' }}>
                          {mood.label}
                        </span>
                        <button className="btn btn-xs btn-d" onClick={e => { e.stopPropagation(); onDelTask(t.id); }}>🗑</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="tg-mobile">
        {!selectedClientId ? (
          /* Client list (master) */
          <div className="tg-mob-clients">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>Clients / Projects</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{sortedClients.length} total</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {sortedClients.map(c => (
                <div key={c.id} className="tg-mob-client-row" onClick={() => onSelectClient(c.id)}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--t3)' }}>{c.industry || 'No industry'}</div>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--t3)' }}>›</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--s2)' }}>
              <button className="btn btn-sm" onClick={onAddClient} style={{ width: '100%' }}>+ Add client</button>
            </div>
          </div>
        ) : (
          /* Task list for selected client (detail) */
          <div className="tg-mob-tasks">
            <div className="tg-mob-task-header">
              <button className="tg-mob-back-btn" onClick={onBackToClients}>←</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{selClient?.name || 'Tasks'}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{fmtD(dashDate)} · {clientTasks.length} task{clientTasks.length !== 1 ? 's' : ''}</div>
              </div>
              <button className="tg-mob-filter-btn" onClick={onShowFilter}>⚙</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {!clientTasks.length ? (
                <div style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', padding: '40px 0' }}>
                  No tasks for this client on {fmtD(dashDate)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {clientTasks.map(t => {
                    const mood = sel.gmood(S, t.mood);
                    const assignees = t.assignedTo ? t.assignedTo.map(id => { const m = sel.gm(S, id); return m ? m.name : '' }).filter(Boolean) : [];
                    const timeStr = taskTimeStr(t);
                    if (!mood) return null;
                    return (
                      <div key={t.id} className="tg-mob-task-card" onClick={() => onOpenTaskDetail(t)}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{mood.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.isMilestone ? '🏁 ' : ''}{t.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
                              {assignees.join(', ') || 'Unassigned'}{timeStr ? ' · ' + timeStr : ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: STB[t.status], color: STC[t.status] }}>
                            {t.status}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: mood.bg, color: mood.color }}>
                            {mood.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
