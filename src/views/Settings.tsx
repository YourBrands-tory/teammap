import { useState, useCallback, useRef } from 'react';
import { useStore, sel } from '../store/useStore';
import { COLORS, uid } from '../lib/constants';
import useSettings from '../hooks/useSettings';
import MembersPanel from '../components/settings/MembersPanel';
import ClientsPanel from '../components/settings/ClientsPanel';
import MoodsPanel from '../components/settings/MoodsPanel';
import TagsPanel from '../components/settings/TagsPanel';
import FrequencyPanel from '../components/settings/FrequencyPanel';
import NavigationPanel from '../components/settings/NavigationPanel';
import PreferencesPanel from '../components/settings/PreferencesPanel';
import MemberModal from '../components/modals/MemberModal';
import ClientModal from '../components/modals/ClientModal';
import MoodModal from '../components/modals/MoodModal';
import TagModal from '../components/modals/TagModal';
import FrequencyModal from '../components/modals/FrequencyModal';

export default function Settings() {
  const S = useStore(s => s.S);
  const role = useStore(s => s.role);
  const upsertMember = useStore(s => s.upsertMember);
  const upsertClient = useStore(s => s.upsertClient);
  const setMoods = useStore(s => s.setMoods);
  const upsertTag = useStore(s => s.upsertTag);
  const setStateKey = useStore(s => s.setStateKey);
  const setNavOrder = useStore(s => s.setNavOrder);
  const setNavLabels = useStore(s => s.setNavLabels);
  const importJSON = useStore(s => s.importJSON);

  const {
    stDrag, ftDragId, setStDrag, setFtDragId,
    delMember, delClient, toggleMoodHidden,
    delTag, delFreqTag,
    reorderMembers, reorderClientsFn, reorderMoods, reorderTags,
    reorderFreqTags, reorderNav, renameNav,
    resetNav, updateSettings, exportJSON,
  } = useSettings();

  const [memberModal, setMemberModal] = useState<any | null>(null);
  const [clientModal, setClientModal] = useState<any | null>(null);
  const [moodModal, setMoodModal] = useState<{ index: number; mood?: any } | null>(null);
  const [tagModal, setTagModal] = useState<any | null>(null);
  const [freqModal, setFreqModal] = useState<any | null>(null);

  const navDragRef = useRef<string | null>(null);

  const handleStDragStart = useCallback((id: string, type: string) => {
    setStDrag({ id, type });
  }, [setStDrag]);

  const handleStDrop = useCallback((type: string, targetId: string) => {
    if (type === 'member') reorderMembers(targetId);
    else if (type === 'client') reorderClientsFn(targetId);
    else if (type === 'mood') reorderMoods(targetId);
    else if (type === 'tag') reorderTags(targetId);
  }, [reorderMembers, reorderClientsFn, reorderMoods, reorderTags]);

  const handleNavDrop = useCallback((targetId: string) => {
    const dragId = navDragRef.current;
    if (!dragId || dragId === targetId) return;
    const order = [...(S.navOrder || [])];
    const fi = order.indexOf(dragId);
    const ti = order.indexOf(targetId);
    if (fi < 0 || ti < 0) return;
    const [dr] = order.splice(fi, 1);
    order.splice(ti, 0, dr);
    setNavOrder(order);
  }, [S.navOrder, setNavOrder]);

  const handleNavRename = useCallback(async (id: string, label: string) => {
    const labels = { ...(S.navLabels || {}), [id]: label.trim() || id };
    await setNavLabels(labels);
  }, [S.navLabels, setNavLabels]);

  return (
    <div className="view active" style={{ overflowY: 'auto' }}>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, letterSpacing: '-.8px', padding: '20px 20px 0' }}>
        Settings
      </div>
      <div className="st-grid">
        {role === 'admin' && (
          <MembersPanel
            members={S.members}
            stDrag={stDrag}
            onDragStart={handleStDragStart}
            onDragEnd={() => {}}
            onDrop={handleStDrop}
            onEdit={(m) => setMemberModal(m)}
            onDelete={delMember}
            onAdd={() => setMemberModal({ _new: true })}
          />
        )}

        <ClientsPanel
          clients={sel.scl(S)}
          stDrag={stDrag}
          onDragStart={handleStDragStart}
          onDragEnd={() => {}}
          onDrop={handleStDrop}
          onEdit={(c) => setClientModal(c)}
          onDelete={delClient}
          onAdd={() => setClientModal({ _new: true })}
        />

        <MoodsPanel
          moods={S.moods}
          stDrag={stDrag}
          onDragStart={handleStDragStart}
          onDragEnd={() => {}}
          onDrop={handleStDrop}
          onEdit={(i) => setMoodModal({ index: i, mood: S.moods[i] })}
          onAdd={() => setMoodModal({ index: -1 })}
          onToggleHidden={toggleMoodHidden}
        />

        <TagsPanel
          tags={S.tags}
          stDrag={stDrag}
          onDragStart={handleStDragStart}
          onDragEnd={() => {}}
          onDrop={handleStDrop}
          onAdd={async (label) => {
            if (S.tags.find(t => t.label.toLowerCase() === label.toLowerCase())) return;
            await upsertTag({ label, color: COLORS[S.tags.length % COLORS.length] });
          }}
          onEdit={(tg) => setTagModal(tg)}
          onDelete={delTag}
        />

        <FrequencyPanel
          freqTags={S.freqTags || []}
          ftDragId={ftDragId}
          onDragStart={setFtDragId}
          onDragEnd={() => {}}
          onDrop={reorderFreqTags}
          onAdd={async (label) => {
            const freqTags = S.freqTags || [];
            if (freqTags.find((f: any) => f.label.toLowerCase() === label.toLowerCase())) return;
            const updated = [...freqTags, { id: uid(), label, order: freqTags.length }];
            await setStateKey('freqTags', updated);
          }}
          onEdit={(f) => setFreqModal(f)}
          onDelete={delFreqTag}
        />

        <NavigationPanel
          navOrder={S.navOrder || []}
          navLabels={S.navLabels || {}}
          navDragId={navDragRef.current}
          onDragStart={(id) => { navDragRef.current = id; }}
          onDragEnd={() => {}}
          onDrop={handleNavDrop}
          onRename={handleNavRename}
          onReset={resetNav}
        />

        <PreferencesPanel
          maxCap={S.settings.maxCap}
          weekends={!!S.settings.weekends}
          onUpdateSettings={updateSettings}
          onExport={exportJSON}
          onImport={importJSON}
        />
      </div>

      {memberModal && (
        <MemberModal
          member={memberModal._new ? null : memberModal}
          defaultCap={S.settings.maxCap}
          onSave={async (id, name, role, capacity, color) => {
            await upsertMember({ ...(id ? { id } : {}), name, role, capacity, color });
          }}
          onClose={() => setMemberModal(null)}
        />
      )}

      {clientModal && (
        <ClientModal
          client={clientModal._new ? null : clientModal}
          onSave={async (id, name, industry, color) => {
            if (id) {
              await upsertClient({ id, name, industry });
            } else {
              await upsertClient({ name, industry, color, order: S.clients.length });
            }
          }}
          onClose={() => setClientModal(null)}
        />
      )}

      {moodModal && (
        <MoodModal
          mood={moodModal.index >= 0 ? moodModal.mood : null}
          index={moodModal.index}
          onSave={async (idx, data) => {
            const moods = [...S.moods];
            if (idx >= 0 && idx < moods.length) {
              moods[idx] = { ...moods[idx], ...data };
            } else {
              moods.push({
                id: uid(), ...data,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                bg: '#f2f0ec',
              });
            }
            await setMoods(moods);
          }}
          onClose={() => setMoodModal(null)}
        />
      )}

      {tagModal && (
        <TagModal
          tag={tagModal}
          onSave={async (id, label) => {
            const existing = S.tags.find(t => t.id === id);
            if (existing) {
              await upsertTag({ id, label, color: existing.color });
            }
          }}
          onClose={() => setTagModal(null)}
        />
      )}

      {freqModal && (
        <FrequencyModal
          freq={freqModal}
          onSave={async (id, label) => {
            const updated = (S.freqTags || []).map((f: any) =>
              f.id === id ? { ...f, label: label.trim() || f.label } : f
            );
            await setStateKey('freqTags', updated);
          }}
          onClose={() => setFreqModal(null)}
        />
      )}
    </div>
  );
}
