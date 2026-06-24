import { useState, useMemo, useCallback } from 'react';
import { useStore, sel } from '../store/useStore';
import { useUIStore } from '../store/useUIStore';
import { today, fmtD, taskTimeStr } from '../lib/constants';
import { getStatusMaps, getCompleteStatus, getReviewStatus, getPassStatus } from '../utils/statusUtils';
import { canCreateTask, getDailyActiveCount, getDailyLimit } from '../utils/taskLimits';
import TaskModal from '../components/TaskModal';
import TaskSidePanel from '../components/TaskSidePanel';
import CircProg from '../components/CircProg';

export default function MemberTasks() {
  const S = useStore(s => s.S);
  const session = useStore(s => s.session);
  const memberId = session?.memberId;
  const completeStatus = getCompleteStatus(S.task_statuses);
  const passStatus = getPassStatus(S.task_statuses);
  const reviewStatus = getReviewStatus(S.task_statuses);
  const [dashDate, setDashDate] = useState(today());
  const [modal, setModal] = useState(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const openTask = useCallback((t) => setModal(t), []);
  const closeModal = useCallback(() => setModal(null), []);

  const shift = (days) => {
    const d = new Date(dashDate + 'T12:00:00'); d.setDate(d.getDate() + days);
    setDashDate(d.toISOString().slice(0, 10));
  };

  const myTasks = useMemo(() => {
    if (!memberId) return [];
    return sel.tasksForMD(S, memberId, dashDate);
  }, [S, memberId, dashDate]);

  const visibleTasks = useMemo(() => myTasks.filter(t => t.status !== completeStatus && !t.hidden), [myTasks, completeStatus]);
  const hiddenTasks = useMemo(() => myTasks.filter(t => t.hidden), [myTasks]);
  const doneTasks = useMemo(() => myTasks.filter(t => t.status === completeStatus), [myTasks, completeStatus]);
  const total = myTasks.length;
  const doneCount = doneTasks.length;
  const dayPct = total ? Math.round(doneCount / total * 100) : 0;

  const moodSections = useMemo(() => {
    const primaryIds = ['hero', 'imp', 'top'];
    const moods = S.moods.filter(m => m.visible);
    const primaryMoods = moods.filter(m => primaryIds.includes(m.id));
    const overflowMoods = moods.filter(m => !primaryIds.includes(m.id));
    const sections = [];

    const suTasks = visibleTasks.filter(t => {
      const suStatus = getReviewStatus(S.task_statuses);
      return false;
    });

    primaryMoods.forEach(mood => {
      const tasks = visibleTasks.filter(t => t.mood === mood.id);
      if (tasks.length > 0 || mood.id === 'hero') {
        sections.push({ mood, tasks });
      }
    });

    const overflowTasks = visibleTasks.filter(t => overflowMoods.some(m => m.id === t.mood));
    if (overflowTasks.length > 0) {
      const overflowMood = moods.find(m => m.id === overflowMoods[0]?.id);
      sections.push({ mood: { id: 'overflow', icon: '📦', label: 'More', color: 'var(--t2)', bg: 'var(--s2)' }, tasks: overflowTasks });
    }

    return sections;
  }, [visibleTasks, S.moods, S.task_statuses]);

  const setStatus = useCallback(async (taskId, status) => {
    const task = S.tasks.find(t => t.id === taskId);
    if (task && status !== completeStatus) {
      const { upsertTask } = useStore.getState();
      await upsertTask({ ...task, status });
    }
  }, [S.tasks, completeStatus]);

  const hideTask = useCallback(async (taskId) => {
    const task = S.tasks.find(t => t.id === taskId);
    if (task) {
      try {
        const { upsertTask } = useStore.getState();
        await upsertTask({ ...task, hidden: true });
      } catch {
        useUIStore.getState().setToast('Failed to hide task.');
      }
    }
  }, [S.tasks]);

  return (
    <div className="view active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── HEADER ── */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span className="stl" style={{ whiteSpace: 'nowrap' }}>My Tasks</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => shift(-1)}>←</button>
          <input type="date" value={dashDate} onChange={e => setDashDate(e.target.value)} style={{ width: 140, fontSize: 12 }} />
          <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: 15, fontWeight: 700 }} onClick={() => shift(1)}>→</button>
        </div>
        <button className="btn btn-sm" style={{ fontWeight: 700 }} onClick={() => setDashDate(today())}>Today</button>
        <span style={{ fontSize: 12, color: 'var(--t2)' }}>{fmtD(dashDate)}</span>
        <div style={{ flex: 1, minWidth: 60, maxWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>
            <span>Day progress</span>
            <span style={{ fontWeight: 700, color: dayPct === 100 ? 'var(--accent)' : 'var(--t2)' }}>{doneCount}/{total} · {dayPct}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3, width: `${dayPct}%`, transition: '.4s',
              background: dayPct === 100 ? 'var(--accent)' : dayPct > 60 ? 'var(--a2)' : 'var(--info)',
            }} />
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <div className="task-dash-main" style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {!visibleTasks.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8, color: 'var(--t3)' }}>
              <div style={{ fontSize: 36 }}>📋</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>No tasks for this date</p>
            </div>
          ) : (
            <div className="tcols" style={{ minWidth: 360 }}>
              <MemberTaskCol memberId={memberId} date={dashDate} S={S}
                tasks={visibleTasks} completeStatus={completeStatus}
                onOpenTask={openTask} onStatus={setStatus} onHide={hideTask} />
            </div>
          )}
        </div>

        <TaskSidePanel
          memberId={memberId} date={dashDate} S={S} onOpenTask={openTask} />
      </div>

      <div className="lu-mobile-hidden">
        <button className="lu-mobile-hidden-toggle" onClick={() => setMobilePanelOpen(o => !o)}>
          👁 Tasks ({hiddenTasks.length} hidden)
        </button>

        {mobilePanelOpen && (
          <div className="lu-mobile-drawer" onClick={() => setMobilePanelOpen(false)}>
            <div className="lu-mobile-drawer-content" onClick={e => e.stopPropagation()}>
              <div className="lu-mobile-drawer-head">
                <span>{S.members.find(m => m.id === memberId)?.name || 'My Tasks'}</span>
                <button className="btn btn-sm" onClick={() => setMobilePanelOpen(false)}>Close</button>
              </div>
              <TaskSidePanel
                memberId={memberId} date={dashDate} S={S} onOpenTask={(t) => { openTask(t); setMobilePanelOpen(false); }} />
            </div>
          </div>
        )}
      </div>

      {modal && <TaskModal task={modal} onClose={closeModal} readonlyAssignee={true} onSaveAsTemplate={(d) => { useUIStore.getState().triggerSaveAsTemplate(d); }} />}
    </div>
  );
}

