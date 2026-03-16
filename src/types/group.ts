export interface Subgroup {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  streamId: string;
  subgroups: Subgroup[];
  studentCount: number;
  disciplineIds: string[];
}

export interface Stream {
  id: string;
  name: string;
  groupIds: string[];
  disciplineIds: string[];
}
