import { useState, useCallback } from 'react';
import useMemberPlayground from '../hooks/useMemberPlayground';
import PlaygroundToolbar from '../components/playground/PlaygroundToolbar';
import SpreadsheetGrid from '../components/playground/SpreadsheetGrid';
import ClientSidebar from '../components/playground/ClientSidebar';
import TaskModal from '../components/TaskModal';
import Modal from '../components/Modal';

export default function MemberPlayground() {
  const {
    S, tabs, tab, activeTab, sidebarOpen, taskModal, renameModal, pendingCell, fromCellText,
    setActiveTab, setSidebarOpen, setTaskModal, setPendingCell, setFromCellText,
    addTab, deleteTab, renameTab, saveRename, clearTab,
    convertToTask, handleTaskSaved, openTask, unlinkCell, setRenameModal,
    updateCellText,
  } = useMemberPlayground();

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
              onConvertToTask={convertToTask}
              onOpenTask={openTask}
              onUnlink={unlinkCell}
              onUpdateCellText={updateCellText}
            />
          </div>
        </div>
      </div>

      {taskModal && (
        <TaskModal
          task={taskModal}
          fromCellText={fromCellText}
          onClose={() => { setTaskModal(null); setPendingCell(null); setFromCellText(''); }}
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