function MemberTaskCol({ memberId, date, S, tasks, completeStatus, onOpenTask, onStatus, onHide }) {
  const dailyActive = getDailyActiveCount(S, memberId, date);
  const dailyCap = getDailyLimit(S, memberId);
  const member = S.members.find(m => m.id === memberId);
  const capColor = dailyActive > dailyCap ? '#e76f51' : dailyActive === dailyCap ? '#d97706' : 'var(--t2)';
  const limitReached = dailyActive >= dailyCap;

  const primaryIds = ['hero', 'imp', 'top'];
  const moods = S.moods.filter(m => m.visible);
  const primaryMoods = moods.filter(m => primaryIds.includes(m.id));
  const overflowMoods = moods.filter(m => !primaryIds.includes(m.id));

  const moodMins = (moodId) => tasks.filter(t => t.mood === moodId).reduce((a, t) => a + ((t.estH || 0) * 60 + (t.estM || 0)), 0);
  const hm = (m) => m ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + m % 60 + 'm' : ''}` : null;

  const handleAddTask = useCallback((moodId) => {
    if (limitReached) {
      useUIStore.getState().setToast(`Task limit reached. You already have ${dailyActive}/${dailyCap} active tasks. Complete or pass an existing task before creating another.`);
      return;
    }
    onOpenTask({ date, mood: moodId || '', assignedTo: [memberId] });
  }, [limitReached, dailyActive, dailyCap, memberId, date, onOpenTask]);

  const plusBtn = (moodId, moodColor) => (
    <button disabled={limitReached}
      onClick={(e) => { e.stopPropagation(); handleAddTask(moodId); }}
      title={limitReached ? `Daily task limit reached (${dailyActive}/${dailyCap})` : ''}
      style={{
        width: 16, height: 16, borderRadius: '50%', background: moodColor + '22',
        border: `1px solid ${moodColor}44`, color: moodColor, fontSize: 11, lineHeight: 1,
        cursor: limitReached ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, padding: 0, fontFamily: 'inherit',
        marginLeft: 'auto', opacity: limitReached ? 0.5 : 1,
      }}>+</button>
  );

  const addTaskBtn = (moodId) => (
    <button className="addbtn" disabled={limitReached}
      title={limitReached ? `Daily task limit reached (${dailyActive}/${dailyCap})` : ''}
      style={{ fontSize: 11, flexShrink: 0, opacity: limitReached ? 0.5 : 1, cursor: limitReached ? 'not-allowed' : 'pointer' }}
      onClick={() => handleAddTask(moodId)}>+ Task</button>
  );

  return (
    <div className="tcol">
      <div className="tcolh" style={{ borderTop: `3px solid ${member?.color || 'var(--accent)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 800, flex: 1 }}>{member?.name || 'My Tasks'}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: capColor }}>{dailyActive}/{dailyCap}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
          <span style={{ color: 'var(--t3)' }}>{tasks.length} active</span>
        </div>
      </div>
      <div className="tcolb">
        {primaryMoods.map(mood => {
          const mt = tasks.filter(t => t.mood === mood.id);
          const isHero = mood.id === 'hero', isImp = mood.id === 'imp';
          const secClass = isHero ? 'hero-sec' : isImp ? 'imp-sec' : 'other-sec';
          const secStyle = isHero ? { background: mood.bg, border: `2px solid ${mood.color}55` }
            : isImp ? { background: mood.bg + '88', border: `1.5px solid ${mood.color}44` } : {};

          return (
            <div key={mood.id} className={`msec ${secClass}`} style={secStyle}>
              <div className="msec-head" style={{ background: isHero ? mood.color + '15' : isImp ? mood.color + '10' : 'transparent' }}>
                <span style={{ fontSize: isHero ? 13 : isImp ? 12 : 11 }}>{mood.icon}</span>
                <span className="msec-label" style={{ color: mood.color, fontSize: isHero ? 11 : isImp ? 10.5 : 10 }}>{mood.label}</span>
                <span className="msec-cnt" style={{ background: mood.color + '22', color: mood.color }}>
                  {mt.length}
                </span>
                {hm(moodMins(mood.id)) && <span style={{ fontSize: 9, color: mood.color, marginLeft: hm(moodMins(mood.id)) ? 2 : 'auto', fontWeight: 700, opacity: 0.7 }}>{hm(moodMins(mood.id))}</span>}
                {plusBtn(mood.id, mood.color)}
              </div>
              <div className="msec-tasks">
                {mt.length ? mt.map(t => <MTaskCard key={t.id} task={t} S={S} onOpenTask={onOpenTask} onStatus={onStatus} onHide={onHide} />)
                  : <div style={{ fontSize: 10, color: 'var(--t3)', padding: '5px 4px', fontStyle: 'italic' }}>No active {mood.label}</div>}
              </div>
              {addTaskBtn(mood.id)}
            </div>
          );
        })}

        {overflowMoods.map(mood => {
          const mt = tasks.filter(t => t.mood === mood.id);
          if (!mt.length) return null;
          return (
            <div key={mood.id} className="msec" style={{ marginTop: 4 }}>
              <div className="msec-head" style={{ background: 'transparent' }}>
                <span style={{ fontSize: 10 }}>{mood.icon}</span>
                <span className="msec-label" style={{ color: mood.color, fontSize: 9.5 }}>{mood.label}</span>
                <span className="msec-cnt" style={{ background: mood.color + '22', color: mood.color }}>
                  {mt.length}
                </span>
                {hm(moodMins(mood.id)) && <span style={{ fontSize: 9, color: mood.color, marginLeft: hm(moodMins(mood.id)) ? 2 : 'auto', fontWeight: 700, opacity: 0.7 }}>{hm(moodMins(mood.id))}</span>}
                {plusBtn(mood.id, mood.color)}
              </div>
              <div className="msec-tasks">
                {mt.map(t => <MTaskCard key={t.id} task={t} S={S} onOpenTask={onOpenTask} onStatus={onStatus} onHide={onHide} />)}
              </div>
              {addTaskBtn(mood.id)}
            </div>
          );
        })}

        <button className="addbtn" disabled={limitReached}
          title={limitReached ? `Daily task limit reached (${dailyActive}/${dailyCap})` : ''}
          style={{ fontSize: 11, flexShrink: 0, opacity: limitReached ? 0.5 : 1, cursor: limitReached ? 'not-allowed' : 'pointer', marginTop: 8 }}
          onClick={() => handleAddTask()}>+ Task</button>
      </div>
    </div>
  );
}

