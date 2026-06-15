import { COLORS, CATS, PRIOS, PC, PB, CC, DAYS } from '../lib/constants';

export const getClientCount = (S, memberId) =>
  S.links.filter(l => l.memberId === memberId).length;

export const isOverCapacity = (S, memberId) => {
  const m = S.members.find(x => x.id === memberId);
  return m ? getClientCount(S, memberId) > (m.capacity || 6) : false;
};

export const getTotalHours = (S, memberId) =>
  S.links
    .filter(l => l.memberId === memberId)
    .reduce((a, l) => a + l.roles.reduce((b, r) => b + Number(r.hours || 0), 0), 0);

export const getSortedClients = (S) =>
  [...S.clients].sort((a, b) => (a.order || 0) - (b.order || 0));

export const getMemberLinks = (S, memberId) =>
  S.links.filter(l => l.memberId === memberId);

export const getLinkForMemberAndClient = (S, memberId, clientId) =>
  S.links.find(l => l.memberId === memberId && l.clientId === clientId);

export { COLORS, CATS, PRIOS, PC, PB, CC, DAYS };
