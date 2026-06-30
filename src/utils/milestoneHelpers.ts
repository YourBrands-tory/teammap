export interface Task {
  id: string;
  name: string;
  clientId?: string | null;
  date?: string;
  mood?: string;
  status: string;
  assignedTo: string[];
  tags: string[];
  estH: number;
  estM: number;
  notes: string;
  subtasks?: { text: string; done: boolean }[];
  links?: { label: string; url: string }[];
  isMilestone: boolean;
  milestoneId: string | null;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
}
