// ─── Enums ────────────────────────────────────────────────────────────────────

export type AcademicDisciplineTargetType = 'General' | 'Specialized' | 'ByChoice' | 'Optional';
export type AcademicDisciplineType = 'Lecture' | 'Practice' | 'Lab';
export type DisciplineLessonRepeatType = 1 | 2 | 3 | 4;
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type LessonFlexibilityType = 'Fixed' | 'Flexible';
export type LessonValidationErrorType = 'Warning' | 'Error';
export type LessonValidationCode =
  | 'MismatchedCyphers'
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

// ─── AcademicDiscipline ───────────────────────────────────────────────────────

export interface LessonBatchInfoDto {
  studentGroupId: string;
  teacherId?: string | null;
  roomId?: string | null;
  dayOfWeekTimeIntervals?: DayOfWeekTimeInterval[] | null;
  repeatType: DisciplineLessonRepeatType;
  dateFrom: string;
  dateTo: string;
  hoursCost: number;
}

export interface AcademicDisciplinePayloadDto {
  totalHoursCount: number;
  studyWeeksCount: number;
  lessonsPerWeekCount: number;
  lessonBatchInfoDto: LessonBatchInfoDto;
}

export interface AcademicDisciplineViewDto {
  id?: string | null;
  name?: string | null;
  cypher?: string | null;
  semester: number;
  academicDisciplineTargetType: AcademicDisciplineTargetType;
  lecturePayload?: AcademicDisciplinePayloadDto;
  practicePayload?: AcademicDisciplinePayloadDto;
  labPayload?: AcademicDisciplinePayloadDto;
  hasExam: boolean;
  hasTest: boolean;
  comment?: string | null;
}

export interface SaveAcademicDisciplineDto {
  id?: string | null;
  scheduleId: string;
  name?: string | null;
  cypher?: string | null;
  semester: number;
  academicDisciplineTargetType: AcademicDisciplineTargetType;
  lecturePayload?: AcademicDisciplinePayloadDto;
  practicePayload?: AcademicDisciplinePayloadDto;
  labPayload?: AcademicDisciplinePayloadDto;
  hasExam: boolean;
  hasTest: boolean;
  comment?: string | null;
}

// ─── Campus ───────────────────────────────────────────────────────────────────

// CampusDto is empty in spec — defined as a placeholder
export interface CampusDto {
  [key: string]: unknown;
}

export interface SaveCampusDto {
  name?: string | null;
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
  academicDisciplineType: AcademicDisciplineType;
  studentGroupId: string;
  teacherId?: string | null;
  roomId?: string | null;
  dateWithTimeInterval: DateWithTimeInterval;
  flexibilityType: LessonFlexibilityType;
  hoursCost: number;
  createdFromDiscipline: boolean;
  validationMessages?: LessonValidationMessage[] | null;
}

export interface SaveLessonRequestDto {
  id?: string | null;
  scheduleId: string;
  academicDisciplineId?: string | null;
  academicDisciplineType: AcademicDisciplineType;
  studentGroupId: string;
  teacherId?: string | null;
  roomId?: string | null;
  dateWithTimeInterval: DateWithTimeInterval;
  flexibilityType: LessonFlexibilityType;
  hoursCost: number;
}

export interface LessonWeekConflictDto {
  dayOfWeekTimeInterval: DayOfWeekTimeInterval;
  message?: string | null;
}

// ─── Room ─────────────────────────────────────────────────────────────────────

// RoomTreeDto is empty in spec — defined as a placeholder
export interface RoomTreeDto {
  [key: string]: unknown;
}

export interface RoomViewDto {
  id: string;
  name?: string | null;
  campusId: string;
  roomType: RoomType;
}

export interface SaveRoomDto {
  name?: string | null;
  campusId: string;
  roomType: RoomType;
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

// ScheduleDto is empty in spec — defined as a placeholder
export interface ScheduleDto {
  [key: string]: unknown;
}

export interface SaveScheduleDto {
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
  cypher?: string | null;
  children?: StudentGroupShortViewDto[] | null;
}

export interface SaveStudentGroupDto {
  id?: string | null;
  scheduleId: string;
  name?: string | null;
  semesterNumber: number;
  studentGroupType: StudentGroupType;
  cypher?: string | null;
  parentId?: string | null;
  childIds?: string[] | null;
}

// ─── Teacher ─────────────────────────────────────────────────────────────────

export interface TeacherViewDto {
  id: string;
  fullname?: string | null;
  contacts?: string | null;
}

export interface SaveTeacherDto {
  fullname?: string | null;
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

export interface SaveTeacherPreferenceDto {
  scheduleId: string;
  teacherId: string;
  teacherTimeAvailabilities?: TeacherTimeAvailabilityDto[] | null;
  teacherRoomPreferences?: TeacherRoomPreferenceDto[] | null;
  comment?: string | null;
}
