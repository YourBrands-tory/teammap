import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { uid } from '../lib/constants';

export default function useBuilder() {
  const S = useStore(s => s.S);
  const upsertLink = useStore(s => s.upsertLink);
  const delLink = useStore(s => s.delLink);

  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [dragMid, setDragMid] = useState(null);
  const [modal, setModal] = useState({ type: null, data: {} });

  const selectMember = useCallback((id) => {
    setSelectedMemberId(prev => prev === id ? null : id);
  }, []);

  const openModal = useCallback((type, data = {}) => {
    setModal({ type, data });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ type: null, data: {} });
  }, []);

  const handleDrop = useCallback((clientId) => {
    if (!dragMid) return;
    const exists = S.links.some(l => l.memberId === dragMid && l.clientId === clientId);
    if (!exists) {
      upsertLink({ memberId: dragMid, clientId, roles: [] });
    }
    setDragMid(null);
  }, [dragMid, S.links, upsertLink]);

  const toggleLink = useCallback((memberId, clientId) => {
    const existing = S.links.find(l => l.memberId === memberId && l.clientId === clientId);
    if (existing) {
      if (confirm('Remove assignment and all its roles?')) {
        delLink(existing.id);
      }
    } else {
      upsertLink({ memberId, clientId, roles: [] });
    }
  }, [S.links, delLink, upsertLink]);

  const removeLink = useCallback((linkId) => {
    if (confirm('Remove assignment and all its roles?')) {
      delLink(linkId);
    }
  }, [delLink]);

  const removeRole = useCallback((linkId, roleId) => {
    const link = S.links.find(l => l.id === linkId);
    if (link) {
      upsertLink({
        ...link,
        roles: link.roles.filter(r => r.id !== roleId),
      });
    }
  }, [S.links, upsertLink]);

  return {
    S, selectedMemberId, dragMid, modal,
    selectMember, setDragMid, handleDrop, toggleLink,
    removeLink, removeRole, openModal, closeModal,
  };
}
