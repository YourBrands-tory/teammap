import { useMemo } from 'react';
import { useStore, sel } from '../store/useStore';
import { today } from '../lib/constants';
import {
  gcc, ovcap, thrs, totRoles, totHours, capPct, capFill, freeSlots, lform,
} from '../utils/dashboardHelpers';

export default function useTeamDashboard() {
  const S = useStore(s => s.S);

  const stats = useMemo(() => {
    const overc = S.members.filter((m: any) => ovcap(m, S.links)).length;
    const tRoles = totRoles(S.links);
    const tHours = totHours(S.links);
    const tcount = S.tasks.filter((t: any) => !t.deleted && t.date === today()).length;
    return { memberCount: S.members.length, overc, clientCount: S.clients.length, linkCount: S.links.length, totRoles: tRoles, tcount, totHours: tHours };
  }, [S.members, S.clients, S.links, S.tasks]);

  const memberCards = useMemo(() =>
    S.members.map((m: any) => {
      const cnt = gcc(S.links, m.id);
      const cap = m.capacity || 6;
      const over = ovcap(m, S.links);
      const hrs = thrs(S.links, m.id);
      const links = lform(S.links, m.id);
      return { member: m, cnt, cap, over, hrs, links };
    }),
    [S.members, S.links]
  );

  const sortedClients = useMemo(() => sel.scl(S), [S.clients]);

  const roleRows = useMemo(() =>
    S.links.filter((l: any) => l.roles.length).flatMap((link: any) => {
      const m = sel.gm(S, link.memberId);
      const c = sel.gc(S, link.clientId);
      if (!m || !c) return [];
      return link.roles.map((r: any) => ({ member: m, client: c, role: r }));
    }),
    [S.links, S]
  );

  return { S, stats, memberCards, sortedClients, roleRows, weekends: !!S.settings.weekends };
}
