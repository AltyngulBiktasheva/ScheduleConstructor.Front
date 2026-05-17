// ─── Enums ────────────────────────────────────────────────────────────────────

export type AcademicDisciplineTargetType = 'General' | 'Specialized' | 'ByChoice' | 'Optional';
export type AcademicDisciplineType = 'Lecture' | 'Practice' | 'Lab' | 'Exam' | 'Test';
export type DisciplineLessonRepeatType = 'Weekly' | 'EvenWeeks' | 'OddWeeks' | 'Once';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type LessonFlexibilityType = 'Fixed' | 'Flexible';
export type LessonValidationErrorType = 'Warning' | 'Error';
export type LessonValidationCode =
  | 'MismatchedSemesterNumber'
  | 'MismatchedAcademicDisciplineType'
  | 'FixedLessonTypeConflictByGroup'
  | 'FlexibleLessonTypeConflictByGroup'
  | 'RestrictedTeacherPreferenceTypeConflict'
  | 'FlexibleTeacherPreferenceTypeConflict'
  | 'FixedLessonTypeConflictByRoom'
  | 'FlexibleLessonTypeConflictByRoom'
  | 'MismatchedAcademicDisciplineTypeTotalHoursCount'
  | 'MismatchedAcademicDisciplineTypeLessonPerWeekCount'
  | 'MismatchedAcademicDisciplineTypeStudyWeeksCount';
export type RoomType = 'Standard' | 'Multimedia' | 'Laboratory' | 'Amphitheater';
export type StudentGroupType = 'Thread' | 'Group' | 'SemiGroup';
export type TeacherPreferenceType = 'Restricted' | 'Undesirable' | 'Preferred';

// ─── Common ───────────────────────────────────────────────────────────────────

export interface TimeInterval {
  timeFrom: string; // format: time (HH:MM:SS)
  timeTo: string;
}

export interface DateInterval {
  dateFrom: string; // format: date (YYYY-MM-DD)
  dateTo: string;
}

export interface DayOfWeekTimeInterval {
  dayOfWeek: DayOfWeek;
  timeInterval: TimeInterval;
}

export interface DateWithTimeInterval {
  date: string; // format: date
  timeInterval: TimeInterval;
}

// ─── Registry helpers ─────────────────────────────────────────────────────────

export interface SearchParametersDto {
  page: number;
  itemsPerPage?: number | null;
  orderBy?: string | null;
  orderAsc?: boolean | null;
  thenBy?: string | null;
  thenAsc?: boolean | null;
}

export interface RegistryDto<T> {
  items: T[];
  itemsCount: number;
}

// ─── AcademicDiscipline ───────────────────────────────────────────────────────

export interface LessonBatchInfoDto {
  id?: string | null;
  studentGroups: StudentGroupShortDto[];
  teacherIds: string[];
  roomIds: string[];
  dayOfWeekTimeIntervals?: DayOfWeekTimeInterval[] | null;
  repeatType: DisciplineLessonRepeatType;
  dateInterval: DateInterval;
  allowCombining: boolean;
  hoursCost?: number | null;
  totalHoursCost?: number | null;
}

export interface AcademicDisciplineViewDto {
  id?: string | null;
  name?: string | null;
  semesterNumber: number;
  academicDisciplineTargetType: AcademicDisciplineTargetType;
  lectureLessonBatchInfos?: LessonBatchInfoDto[] | null;
  practiceLessonBatchInfos?: LessonBatchInfoDto[] | null;
  labLessonBatchInfos?: LessonBatchInfoDto[] | null;
  examLessonBatchInfos?: LessonBatchInfoDto[] | null;
  testLessonBatchInfos?: LessonBatchInfoDto[] | null;
  allowedLessonTypes?: AcademicDisciplineType[] | null;
  associatedNames?: string[] | null;
  comment?: string | null;
}

export interface AcademicDisciplineRegistryItemDto {
  id: string;
  name: string;
  semesterNumber: number;
  academicDisciplineTargetType: AcademicDisciplineTargetType;
  allowedLessonTypes: AcademicDisciplineType[];
  lectureLessonBatchInfos?: LessonBatchInfoDto[] | null;
  practiceLessonBatchInfos?: LessonBatchInfoDto[] | null;
  labLessonBatchInfos?: LessonBatchInfoDto[] | null;
  examLessonBatchInfos?: LessonBatchInfoDto[] | null;
  testLessonBatchInfos?: LessonBatchInfoDto[] | null;
  comment?: string | null;
}

