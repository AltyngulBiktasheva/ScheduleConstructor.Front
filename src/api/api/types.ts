// ─── Enums ────────────────────────────────────────────────────────────────────

export type AcademicDisciplineTargetType = 'General' | 'Specialized' | 'ByChoice' | 'Optional';
export type AcademicDisciplineType = 'Lecture' | 'Practice' | 'Lab' | 'Exam' | 'Test';
export type DisciplineLessonRepeatType = 1 | 2 | 3 | 4 | 'Weekly' | 'EvenWeeks' | 'OddWeeks' | 'Once';
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
  studentGroupIds: string[];
  teacherIds: string[];
  roomIds: string[];
  dayOfWeekTimeIntervals?: DayOfWeekTimeInterval[] | null;
  repeatType: DisciplineLessonRepeatType;
  dateInterval: DateInterval;
  allowCombining: boolean;
  hoursCost: number;
}

export interface AcademicDisciplinePayloadDto {
  totalHoursCount: number;
  lessonBatchInfos: LessonBatchInfoDto[];
}

export interface AcademicDisciplineViewDto {
  id?: string | null;
  name?: string | null;
  semester: number;
  academicDisciplineTargetType: AcademicDisciplineTargetType;
  lecturePayload?: AcademicDisciplinePayloadDto;
  practicePayload?: AcademicDisciplinePayloadDto;
  labPayload?: AcademicDisciplinePayloadDto;
  examPayload?: AcademicDisciplinePayloadDto;
  testPayload?: AcademicDisciplinePayloadDto;
  hasExam: boolean;
  hasTest: boolean;
  comment?: string | null;
}

export interface AcademicDisciplineRegistryItemDto {
  id: string;
  name: string;
  semesterNumber: number;
  academicDisciplineTargetType: AcademicDisciplineTargetType;
  allowedLessonTypes: AcademicDisciplineType[];
  lecturePayload?: AcademicDisciplinePayloadDto | null;
  practicePayload?: AcademicDisciplinePayloadDto | null;
  labPayload?: AcademicDisciplinePayloadDto | null;
  examPayload?: AcademicDisciplinePayloadDto | null;
  testPayload?: AcademicDisciplinePayloadDto | null;
  comment?: string | null;
}

export interface AcademicDisciplineSaveDto {
  id?: string | null;
  scheduleId: string;
  name?: string | null;
  semesterNumber: number;
  academicDisciplineTargetType: AcademicDisciplineTargetType;
  allowedLessonTypes?: AcademicDisciplineType[] | null;
  lecturePayload?: AcademicDisciplinePayloadDto | null;
  practicePayload?: AcademicDisciplinePayloadDto | null;
  labPayload?: AcademicDisciplinePayloadDto | null;
  examPayload?: AcademicDisciplinePayloadDto | null;
  testPayload?: AcademicDisciplinePayloadDto | null;
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

export interface LessonValidationMessage {
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
  validationMessages?: LessonValidationMessage[] | null;
}

export interface LessonRegistryItemDto {
  id: string;
  academicDisciplineId?: string | null;
  academicDisciplineType?: AcademicDisciplineType | null;
  studentGroupId: string;
  teacherId?: string | null;
  roomId?: string | null;
  dateWithTimeInterval?: DateWithTimeInterval | null;
  flexibilityType: LessonFlexibilityType;
  allowCombining: boolean;
  hoursCost: number;
  createdFromDiscipline: boolean;
  validationMessages: LessonValidationMessage[];
}

export interface LessonSaveDto {
  id?: string | null;
  scheduleId: string;
  academicDisciplineId?: string | null;
  academicDisciplineType?: AcademicDisciplineType | null;
  studentGroupIds: string[];
  teacherId?: string | null;
  roomId?: string | null;
  dateWithTimeInterval?: DateWithTimeInterval | null;
  flexibilityType: LessonFlexibilityType;
  allowCombining: boolean;
  hoursCost: number;
}

export interface LessonWeekItemDto {
  id: string;
  academicDisciplineId?: string | null;
  academicDisciplineType?: AcademicDisciplineType | null;
  name?: string | null;
  studentGroups: StudentGroupShortViewDto[];
  teacherId?: string | null;
  teacherName?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  dateWithTimeInterval: DateWithTimeInterval;
  flexibilityType: LessonFlexibilityType;
  allowCombining: boolean;
  currentErrorsMaxLevel?: LessonValidationErrorType | null;
}

export interface AcademicDisciplineWeekConflictDto {
  dayOfWeekTimeInterval: DayOfWeekTimeInterval;
  messages: string[];
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

export interface RoomViewDto {
  id: string;
  name?: string | null;
  campusId: string;
  roomType: RoomType;
}

export type RoomBoardType = 'Chalk' | 'Marker' | 'Both';

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

export interface StudentGroupShortViewDto {
  id: string;
  name?: string | null;
}

export interface StudentGroupViewDto {
  id: string;
  name?: string | null;
  semesterNumber: number;
  studentGroupType: StudentGroupType;
  children?: StudentGroupShortViewDto[] | null;
}

export interface StudentGroupRegistryItemDto {
  id: string;
  name: string;
  semesterNumber: number;
  studentsCount: number;
  studentGroupType: StudentGroupType;
}

export interface StudentGroupTreeItemDto {
  id: string;
  name: string;
  children: StudentGroupTreeItemDto[];
}

export interface StudentGroupSaveDto {
  id?: string | null;
  scheduleId: string;
  name: string;
  semesterNumber: number;
  studentsCount?: number;
  studentGroupType: StudentGroupType;
  parentIds?: string[];
  childIds?: string[] | null;
  semiGroupToCreateNames?: string[];
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

export interface TeacherTimeAvailabilityDto {
  teacherPreferenceType: TeacherPreferenceType;
  dayOfWeekTimeInterval: DayOfWeekTimeInterval;
}

export interface TeacherRoomPreferenceDto {
  roomId: string;
  teacherPreferenceType: TeacherPreferenceType;
}

export interface TeacherPreferencesViewDto {
  teacherTimeAvailabilities?: TeacherTimeAvailabilityDto[] | null;
  teacherRoomPreferences?: TeacherRoomPreferenceDto[] | null;
  comment?: string | null;
}

export interface TeacherPreferenceSaveDto {
  scheduleId: string;
  teacherId: string;
  teacherTimeAvailabilities?: TeacherTimeAvailabilityDto[] | null;
  teacherRoomPreferences?: TeacherRoomPreferenceDto[] | null;
  comment?: string | null;
}
