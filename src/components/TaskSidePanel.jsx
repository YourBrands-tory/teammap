import { useMemo, memo } from 'react';
import { sel } from '../store/useStore';
import { today, taskTimeStr } from '../lib/constants';
import { getStatusMaps, getCompleteStatus } from '../utils/statusUtils';

const SIDE_PANEL_MOODS = ['top', 'rapid', 'secondhalf', 'followup'];

export default memo(function TaskSidePanel({ tasks, member, S, onOpenTask, hiddenTasks, onRestoreTask }) {
  const { STC, STB } = useMemo(() => getStatusMaps(S.task_statuses), [S.task_statuses]);
  const completeStatus = useMemo(() => getCompleteStatus(S.task_statuses), [S.task_statuses]);

  const moods = useMemo(() => {
    return SIDE_PANEL_MOODS.map(id => S.moods.find(m => m.id === id)).filter(Boolean);
  }, [S.moods]);

  const groups = useMemo(() => {
    const todayStr = today();
    const memberId = member?.id;
    return moods.map(mood => {
      const ids = (S.tasks || []).filter(t =>
        t.mood === mood.id &&
        t.date === todayStr &&
        t.assignedTo?.includes(memberId) &&
        t.status !== completeStatus &&
        !t.deleted
      );
      return { ...mood, ids };
    });
  }, [moods, S.tasks.length, S.tasks, member, completeStatus]);

  return (
    <div className="sp">
      <div className="sph" style={{ padding: '8px 10px' }}>
        <h4 style={{ fontSize: 11, fontWeight: 800, marginBottom: 2 }}>{member?.name || 'My Tasks'}</h4>
      </div>
      <div className="spb" style={{ padding: '6px 8px 10px' }}>
        {groups.map(g => (
          <div key={g.id} className="sp-mood-group">
            <div className="sp-mood-head">
              <span style={{ fontSize: 10 }}>{g.icon}</span>
              <span className="sp-mood-label" style={{ color: g.color }}>{g.label}</span>
              <span className="sp-mood-cnt" style={{ background: g.color + '22', color: g.color }}>{g.ids.length}</span>
            </div>
            {g.ids.length ? g.ids.map(t => {
              const client = sel.gc(S, t.clientId);
              const timeStr = taskTimeStr(t);
              return (
                <div key={t.id} className="sp-card" style={{ borderLeftColor: g.color, background: g.bg || '#fafafa' }}
                  onClick={() => onOpenTask(t)}>
                  <div className="sp-card-title">{t.name}</div>
                  {client && <div className="sp-card-client">{client.name}</div>}
                  <div className="sp-card-row">
                    <span className="sp-card-status" style={{ background: STB[t.status], color: STC[t.status] }}>
                      {t.status}
                    </span>
                    {timeStr && <span className="sp-card-time">{timeStr}</span>}
                  </div>
                </div>
              );
            }) : (
              <div style={{ fontSize: 9, color: 'var(--t3)', padding: '3px 2px 4px' }}>No tasks</div>
            )}
          </div>
        ))}
        {hiddenTasks?.length > 0 && (
          <div className="sp-hidden-line">{hiddenTasks.length} hidden task{hiddenTasks.length > 1 ? 's' : ''}</div>
        )}
      </div>
    </div>
  );
});
