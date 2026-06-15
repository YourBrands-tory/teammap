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

  return (
    <div className="view active" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="builder">
        <MemberList
          S={S}
          selectedMemberId={selectedMemberId}
          onSelect={selectMember}
          onDragStart={setDragMid}
          onDragEnd={() => setDragMid(null)}
          onAdd={() => openModal('member')} />

        <ClientList
          S={S}
          selectedMemberId={selectedMemberId}
          onDrop={handleDrop}
          onToggleLink={(clientId) => {
            if (selectedMemberId) toggleLink(selectedMemberId, clientId);
          }}
          onAdd={() => openModal('client')} />

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
