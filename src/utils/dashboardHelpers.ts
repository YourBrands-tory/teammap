import { DAYS, PB, PC, CC } from '../lib/constants';

export interface Member {
  id: string; name: string; role?: string; color: string; capacity?: number;
}

export interface Client {
  id: string; name: string; industry?: string; color: string; order?: number;
}

export interface Role {
  id: string; name: string; hours?: number; days?: number[]; priority?: string; category?: string;
}

export interface Link {
  id: string; memberId: string; clientId: string; roles: Role[];
}

export interface Task {
  id: string; date?: string; deleted: boolean;
}

export function lform(links: Link[], memberId: string): Link[] {
  return links.filter(l => l.memberId === memberId);
}

export function gcc(links: Link[], memberId: string): number {
  return lform(links, memberId).length;
}

export function ovcap(member: Member, links: Link[]): boolean {
  return gcc(links, member.id) > (member.capacity || 6);
}

export function thrs(links: Link[], memberId: string): number {
  return links.filter(l => l.memberId === memberId)
    .reduce((a, l) => a + l.roles.reduce((b, r) => b + Number(r.hours || 0), 0), 0);
}

export function totRoles(links: Link[]): number {
  return links.reduce((a, l) => a + l.roles.length, 0);
}

export function totHours(links: Link[]): number {
  return links.reduce((a, l) => a + l.roles.reduce((b, r) => b + Number(r.hours || 0), 0), 0);
}

export function capPct(cnt: number, max: number): number {
  return Math.min(100, Math.round(cnt / max * 100));
}

export function capFill(cnt: number, max: number, color: string): string {
  return cnt > max ? '#e76f51' : (cnt / max > 0.8 ? '#d97706' : color);
}

export function ddEl(days: number[] | undefined, weekends: boolean): string {
  const show = weekends ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
  return `<div class="rdays">${show.map(i =>
    `<div class="dd ${(days || []).includes(i) ? 'on' : 'off'}">${DAYS[i]}</div>`
  ).join('')}</div>`;
}

export function freeSlots(member: Member, links: Link[]): number {
  return (member.capacity || 6) - gcc(links, member.id);
}
