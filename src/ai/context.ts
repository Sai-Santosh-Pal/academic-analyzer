import { DB } from '../data/types'
import { AIRequest } from './client'
import {
  detectStudentChanges, strengthMap, attendanceStats, assignmentStats, overallAvg,
  classAverage, classPulse, classSubjectAverage,
  earlyWarningFlags, whatChangedClass, whatChangedSchool,
  schoolStats, subjectPerformanceSchool, assessmentClassStats, studentName,
  className, classOf, studentOf, upcomingAssessments, weeklySummaryData,
} from '../data/stats'
import { todayISO } from '../utils/date'

/** Builds a compact, structured academic context snapshot. All numbers are computed by the app. */
export function aiContext(db: DB, req: AIRequest): string {
  const p = req.params
  const out: Record<string, unknown> = {
    generated_at: todayISO(),
    note: 'All statistics below were computed by the application and are authoritative.',
  }

  if (req.role === 'student' || (p.studentId && req.role !== 'admin')) {
    const sid = String(p.studentId ?? '')
    const s = studentOf(db, sid)
    if (s) {
      const cls = classOf(db, sid)
      out.student = { id: sid, name: studentName(db, sid), class: cls ? `${cls.name} ${cls.section}` : '' }
      out.performance = strengthMap(db, sid).map((x) => ({ subject: x.name, avg: x.avg, trend: x.dir, delta: x.delta }))
      out.changes = detectStudentChanges(db, sid).map((c) => ({
        subject: c.subjectName, prev: c.prev, recent: c.recent, delta: c.delta,
        significant: c.significant, attendance_delta: c.attendanceDelta,
      }))
      out.overall = overallAvg(db, sid) !== null ? Math.round(overallAvg(db, sid)!) : null
      out.attendance = { overall: `${attendanceStats(db, sid).pct}%`, present: attendanceStats(db, sid).present, absent: attendanceStats(db, sid).absent, late: attendanceStats(db, sid).late }
      out.assignments = assignmentStats(db, sid)
      out.upcoming = upcomingAssessments(db, s.classId).slice(0, 4).map((a) => ({ subject: db.subjects.find((x) => x.id === a.subjectId)?.name, title: a.title, date: a.date }))
    }
  }

  if (req.role === 'teacher' && p.classId) {
    const cid = String(p.classId)
    const cls = db.classes.find((c) => c.id === cid)
    if (cls) {
      out.class = { id: cid, name: `${cls.name} ${cls.section}`, students: db.students.filter((s) => s.classId === cid).length }
      out.class_average = classAverage(db, cid)
      out.class_pulse = classPulse(db, cid)
      out.subjects = classSubjectAverage(db, cid)
      out.what_changed = whatChangedClass(db, cid)
    }
  }

  if (req.role === 'parent' && p.studentId) {
    out.summary_week = weeklySummaryData(db, String(p.studentId))
  }

  if (req.role === 'admin' || req.kind === 'school_intelligence' || req.kind === 'report') {
    out.school = schoolStats(db)
    out.subject_performance = subjectPerformanceSchool(db)
    out.what_changed_school = whatChangedSchool(db)
    out.flagged_students = earlyWarningFlags(db).slice(0, 8).map((f) => ({ student: studentName(db, f.studentId), class: className(db, studentOf(db, f.studentId)?.classId ?? ''), reasons: f.reasons }))
  }

  if (p.assessmentId) {
    const a = db.assessments.find((x) => x.id === p.assessmentId)
    if (a) {
      out.assessment = {
        title: a.title, subject: db.subjects.find((x) => x.id === a.subjectId)?.name,
        date: a.date, max_marks: a.maxMarks,
        stats: assessmentClassStats(db, a.id),
      }
    }
  }

  if (p.hoursPerDay) out.scenario = { hours_per_day: p.hoursPerDay, days: p.days ?? 10 }
  if (p.subjectId) out.subject = db.subjects.find((x) => x.id === p.subjectId)?.name
  if (p.topic) out.topic = p.topic
  if (p.problem) out.problem = p.problem
  if (p.duration) out.duration_min = p.duration

  return JSON.stringify(out, null, 1)
}