import { useState, useCallback, useEffect } from 'react';
import usePlayground from '../hooks/usePlayground';
import PlaygroundToolbar from '../components/playground/PlaygroundToolbar';
import SpreadsheetGrid from '../components/playground/SpreadsheetGrid';
import ClientSidebar from '../components/playground/ClientSidebar';
import TaskModal from '../components/TaskModal';
import Modal from '../components/Modal';

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

export default function Playground() {
  const {
    S, tabs, tab, activeTab, sidebarOpen, taskModal, renameModal, pendingCell,
    setActiveTab, setSidebarOpen, setTaskModal, setPendingCell,
    addTab, deleteTab, renameTab, saveRename, clearTab,
    convertToTask, handleTaskSaved, openTask, unlinkCell, setRenameModal,
    quickCreateTask, updateCellTaskName,
  } = usePlayground();

  const isMobile = useIsMobile();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    if (S.clients.length > 0 && !selectedClientId) {
      setSelectedClientId(S.clients[0].id);
    }
    if (selectedClientId && !S.clients.find((c: any) => c.id === selectedClientId)) {
      setSelectedClientId(S.clients[0]?.id || null);
    }
  }, [S.clients, selectedClientId]);

  const sortedClients = [...S.clients].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const handleInsertClient = useCallback((clientId: string) => {
    const c = S.clients.find((x: any) => x.id === clientId);
    if (!c) return;
    const cell = document.querySelector<HTMLElement>('.pg-cell:focus');
    if (cell) cell.focus();
  }, [S.clients]);

  return (
    <div className="pg-app">
      <PlaygroundToolbar
        tabs={tabs} activeTab={activeTab}
        onSelectTab={setActiveTab}
        onDeleteTab={deleteTab}
        onAdd={addTab}
        onRename={() => renameTab(activeTab)}
        onClear={() => clearTab(activeTab)}
      />
      {isMobile && (
        <div className="pg-mob-select">
          <select value={selectedClientId || ''} onChange={e => setSelectedClientId(e.target.value || null)}>
            {sortedClients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="pg-layout">
        <div className="pg-scroll-wrap">
          <ClientSidebar
            clients={S.clients}
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onInsertClient={handleInsertClient}
          />
          <div className="pg-body">
            <SpreadsheetGrid
              tab={tab}
              tasks={S.tasks}
              clients={S.clients}
              selectedClientId={isMobile ? selectedClientId : undefined}
              onConvertToTask={convertToTask}
              onOpenTask={openTask}
              onUnlink={unlinkCell}
              onUpdateTaskName={updateCellTaskName}
              onQuickCreate={quickCreateTask}
            />
          </div>
        </div>
      </div>

      {taskModal && (
        <TaskModal
          task={taskModal}
          onClose={() => { setTaskModal(null); setPendingCell(null); }}
          onSave={pendingCell ? handleTaskSaved : undefined}
        />
      )}

      {renameModal && (
        <RenameModal
          initial={renameModal.name}
          onSave={(name) => saveRename(renameModal.tabIndex, name)}
          onClose={() => setRenameModal(null)}
        />
      )}
    </div>
  );
}

function RenameModal({ initial, onSave, onClose }: { initial: string; onSave: (n: string) => void; onClose: () => void }) {
  const [name, setName] = useState(initial);

  return (
    <Modal onClose={onClose}>
      <h2>Rename sheet</h2>
      <label className="fl">Sheet name</label>
      <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <div className="ma">
        <button className="btn btn-g" onClick={onClose}>Cancel</button>
        <button className="btn btn-p" onClick={() => { const v = name.trim(); if (v) onSave(v); }}>Rename</button>
      </div>
    </Modal>
  );
}
