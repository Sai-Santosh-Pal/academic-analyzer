export type Role = 'student' | 'teacher' | 'parent' | 'admin'

export interface User {
  id: string
  role: Role
  name: string
  email: string
  avatarHue: number
  avatarUrl?: string
}

export interface Student {
  id: string
  userId: string
  classId: string
  rollNumber: number
  gender: 'M' | 'F'
  attendanceProfile: 'strong' | 'normal' | 'low'
  performanceProfile: 'improving' | 'stable' | 'declining'
}

export interface Teacher {
  id: string
  userId: string
  subjectIds: string[]
  classIds: string[]
  classTeacherOfIds: string[]
  workload: number
}

export interface Parent {
  id: string
  userId: string
}

export interface ParentStudentLink {
  id: string
  parentId: string
  studentId: string
  code: string
}

export interface SchoolClass {
  id: string
  name: string
  section: string
  academicYear: string
  classTeacherId: string
  subjectIds: string[]
}

export interface Subject {
  id: string
  name: string
  short: string
  color: string
}

export interface TopicMark {
  topic: string
  score: number
  max: number
}

export interface Assessment {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  title: string
  date: string // ISO date
  maxMarks: number
  term: string
  status: 'scheduled' | 'completed' | 'marked'
}

export interface Mark {
  id: string
  assessmentId: string
  studentId: string
  score: number
  topics: TopicMark[]
  enteredBy: string
}

export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface AttendanceRecord {
  id: string
  studentId: string
  classId: string
  subjectId: string
  date: string
  period: number
  status: AttendanceStatus
  markedBy: string
}

export interface Assignment {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  title: string
  description: string
  dueDate: string
  maxPoints: number
  priority: 'low' | 'medium' | 'high'
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  submittedAt: string | null
  status: 'submitted' | 'missing' | 'pending'
  score: number | null
}

export interface TimetableEntry {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  day: number // 0=Mon..6=Sun
  period: number
  startTime: string
  endTime: string
}

export type NotificationType =
  | 'deadline' | 'assessment' | 'marks' | 'attendance' | 'timetable'
  | 'intervention' | 'warning' | 'report' | 'announcement' | 'system'

export interface AppNotification {
  id: string
  userId: string
  title: string
  body: string
  type: NotificationType
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  read: boolean
  route?: string
}

export interface CalendarTask {
  id: string
  ownerId: string // studentId or teacherId
  title: string
  type: 'study' | 'homework' | 'exam' | 'personal' | 'deadline'
  date: string
  startTime: string | null
  durationMin: number
  priority: 'low' | 'medium' | 'high'
  recurring: 'none' | 'daily' | 'weekly'
  completed: boolean
  notes?: string
}

export interface Intervention {
  id: string
  classId: string
  subjectId: string
  studentId: string | null // null = whole class
  title: string
  problem: string
  plan: string[]
  startDate: string
  endDate: string
  status: 'active' | 'completed'
  createdBy: string
}

export interface InterventionResult {
  id: string
  interventionId: string
  beforeScore: number
  afterScore: number
  followUpAssessmentId: string
  measuredAt: string
}

export interface AiReport {
  id: string
  type: string
  title: string
  scopeId: string // userId or classId or 'school'
  period: string
  content: string
  createdAt: string
  authorId: string
}

export interface AiInsight {
  id: string
  scope: 'student' | 'class' | 'school'
  scopeId: string
  kind: string
  title: string
  body: string
  data: Record<string, unknown>
  createdAt: string
  dismissed?: boolean
}

export type TimelineAudience = 'teacher' | 'parent' | 'student' | 'all'

export interface SchoolTimelineEvent {
  id: string
  title: string
  detail: string
  date: string // ISO date
  audience: TimelineAudience
  createdAt: string
}

export interface DB {
  users: User[]
  students: Student[]
  teachers: Teacher[]
  parents: Parent[]
  parentLinks: ParentStudentLink[]
  classes: SchoolClass[]
  subjects: Subject[]
  assessments: Assessment[]
  marks: Mark[]
  attendance: AttendanceRecord[]
  assignments: Assignment[]
  submissions: Submission[]
  timetable: TimetableEntry[]
  notifications: AppNotification[]
  calendarTasks: CalendarTask[]
  interventions: Intervention[]
  interventionResults: InterventionResult[]
  leaves: TeacherLeave[]
  timelineEvents: SchoolTimelineEvent[]
  reports: AiReport[]
  insights: AiInsight[]
}

export type LeaveStatus = 'pending' | 'approved' | 'declined' | 'substituted'

export interface TeacherLeave {
  id: string
  teacherId: string
  date: string // ISO date
  periods: number[]
  reason: string
  status: LeaveStatus
  substituteId?: string
  createdAt: string
  resolvedAt?: string
}