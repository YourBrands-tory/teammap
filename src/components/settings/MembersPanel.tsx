import { useState, useCallback, useEffect, useMemo } from 'react';
import { DndContext, DragOverlay, pointerWithin, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { COLORS } from '../../lib/constants';
import { useStore } from '../../store/useStore';

interface Member {
  id: string; name: string; role?: string; color: string; capacity?: number;
}

interface Props {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  upsertMember: (m: any) => Promise<any>;
}

function MemberDragPreview({ member }: { member: Member }) {
  return (
    <div className="st-li st-li-overlay">
      <div style={{ width: 9, height: 9, borderRadius: '50%', background: member.color, flexShrink: 0 }} />
      <span className="st-li-name">{member.name}</span>
    </div>
  );
}

function MemberRow({ member, onEdit, onDelete, upsertMember }: {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (id: string) => void;
  upsertMember: (m: any) => Promise<any>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
    position: 'relative' as const,
  };

  const storageKey = 'tmm-' + member.id;
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1'; } catch { return false; }
  });

  const toggle = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.st-drag, button, input, .st-li-csw')) return;
    setOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(storageKey, next ? '1' : '0'); } catch {}
      return next;
    });
  }, [storageKey]);

  const [role, setRole] = useState(member.role || '');
  const [cap, setCap] = useState(member.capacity ?? 6);
  const [color, setColor] = useState(member.color);

  useEffect(() => {
    setRole(member.role || '');
    setCap(member.capacity ?? 6);
    setColor(member.color);
  }, [member.id, member.role, member.capacity, member.color]);

  const save = useCallback(() => {
    upsertMember({ id: member.id, name: member.name, role, capacity: cap, color });
  }, [member.id, member.name, role, cap, color, upsertMember]);

  const pickColor = useCallback((c: string) => {
    setColor(c);
    upsertMember({ id: member.id, name: member.name, role, capacity: cap, color: c });
  }, [member.id, member.name, role, cap, upsertMember]);

  const stopProp = useCallback((e: React.PointerEvent) => e.stopPropagation(), []);

  return (
    <div ref={setNodeRef} style={style} className={'st-li-w' + (isDragging ? ' st-li-dragging' : '')}>
      <div className={'st-li st-li-h' + (open ? ' open' : '')}
        {...attributes} {...listeners}
        onClick={toggle}>
        <span className="st-drag">⋮⋮</span>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span className="st-li-name">{member.name}</span>
        <span className={'st-arrow' + (open ? ' open' : '')}>▾</span>
      </div>
      <div className={'st-li-body' + (open ? ' open' : '')}>
        <div className="st-li-body-in">
          <div className="st-li-field">
            <span className="st-li-label">Role</span>
            <input className="st-li-input" type="text" value={role}
              onChange={e => setRole(e.target.value)} onBlur={save}
              onPointerDown={stopProp} placeholder="Role / title" />
          </div>
          <div className="st-li-field">
            <span className="st-li-label">Daily Limit</span>
            <input className="st-li-input st-li-num" type="number" value={cap} min={1} max={20}
              onChange={e => setCap(parseInt(e.target.value) || 6)} onBlur={save}
              onPointerDown={stopProp} />
          </div>
          <div className="st-li-field">
            <span className="st-li-label">Colour</span>
            <div className="st-li-cpick" onPointerDown={stopProp}>
              {COLORS.map(c => (
                <div key={c}
                  className={'st-li-csw' + (color === c ? ' sel' : '')}
                  style={{ background: c }}
                  onClick={() => pickColor(c)} />
              ))}
            </div>
          </div>
          <div className="st-li-actions" style={{ marginTop: 8 }}>
            <button className="btn btn-xs" onClick={() => onEdit(member)} onPointerDown={stopProp}>Edit</button>
            <button className="btn btn-xs btn-d" onClick={() => onDelete(member.id)} onPointerDown={stopProp}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembersPanel({ members: rawMembers, onEdit, onDelete, onAdd, upsertMember }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeMember = useMemo(
    () => rawMembers.find(m => m.id === activeId),
    [rawMembers, activeId]
  );

  const [ordered, setOrdered] = useState<Member[]>(() => [...rawMembers]);

  const rawIds = useMemo(() => rawMembers.map(m => m.id).join(','), [rawMembers]);

  useEffect(() => {
    setOrdered([...rawMembers]);
  }, [rawIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = useCallback((event: any) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIdx = ordered.findIndex(m => m.id === active.id);
    const newIdx = ordered.findIndex(m => m.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(ordered, oldIdx, newIdx);
    setOrdered(reordered);
    useStore.getState().setStateKey('memberOrder', reordered.map(m => m.id));
  }, [ordered]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const ids = useMemo(() => ordered.map(m => m.id), [ordered]);

  return (
    <div className="st-panel">
      <div className="st-panel-head">
        <h3>Team members</h3>
        <button className="btn btn-sm btn-p" onClick={onAdd}>+ Add</button>
      </div>
      <div className="st-panel-body st-panel-body-dnd" id="st-members">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {ordered.map(m => (
              <MemberRow key={m.id} member={m}
                onEdit={onEdit} onDelete={onDelete} upsertMember={upsertMember} />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeMember ? <MemberDragPreview member={activeMember} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