export interface AcademicDisciplineSaveDto {
  id?: string | null;
  scheduleId: string;
  name?: string | null;
  semesterNumber: number;
  academicDisciplineTargetType: AcademicDisciplineTargetType;
  allowedLessonTypes?: AcademicDisciplineType[] | null;
  lectureLessonBatchInfos?: LessonBatchInfoDto[] | null;
  practiceLessonBatchInfos?: LessonBatchInfoDto[] | null;
  labLessonBatchInfos?: LessonBatchInfoDto[] | null;
  examLessonBatchInfos?: LessonBatchInfoDto[] | null;
  testLessonBatchInfos?: LessonBatchInfoDto[] | null;
  comment?: string | null;
}

// ─── Campus ───────────────────────────────────────────────────────────────────

export interface CampusRegistryItemDto {
  id: string;
  name: string;
}

export interface CampusSaveDto {
  id?: string | null;
  name: string;
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

export interface LessonValidationPayload {
  affectedByAcademicDisciplineId?: string | null;
  affectedByStudentGroupId?: string | null;
  affectedByLessonId?: string | null;
  affectedByTeacherPreferenceId?: string | null;
  affectedByTeacherId?: string | null;
}

export interface LessonPolicyViolation {
  id?: string | null;
  errorType: LessonValidationErrorType;
  code: LessonValidationCode;
  payload: LessonValidationPayload;
  message?: string | null;
}

export interface LessonViewDto {
  id?: string | null;
  academicDisciplineId?: string | null;
  academicDisciplineType?: AcademicDisciplineType | null;
  studentGroupIds: string[];
  teacherIds: string[];
  roomIds: string[];
  dateWithTimeInterval?: DateWithTimeInterval | null;
  flexibilityType: LessonFlexibilityType;
  allowCombining: boolean;
  hoursCost: number;
  createdFromDiscipline: boolean;
  violations?: LessonPolicyViolation[] | null;
}

export interface LessonRegistryItemDto {
  id: string;
  academicDisciplineId?: string | null;
  academicDisciplineType?: AcademicDisciplineType | null;
  studentGroupIds: string[];
  teacherIds: string[];
  roomIds: string[];
  dateWithTimeInterval?: DateWithTimeInterval | null;
  flexibilityType: LessonFlexibilityType;
  allowCombining: boolean;
  hoursCost: number;
  createdFromDiscipline: boolean;
  violations: LessonPolicyViolation[];
}

export interface LessonSaveDto {
  id?: string | null;
  scheduleId: string;
  academicDisciplineId?: string | null;
  academicDisciplineType?: AcademicDisciplineType | null;
  studentGroupIds: string[];
  teacherIds: string[];
  roomIds: string[];
  dateWithTimeInterval?: DateWithTimeInterval | null;
  flexibilityType: LessonFlexibilityType;
  allowCombining: boolean;
  hoursCost: number;
}

export interface LessonWeekTeacherDto {
  id: string;
  fullname?: string | null;
}

export interface LessonWeekRoomDto {
  id: string;
  name?: string | null;
}

export interface LessonShortDto {
  id: string;
  academicDisciplineId?: string | null;
  academicDisciplineType?: AcademicDisciplineType | null;
  name?: string | null;
  studentGroups: StudentGroupShortDto[];
  teachers: LessonWeekTeacherDto[];
  rooms: LessonWeekRoomDto[];
  dateWithTimeInterval: DateWithTimeInterval;
  flexibilityType: LessonFlexibilityType;
  allowCombining: boolean;
  hoursCost: number;
  lessonPolicyViolationDescription?: string | null;
  lessonBatchInfoId?: string | null;
  currentErrorsMaxLevel?: LessonValidationErrorType | null;
}

export interface WeekConflictMessageDto {
  timeInterval: TimeInterval;
  message: string;
}

export interface AcademicDisciplineWeekConflictDto {
  dayOfWeekTimeInterval: DayOfWeekTimeInterval;
  messages: WeekConflictMessageDto[];
  errorType: LessonValidationErrorType;
}

export interface LessonWeekConflictDto {
  dayOfWeekTimeInterval: DayOfWeekTimeInterval;
  message?: string | null;
}

// ─── Room ─────────────────────────────────────────────────────────────────────

export interface RoomShortDto {
  id: string;
  name: string;
}

export interface RoomTreeDto {
  campusId: string;
  campusName: string;
  childRooms: RoomShortDto[];
}

export interface RoomRegistryItemDto {
  id: string;
  name: string;
  campusId: string;
  campusName: string;
  roomType?: RoomType | null;
  capacity?: number | null;
  roomBoardType?: RoomBoardType | null;
  hasProjector?: boolean | null;
}

export interface SearchRoomsDto {
  campusId?: string | null;
  searchParameters: SearchParametersDto;
}

export interface RoomViewDto {
  id: string;
  name?: string | null;
  campusId: string;
  campusName?: string | null;
  roomType?: RoomType | null;
  capacity?: number | null;
  roomBoardType?: RoomBoardType | null;
  hasProjector?: boolean | null;
}

export type RoomBoardType = 'Chalk' | 'Marker';

export interface RoomSaveDto {
  id?: string | null;
  name: string;
  campusId: string;
  roomType: RoomType;
  capacity?: number | null;
  roomBoardType?: RoomBoardType | null;
  hasProjector?: boolean | null;
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export interface ScheduleDto {
  id: string;
  name: string;
}

export interface ScheduleRegistryItemDto {
  id: string;
  name: string;
  dateInterval: DateInterval;
}

export interface ScheduleSaveDto {
  id?: string | null;
  name: string;
  dateInterval: DateInterval;
}

// ─── StudentGroup ─────────────────────────────────────────────────────────────

export interface StudentGroupShortDto {
  id: string;
  name?: string | null;
}

export interface StudentGroupViewDto {
  id: string;
  name?: string | null;
  semesterNumber: number;
  studentGroupType: StudentGroupType;
  children?: StudentGroupShortDto[] | null;
}

export interface StudentGroupRegistryItemDto {
  id: string;
  name: string;
  semesterNumber: number;
  studentsCount: number;
  studentGroupType: StudentGroupType;
  parents: StudentGroupShortDto[];
  children: StudentGroupShortDto[];
}

export interface StudentGroupTreeItemDto {
  id: string;
  name: string;
  children: StudentGroupTreeItemDto[];
}

export interface StudentSemiGroupSaveDto {
  id?: string | null;
  name: string;
}

export interface StudentGroupSaveDto {
  id?: string | null;
  scheduleId: string;
  name: string;
  semesterNumber: number;
  studentsCount?: number;
  studentGroupType: StudentGroupType;
  parentIds?: string[];
  children?: StudentSemiGroupSaveDto[];
}

// ─── Teacher ─────────────────────────────────────────────────────────────────

export interface TeacherViewDto {
  id: string;
  fullname?: string | null;
  contacts?: string | null;
}

export interface TeacherRegistryItemDto {
  id: string;
  fullname: string;
  contacts?: string | null;
}

export interface TeacherSaveDto {
  id?: string | null;
  fullname: string;
  contacts?: string | null;
}

// ─── TeacherPreference ────────────────────────────────────────────────────────

export interface TeacherTimePreferenceViewDto {
  teacherPreferenceType: TeacherPreferenceType;
  dayOfWeekTimeInterval: DayOfWeekTimeInterval;
}

export interface TeacherRoomPreferenceViewDto {
  roomId: string;
  roomName: string;
  teacherPreferenceType: TeacherPreferenceType;
}

export interface TeacherPreferencesViewDto {
  teacherTimePreferences?: TeacherTimePreferenceViewDto[] | null;
  teacherRoomPreferences?: TeacherRoomPreferenceViewDto[] | null;
  comment?: string | null;
}

export interface TeacherTimePreferenceSaveDto {
  teacherPreferenceType: TeacherPreferenceType;
  dayOfWeekTimeInterval: DayOfWeekTimeInterval;
}

export interface TeacherRoomPreferenceSaveDto {
  roomId: string;
  teacherPreferenceType: TeacherPreferenceType;
}

export interface TeacherPreferenceSaveDto {
  scheduleId: string;
  teacherId: string;
  teacherTimePreferences?: TeacherTimePreferenceSaveDto[] | null;
  teacherRoomPreferences?: TeacherRoomPreferenceSaveDto[] | null;
  comment?: string | null;
}
