export interface Subgroup {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  streamIds?: string[];
  subgroups: Subgroup[];
  studentCount: number;
  disciplineIds: string[];

  // Транспортные поля — вычисляются в форме, используются при сохранении
  _children?: Subgroup[]
}

export interface Stream {
  id: string;
  name: string;
  semesterNumber?: number;
  groupIds: string[];
  disciplineIds: string[];
}