const MTaskCard = ({ task, S, onOpenTask, onStatus, onHide }) => {
  const { STC, STB, STATS } = getStatusMaps(useStore.getState().S.task_statuses);
  const cStatus = getCompleteStatus(useStore.getState().S.task_statuses);
  const memberStatuses = STATS.filter(s => s !== cStatus);
  const currentIdx = memberStatuses.indexOf(task.status);
  const nextStatus = memberStatuses[(currentIdx + 1) % memberStatuses.length];
  const mood = sel.gmood(S, task.mood);
  const client = sel.gc(S, task.clientId);
  const timeStr = taskTimeStr(task);
  const isHero = task.mood === 'hero', isTop = task.mood === 'top', isImp = task.mood === 'imp';
  const extra = isHero ? ' hero' : isImp ? ' imp-card' : isTop ? ' top' : ' light';
  const [linkPop, setLinkPop] = useState(false);
  const hasNotes = task.notes?.trim().length > 0;
  const hasLinks = task.links?.length > 0;
  const hasSubtasks = task.subtasks?.length > 0;
  const subTotal = task.subtasks?.length || 0;
  const subDone = task.subtasks?.filter(s => s.done).length || 0;

  return (
    <div className={`tcard${extra}`} onClick={() => onOpenTask(task)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 2 }}>
        <div className="tcn" style={{ flex: 1 }}>{task.isMilestone ? '🏁 ' : ''}{task.name}</div>
      </div>
      {client && <div className="tcc" style={{ color: mood?.color || 'var(--t2)', fontWeight: 600 }}>{client.name}</div>}
      <div className="tcs-row">
        {onStatus && (
          <span className="tcs" style={{ background: STB[task.status], color: STC[task.status] }}
            onClick={(e) => { e.stopPropagation(); onStatus(task.id, nextStatus); }}>
            {task.status} ▼
          </span>
        )}
        {timeStr && <span className="ttime">{timeStr}</span>}
        {onHide && (
          <button className="tcard-hide" onClick={(e) => { e.stopPropagation(); onHide(task.id); }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--t3)', padding: '0 4px' }}
            title="Hide">✕</button>
        )}
      </div>
      {task.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
          {task.tags.map(tid => { const tg = sel.gtag(S, tid); return tg ? <span key={tid} className="ttag-chip">{tg.label}</span> : null; })}
        </div>
      )}
      {(hasNotes || hasLinks || hasSubtasks) && (
        <div className="card-icon-row">
          {hasNotes && (
            <span className="card-icon-pill notes-pill" aria-label="Has notes">
              📝<span className="card-pill-tip">{task.notes}</span>
            </span>
          )}
          {hasLinks && (
            <span className="card-icon-pill link-pill" aria-label={`${task.links.length} link(s)`}
              onClick={e => { e.stopPropagation(); setLinkPop(p => !p); }}>
              🔗 {task.links.length}
              {linkPop && (
                <span className="card-link-pop" onClick={e => e.stopPropagation()}>
                  {task.links.map((ln, i) => (
                    <span key={i} className="card-link-item" onClick={() => window.open(ln.url, '_blank', 'noopener,noreferrer')}>
                      {ln.label || ln.url}
                    </span>
                  ))}
                </span>
              )}
            </span>
          )}
          {hasSubtasks && (
            <CircProg done={subDone} total={subTotal} />
          )}
        </div>
      )}
    </div>
  );
};
