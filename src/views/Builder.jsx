import { useState } from 'react';
import useBuilder from '../hooks/useBuilder';
import MemberList from '../components/builder/MemberList';
import ClientList from '../components/builder/ClientList';
import AssignmentCanvas from '../components/builder/AssignmentCanvas';
import MemberForm from '../components/builder/MemberForm';
import ClientForm from '../components/builder/ClientForm';
import RoleForm from '../components/builder/RoleForm';

export default function Builder() {
  const {
    S, selectedMemberId, dragMid, modal,
    selectMember, setDragMid, handleDrop, toggleLink,
    removeLink, removeRole, openModal, closeModal,
  } = useBuilder();

  const [collapsed, setCollapsed] = useState({ members: false, clients: false });

  return (
    <div className="view active" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="builder">
        <div className={`panel panel-mobile ${collapsed.members ? 'collapsed' : ''}`}>
          <div className="ph panel-mobile-head" onClick={() => setCollapsed(c => ({ ...c, members: !c.members }))}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <h3>Team Members</h3>
                <p>Drag to assign or click to select</p>
              </div>
              <button className="panel-collapse-btn" onClick={(e) => { e.stopPropagation(); setCollapsed(c => ({ ...c, members: !c.members })); }}>
                {collapsed.members ? '+' : '−'}
              </button>
            </div>
          </div>
          {!collapsed.members && (
            <MemberList
              S={S}
              selectedMemberId={selectedMemberId}
              onSelect={selectMember}
              onDragStart={setDragMid}
              onDragEnd={() => setDragMid(null)}
              onAdd={() => openModal('member')} />
          )}
        </div>

        <div className={`panel panel-mobile ${collapsed.clients ? 'collapsed' : ''}`}>
          <div className="ph panel-mobile-head" onClick={() => setCollapsed(c => ({ ...c, clients: !c.clients }))}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <h3>Clients & Projects</h3>
                <p>Drop member here to assign</p>
              </div>
              <button className="panel-collapse-btn" onClick={(e) => { e.stopPropagation(); setCollapsed(c => ({ ...c, clients: !c.clients })); }}>
                {collapsed.clients ? '+' : '−'}
              </button>
            </div>
          </div>
          {!collapsed.clients && (
            <ClientList
              S={S}
              selectedMemberId={selectedMemberId}
              onDrop={handleDrop}
              onToggleLink={(clientId) => {
                if (selectedMemberId) toggleLink(selectedMemberId, clientId);
              }}
              onAdd={() => openModal('client')} />
          )}
        </div>

        <AssignmentCanvas
          S={S}
          onAddRole={(linkId) => openModal('role', { linkId })}
          onEditRole={(linkId, roleId) => openModal('role', { linkId, roleId })}
          onRemoveRole={removeRole}
          onRemoveLink={removeLink} />
      </div>

      {modal.type === 'member' && <MemberForm data={modal.data} onClose={closeModal} />}
      {modal.type === 'client' && <ClientForm data={modal.data} onClose={closeModal} />}
      {modal.type === 'role' && (
        <RoleForm
          linkId={modal.data.linkId}
          role={modal.data.roleId && S.links.find(l => l.id === modal.data.linkId)?.roles.find(r => r.id === modal.data.roleId) || null}
          onClose={closeModal} />
      )}
    </div>
  );
}
