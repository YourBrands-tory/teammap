import { useState, useMemo, memo } from 'react';
import { sel } from '../store/useStore';
import { fmtD, taskTimeStr } from '../lib/constants';

export default memo(function TaskSidePanel({ memberId, date, S, onOpenTask, hiddenTasks, onRestoreTask }) {
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const member = S.members.find(m => m.id === memberId);
  const tasks = useMemo(() => {
    if (!memberId) return [];
    return sel.tasksForMD(S, memberId, date);
  }, [S, memberId, date]);

  const visibleMoods = S.moods.filter(m => !m.hidden);

  const groups = useMemo(() => {
    return visibleMoods.map(mood => {
      const ids = tasks.filter(t => t.mood === mood.id && !t.hidden);
      return { ...mood, ids };
    }).filter(g => g.ids.length);
  }, [visibleMoods, tasks]);

  const groupedHidden = useMemo(() => {
    if (!hiddenTasks?.length) return [];
    return visibleMoods.map(mood => {
      const ids = hiddenTasks.filter(t => t.mood === mood.id);
      return { ...mood, ids };
    }).filter(g => g.ids.length);
  }, [visibleMoods, hiddenTasks]);

  return (
    <div className="sp" style={{ width: 320, minWidth: 320, maxWidth: 360 }}>
      <div className="sph">
        <h4>{member?.name || 'My Tasks'}</h4>
        <div style={{ fontSize: 10, color: 'var(--t3)' }}>{fmtD(date)}</div>
      </div>
      <div className="spb">
        {!groups.length && !groupedHidden.length ? (
          <div style={{ fontSize: 12, color: 'var(--t3)', padding: '8px 0' }}>No tasks for this date.</div>
        ) : (
          <>
            {groups.map(g => (
              <div key={g.id} className="spsec">
                <div className="spst" style={{ color: g.color }}>{g.icon} {g.label}</div>
                {g.ids.map(t => {
                  const c = sel.gc(S, t.clientId);
                  return (
                    <div key={t.id} className="spt" onClick={() => onOpenTask(t)}>
                      <div className="sptn">{t.name}</div>
                      <div className="sptm">
                        {c ? c.name : ''}
                        {c ? ' · ' : ''}{t.status}{taskTimeStr(t) ? ' · ' + taskTimeStr(t) : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {groupedHidden.length > 0 && (
              <div className="spsec" style={{ marginTop: 16 }}>
                <div className="spst" style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setHiddenOpen(o => !o)}>
                  {hiddenOpen ? '▼' : '▶'} Hidden ({hiddenTasks.length})
                </div>
                {hiddenOpen && groupedHidden.map(g => (
                  <div key={g.id} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: g.color, marginBottom: 4, paddingLeft: 4 }}>
                      {g.icon} {g.label} ({g.ids.length})
                    </div>
                    {g.ids.map(t => (
                      <div key={t.id} className="spt" style={{ opacity: 0.7, display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => onOpenTask(t)}>
                        <div className="sptn" style={{ flex: 1, fontSize: 11 }}>{t.name}</div>
                        {onRestoreTask && (
                          <button className="lu-restore-btn" style={{ width: 18, height: 18, fontSize: 10 }}
                            onClick={e => { e.stopPropagation(); onRestoreTask(t.id); }}
                            title="Restore">&#8630;</button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
