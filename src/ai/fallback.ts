import { DB } from '../data/types'
import {
  detectStudentChanges, subjectTrend, subjectAvg, overallAvg, attendanceStats, assignmentStats,
  classAverage, classPulse, classSubjectAverage,
  earlyWarningFlags, whatChangedClass, whatChangedSchool, schoolStats, subjectPerformanceSchool,
  teacherWorkload, subjectName, assessmentClassStats, studentName, className, subjectSeries,
  strengthMap, classOf, studentOf, linkedChildren, assessmentSubjectTrend, studentAssignments,
  allInterventionImpact,
} from '../data/stats'
import { addDays, todayISO, formatHuman } from '../utils/date'

export interface AIStudyItem { subject: string; minutes: number; activity: string }
export interface AIStudyDay { label: string; items: AIStudyItem[] }
export interface AIResult {
  title: string
  summary: string
  sections: { heading: string; points: string[] }[]
  recommendations: string[]
  stats: { label: string; value: string }[]
  plan?: AIStudyDay[]
  estimate?: boolean
}

const pctWord = (d: number) => (d > 0 ? `improved ${Math.abs(d)} points` : d < 0 ? `declined ${Math.abs(d)} points` : 'remained stable')

// ---------------- Student ----------------

export function studentInvestigation(db: DB, studentId: string): AIResult {
  const name = studentName(db, studentId)
  const changes = detectStudentChanges(db, studentId)
  const sig = changes.filter((c) => c.significant)
  const att = attendanceStats(db, studentId)
  const asg = assignmentStats(db, studentId)
  const overall = overallAvg(db, studentId)

  const where = sig.length ? sig : changes.slice(0, 2)
  const sections = where.map((c) => ({
    heading: c.subjectName,
    points: [
      `${c.subjectName} ${pctWord(c.delta)} (${c.prev}% → ${c.recent}%).`,
      'Performance is broadly consistent.',
      `Subject attendance is ${Math.abs(c.attendanceDelta) <= 3 ? 'stable' : c.attendanceDelta > 0 ? `up ${Math.round(c.attendanceDelta)} points` : `down ${Math.round(Math.abs(c.attendanceDelta))} points`}.`,
    ],
  }))

  const patterns: string[] = []
  if (att.pct >= 90) patterns.push(`Attendance remains strong at ${att.pct}%, so changes are concentrated in academic performance rather than attendance.`)
  else if (att.pct < 85) patterns.push(`Attendance is ${att.pct}% — below the 90% benchmark. This correlates with the recent change.`)
  else patterns.push(`Attendance is ${att.pct}%.`)
  if (asg.missing > 0) patterns.push(`${asg.missing} assignment(s) remain missing, which can amplify knowledge gaps.`)
  if (asg.completion >= 85) patterns.push('Assignment completion is strong.')

  return {
    title: `Performance investigation — ${name}`,
    summary: overall !== null
      ? `${name}'s overall average is ${Math.round(overall)}%. ${sig.length ? `${sig.length} significant change(s) detected.` : 'No significant change detected in recent assessments.'} ${patterns[0] ?? ''}`
      : 'No assessment data available yet.',
    sections,
    recommendations: [
      sig.length ? `Prioritise revision in ${sig[0].subjectName} over the next 3 days.` : 'Maintain the current study routine and complete assignments on time.',
      att.pct < 90 ? 'Aim to restore attendance to 90%+ over the next two weeks.' : 'Keep attendance consistent.',
      asg.missing > 0 ? 'Clear pending assignments before the next assessment cycle.' : 'Continue submitting assignments on time.',
    ],
    stats: [
      { label: 'Overall', value: overall !== null ? `${Math.round(overall)}%` : '—' },
      { label: 'Attendance', value: `${att.pct}%` },
      { label: 'Assignments', value: `${asg.completion}% complete` },
      ...changes.slice(0, 3).map((c) => ({ label: c.subjectName, value: `${c.recent}% (${c.delta >= 0 ? '+' : ''}${c.delta})` })),
    ],
  }
}

export function studyPlan(db: DB, studentId: string, hoursPerDay: number, days: number, examSubjectId?: string): AIResult {
  const s = studentOf(db, studentId)!
  const cls = classOf(db, studentId)!
  const subjects = cls.subjectIds
  const strengths = strengthMap(db, studentId)
  const weak = [...strengths].sort((a, b) => a.avg - b.avg)

  const minutes = Math.round(hoursPerDay * 60)
  const plan: AIStudyDay[] = []
  for (let d = 0; d < Math.min(days, 14); d++) {
    const items: AIStudyItem[] = []
    let budget = minutes
    const target = examSubjectId ? [examSubjectId, ...subjects.filter((x) => x !== examSubjectId)].slice(0, 3) : [weak[0]?.subjectId, weak[1]?.subjectId, weak[2]?.subjectId, weak[3]?.subjectId].filter(Boolean)
    for (const sid of target) {
      if (budget <= 15) break
      const share = Math.min(Math.round(budget * 0.45), budget)
      const subj = db.subjects.find((x) => x.id === sid)!
      const activity = d === 0 ? 'Concept recap + notes review' : d % 2 === 0 ? 'Practice questions' : 'Past-paper problems + error review'
      items.push({ subject: subj.name, minutes: Math.round(share / 5) * 5, activity })
      budget -= share
    }
    if (budget >= 20) items.push({ subject: 'Active recall', minutes: budget, activity: 'Flashcards / self-quiz' })
    plan.push({ label: d === 0 ? 'Today' : `Day ${d + 1}`, items })
  }

  const weakNames = weak.slice(0, 2).map((w) => w.name).join(' and ')
  return {
    title: 'Personal study plan',
    summary: `A ${days}-day plan at ${hoursPerDay}h per day, prioritising ${weakNames || 'your subjects'}. Built from your recent assessment data.`,
    sections: [
      { heading: 'Priority subjects', points: weak.slice(0, 3).map((w) => `${w.name} — ${w.avg}% average` + (w.dir !== 'stable' ? ` (${w.dir})` : '')) },
    ],
    recommendations: [
      'Start each session with the weakest subject while focus is highest.',
      'Use the last 10 minutes to self-test instead of re-reading notes.',
      'Sleep well before the exam — recall beats last-minute cramming.',
    ],
    stats: [
      { label: 'Daily budget', value: `${minutes} min` },
      { label: 'Plan length', value: `${days} days` },
      { label: 'Focus areas', value: `${weak.slice(0, 3).length} subjects` },
    ],
    plan,
    estimate: true,
  }
}

export function whatIfScenario(db: DB, studentId: string, hoursPerDay: number, days: number): AIResult {
  const strengths = strengthMap(db, studentId).sort((a, b) => a.avg - b.avg)
  const total = Math.round(hoursPerDay * days)
  const weak = strengths[0]
  const mid = strengths[1] ?? strengths[0]
  const strong = strengths[strengths.length - 1] ?? strengths[0]
  const alloc: AIStudyItem[] = [
    { subject: weak.name, minutes: Math.round(hoursPerDay * 60 * 0.5 / 5) * 5, activity: 'Weakest subject — half the daily time' },
    { subject: mid.name, minutes: Math.round(hoursPerDay * 60 * 0.3 / 5) * 5, activity: 'Improving subject — consolidation' },
    { subject: strong.name, minutes: Math.round(hoursPerDay * 60 * 0.2 / 5) * 5, activity: 'Strong subject — maintenance' },
  ]
  const focusHrs = Math.round(weak.avg < 60 ? hoursPerDay * days * 0.5 : hoursPerDay * days * 0.35)
  return {
    title: 'What-if study scenario',
    summary: `If you study ${hoursPerDay}h per day for ${days} days (${total}h total), this allocation focuses on your weakest area: ${weak.name} (${weak.avg}%).`,
    sections: [
      { heading: 'Suggested allocation', points: alloc.map((a) => `${a.subject}: ${a.minutes} min/day — ${a.activity}`) },
      { heading: 'Expected benefit', points: [`≈ ${focusHrs} hours directed at ${weak.name}`, 'Consistent daily practice typically stabilises scores in the weakest subject', 'Attendance and assignment completion remain the most reliable levers'] },
    ],
    recommendations: [
      'Re-evaluate after 5 days and reallocate if a subject improves.',
      'Track daily completion in the calendar to stay accountable.',
    ],
    stats: [
      { label: 'Total hours', value: `${total}h` },
      { label: 'Weakest subject', value: weak.name },
      { label: 'Focus time', value: `${focusHrs}h on ${weak.name}` },
    ],
    estimate: true,
  }
}

export function copilotAction(db: DB, studentId: string, action: string): AIResult {
  const name = studentName(db, studentId)
  const map: Record<string, () => AIResult> = {
    analyze_test: () => {
      const series = strengthMap(db, studentId).map((s) => ({ ...s, series: subjectSeries(db, studentId, s.subjectId) }))
      const latest = series.map((s) => ({ name: s.name, pct: s.series[s.series.length - 1]?.pct ?? null })).filter((x) => x.pct !== null)
      return {
        title: 'Latest test analysis',
        summary: latest.length ? `Your most recent scores: ${latest.map((l) => `${l.name} ${l.pct}%`).join(', ')}.` : 'No completed tests yet.',
        sections: series.map((s) => ({ heading: s.name, points: [`Latest: ${s.series[s.series.length - 1]?.pct ?? '—'}%`, `Trend: ${s.dir} (${s.delta >= 0 ? '+' : ''}${s.delta})`] })),
        recommendations: ['Review errors from the last test within 48 hours.', 'Re-attempt the questions you missed without looking at the solution.'],
        stats: [{ label: 'Student', value: name }],
      }
    },
    explain_weak: () => studentInvestigation(db, studentId),
    recovery_plan: () => studyPlan(db, studentId, 2, 7),
    study_today: () => studyPlan(db, studentId, 2, 1),
    prepare_next: () => {
      const s = studentOf(db, studentId)!
      const next = db.assessments.filter((a) => a.classId === s.classId && a.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date))[0]
      return next ? studyPlan(db, studentId, 2, Math.max(1, Math.min(7, Math.round((new Date(next.date).getTime() - Date.now()) / 86400000))), next.subjectId) : studyPlan(db, studentId, 2, 7)
    },
    compare_progress: () => {
      const changes = detectStudentChanges(db, studentId)
      return {
        title: 'Progress comparison',
        summary: changes.length ? `Recent changes: ${changes.map((c) => `${c.subjectName} ${c.delta >= 0 ? '+' : ''}${c.delta} points`).join(', ')}.` : 'No recent changes detected.',
        sections: changes.map((c) => ({ heading: c.subjectName, points: [`${c.prev}% → ${c.recent}%`, pctWord(c.delta)] })),
        recommendations: changes.filter((c) => c.delta < 0).map((c) => `Review ${c.subjectName} next.`),
        stats: [{ label: 'Subjects analysed', value: String(changes.length) }],
      }
    },
  }
  return map[action]?.() ?? studentInvestigation(db, studentId)
}

export function weeklySummary(db: DB, studentId: string): AIResult {
  const name = studentName(db, studentId)
  const changes = detectStudentChanges(db, studentId)
  const att = attendanceStats(db, studentId)
  const asg = assignmentStats(db, studentId)
  const strong = strengthMap(db, studentId)
  const weakest = strong[strong.length - 1]
  const strongest = strong[0]
  const decl = changes.find((c) => c.delta < 0)
  return {
    title: `Weekly summary — ${name}`,
    summary: [
      decl ? `${name}'s ${decl.subjectName} performance declined recently (${decl.delta} points).` : `${name}'s performance is stable this week.`,
      strongest ? `${strongest.name} is the strongest subject (${strongest.avg}%).` : '',
      weakest && weakest !== strongest ? `${weakest.name} needs attention (${weakest.avg}%).` : '',
      `Attendance is ${att.pct}%.`,
      asg.pending + asg.missing > 0 ? `${asg.pending + asg.missing} assignment(s) pending or missing.` : 'All assignments are complete.',
    ].filter(Boolean).join(' '),
    sections: [
      { heading: 'Highlights', points: [`Strengths: ${strong.slice(0, 2).map((s) => `${s.name} ${s.avg}%`).join(', ')}`, `Focus: ${weakest?.name ?? '—'} (${weakest?.avg ?? 0}%)`] },
    ],
    recommendations: [
      decl ? `Plan a short revision block for ${decl.subjectName}.` : 'Continue the current routine.',
      asg.pending + asg.missing > 0 ? 'Finish pending assignments before the weekend.' : 'Keep up the submission streak.',
    ],
    stats: [
      { label: 'Attendance', value: `${att.pct}%` },
      { label: 'Assignments', value: `${asg.completion}%` },
      { label: 'Weakest', value: weakest?.name ?? '—' },
    ],
  }
}

export function parentReport(db: DB, studentId: string): AIResult {
  const r = weeklySummary(db, studentId)
  const s = studentOf(db, studentId)!
  const cls = classOf(db, studentId)!
  r.title = `Academic report — ${studentName(db, studentId)} (${cls.name} ${cls.section})`
  r.stats.push({ label: 'Class', value: `${cls.name} ${cls.section}` })
  return r
}

export function parentUpdateDraft(db: DB, studentId: string): AIResult {
  const name = studentName(db, studentId)
  const changes = detectStudentChanges(db, studentId)
  const att = attendanceStats(db, studentId)
  const asg = assignmentStats(db, studentId)
  const decl = changes.find((c) => c.delta < 0)
  return {
    title: `Parent update draft — ${name}`,
    summary: [
      `${name}'s ${decl ? `${decl.subjectName} performance has declined recently (${decl.delta} points).` : 'academic performance is progressing well.'}`,
      `Attendance is ${att.pct}%.`,
      asg.missing > 0 ? `${asg.missing} assignment(s) remain incomplete.` : 'Assignments are being completed on time.',
      'We recommend a short focused revision plan and a follow-up assessment.',
    ].filter(Boolean).join(' '),
    sections: [],
    recommendations: ['Review before sending — this draft is teacher-edited.', 'Only send after you confirm the facts above.'],
    stats: [
      { label: 'Attendance', value: `${att.pct}%` },
      { label: 'Missing work', value: String(asg.missing) },
    ],
  }
}

// ---------------- Teacher / class ----------------

export function classAnalysis(db: DB, classId: string): AIResult {
  const cls = db.classes.find((c) => c.id === classId)!
  const pulse = classPulse(db, classId)
  const subjects = classSubjectAverage(db, classId)
  const best = subjects[0]
  const worst = subjects[subjects.length - 1]
  const attStudents = db.students.filter((s) => s.classId === classId)
  const lowAtt = attStudents.filter((s) => attendanceStats(db, s.id).pct < 88).length
  return {
    title: `${cls.name} ${cls.section} — class analysis`,
    summary: `${cls.name}-${cls.section} has ${pulse.improving} improving, ${pulse.stable} stable and ${pulse.declining} declining students. Class average is ${pulse.avg}%. ${best ? `${best.name} is the strongest subject (${best.avg}%).` : ''} ${worst ? `${worst.name} needs attention (${worst.avg}%).` : ''}`,
    sections: [
      ...(lowAtt ? [{ heading: 'Attendance', points: [`${lowAtt} students below 88% attendance`] }] : []),
    ],
    recommendations: [
      worst ? `Schedule a review session for ${worst.name}.` : 'Maintain current teaching rhythm.',
      lowAtt ? 'Flag low-attendance students for a check-in.' : '',
    ].filter(Boolean),
    stats: [
      { label: 'Class average', value: `${pulse.avg}%` },
      { label: 'Improving', value: String(pulse.improving) },
      { label: 'Declining', value: String(pulse.declining) },
      { label: 'Low attendance', value: String(lowAtt) },
    ],
  }
}

export function interventionGenerator(db: DB, subjectId: string, topic: string, problem: string): AIResult {
  const subj = db.subjects.find((x) => x.id === subjectId)!
  return {
    title: `Intervention: ${subj.name} — ${topic}`,
    summary: `A 3-day structured intervention targeting ${topic} in ${subj.name}, addressing: ${problem}`,
    sections: [
      { heading: 'Revision activity', points: [`Day 1 — Concept recap: ${topic} core ideas with worked examples`, `Day 2 — Guided practice: 15 graded problems increasing in difficulty`, `Day 3 — Error review: revisit mistakes with a partner`] },
      { heading: 'Diagnostic', points: ['10-question short diagnostic on Day 3 (15 minutes)', 'Follow-up assessment within 5 days to measure impact'] },
    ],
    recommendations: [
      'Publish the plan to the student so progress is visible.',
      'Schedule the follow-up quiz before the next unit test.',
    ],
    stats: [
      { label: 'Subject', value: subj.name },
      { label: 'Topic', value: topic },
      { label: 'Duration', value: '3 days' },
    ],
    plan: [
      { label: 'Day 1', items: [{ subject: subj.name, minutes: 45, activity: `Concept recap: ${topic}` }] },
      { label: 'Day 2', items: [{ subject: subj.name, minutes: 45, activity: `Guided practice: ${topic}` }] },
      { label: 'Day 3', items: [{ subject: subj.name, minutes: 40, activity: `Diagnostic + error review: ${topic}` }] },
    ],
  }
}

export function lessonPlan(db: DB, subjectId: string, topic: string, durationMin: number): AIResult {
  const subj = db.subjects.find((x) => x.id === subjectId)!
  const mins = [Math.round(durationMin * 0.15), Math.round(durationMin * 0.4), Math.round(durationMin * 0.3), Math.round(durationMin * 0.15)]
  return {
    title: `Lesson plan — ${subj.name}: ${topic}`,
    summary: `A ${durationMin}-minute lesson on ${topic} for ${subj.name}, structured for engagement and assessment.`,
    sections: [
      { heading: 'Learning objectives', points: [`Explain core ideas of ${topic}`, `Apply ${topic} to standard problems`, `Identify and correct common misconceptions`] },
      { heading: 'Structure', points: [`Opening (${mins[0]} min): hook question + recall of prior knowledge`, `Core (${mins[1]} min): ${topic} with worked examples and guided practice`, `Activity (${mins[2]} min): pair problem-solving + misconception check`, `Closing (${mins[3]} min): quick assessment + exit ticket`] },
      { heading: 'Practice questions', points: ['3 basic recall questions', '3 application questions', '1 extension question'] },
    ],
    recommendations: ['Use the exit-ticket results to decide whether to revisit the topic.'],
    stats: [
      { label: 'Subject', value: subj.name },
      { label: 'Topic', value: topic },
      { label: 'Duration', value: `${durationMin} min` },
    ],
  }
}

export function assessmentAnalysis(db: DB, assessmentId: string): AIResult {
  const asm = db.assessments.find((a) => a.id === assessmentId)
  if (!asm) return { title: 'Assessment', summary: 'Not found.', sections: [], recommendations: [], stats: [] }
  const s = assessmentClassStats(db, assessmentId)
  if (!s) return { title: asm.title, summary: 'No marks entered yet.', sections: [], recommendations: [], stats: [] }
  const support = db.marks.filter((m) => m.assessmentId === assessmentId && (m.score / asm.maxMarks) * 100 < 55).length
  return {
    title: `Assessment analysis — ${asm.title}`,
    summary: `${subjectName(db, asm.subjectId)} ${asm.title}: class average ${s.avg}%, median ${s.median}%. ${s.max - s.min} points separate top and bottom.`,
    sections: [
      { heading: 'Score distribution', points: [`<40%: ${s.buckets[0]} students`, `40–55%: ${s.buckets[1]}`, `55–70%: ${s.buckets[2]}`, `70–85%: ${s.buckets[3]}`, `85%+: ${s.buckets[4]}`] },
    ],
    recommendations: [
      'Distribute results and review the most missed questions.',
      support > 0 ? `${support} student(s) may need additional support (below 55%).` : 'No students below the support threshold.',
    ],
    stats: [
      { label: 'Average', value: `${s.avg}%` },
      { label: 'Median', value: `${s.median}%` },
      { label: 'Highest', value: `${s.max}%` },
      { label: 'Lowest', value: `${s.min}%` },
    ],
  }
}

// ---------------- Admin / school ----------------

export function schoolIntelligence(db: DB): AIResult {
  const stats = schoolStats(db)
  const subjects = subjectPerformanceSchool(db).sort((a, b) => b.avg - a.avg)
  const schoolChanges = whatChangedSchool(db)
  const worstClass = [...schoolChanges].sort((a, b) => a.avg - b.avg)[0]
  const bestClass = [...schoolChanges].sort((a, b) => b.avg - a.avg)[0]
  const flags = earlyWarningFlags(db)
  const flagsByClass = new Map<string, number>()
  for (const f of flags) {
    const c = studentOf(db, f.studentId)?.classId ?? 'x'
    flagsByClass.set(c, (flagsByClass.get(c) ?? 0) + 1)
  }
  const attTrend = schoolStats(db).avgAttendance
  const weakest = subjects[subjects.length - 1]
  const biggestGain = [...schoolChanges].sort((a, b) => b.delta - a.delta)[0]
  return {
    title: 'School intelligence report',
    summary: [
      `Overall academic performance is ${stats.avgPerformance}% across ${stats.students} students.`,
      `Average attendance is ${stats.avgAttendance}%.`,
      `Assignment completion is ${stats.avgAssignmentCompletion}%.`,
      `${flags.length} student(s) currently require attention.`,
    ].join(' '),
    sections: [
      { heading: 'Subject performance', points: subjects.map((s) => `${s.name}: ${s.avg}%`) },
      { heading: 'Class comparison', points: schoolChanges.map((c) => `${c.className}: ${c.avg}% (${c.delta >= 0 ? '+' : ''}${c.delta})`) },
      { heading: 'Requiring attention', points: flags.slice(0, 5).map((f) => `${studentName(db, f.studentId)} (${className(db, studentOf(db, f.studentId)?.classId ?? '')}) — ${f.reasons.join('; ')}`) },
    ],
    recommendations: [
      weakest ? `Focus teacher support on ${weakest.name} — the weakest subject.` : '',
      worstClass ? `${worstClass.className} has the lowest average (${worstClass.avg}%). Schedule a class-level review.` : '',
      biggestGain && biggestGain.delta > 0 ? `Recognise the improvement in ${biggestGain.className} (+${biggestGain.delta} points).` : '',
      stats.avgAttendance < 90 ? 'Launch an attendance initiative — attendance is below 90%.' : 'Attendance is healthy.',
    ].filter(Boolean),
    stats: [
      { label: 'Students', value: String(stats.students) },
      { label: 'Avg performance', value: `${stats.avgPerformance}%` },
      { label: 'Avg attendance', value: `${stats.avgAttendance}%` },
      { label: 'Flagged', value: String(stats.flaggedStudents) },
    ],
  }
}

export function reportGenerator(db: DB, type: string, scopeId: string | null, period: string): AIResult {
  const base = type === 'school' ? schoolIntelligence(db) : type === 'class' && scopeId ? classAnalysis(db, scopeId) : type === 'student' && scopeId ? parentReport(db, scopeId) : type === 'assessment' && scopeId ? assessmentAnalysis(db, scopeId) : schoolIntelligence(db)
  base.title = `${type[0].toUpperCase() + type.slice(1)} report — ${period}`
  return base
}

export function standardPrompt(result: AIResult, extra?: string): string {
  return JSON.stringify({ ...result, note: extra ?? '' })
}

export function aiResultFrom(db: DB, kind: string, params: Record<string, string | number | boolean>): AIResult {
  switch (kind) {
    case 'student_investigation': return studentInvestigation(db, String(params.studentId))
    case 'study_plan': return studyPlan(db, String(params.studentId), Number(params.hoursPerDay) || 2, Number(params.days) || 7, params.subjectId ? String(params.subjectId) : undefined)
    case 'what_if': return whatIfScenario(db, String(params.studentId), Number(params.hoursPerDay) || 2, Number(params.days) || 10)
    case 'copilot': return copilotAction(db, String(params.studentId), String(params.action))
    case 'weekly_summary': return weeklySummary(db, String(params.studentId))
    case 'parent_report': return parentReport(db, String(params.studentId))
    case 'parent_update': return parentUpdateDraft(db, String(params.studentId))
    case 'class_analysis': return classAnalysis(db, String(params.classId))
    case 'intervention': return interventionGenerator(db, String(params.subjectId), String(params.topic), String(params.problem))
    case 'lesson_plan': return lessonPlan(db, String(params.subjectId), String(params.topic), Number(params.duration) || 45)
    case 'assessment_analysis': return assessmentAnalysis(db, String(params.assessmentId))
    case 'school_intelligence': return schoolIntelligence(db)
    case 'report': return reportGenerator(db, String(params.reportType), params.scopeId ? String(params.scopeId) : null, String(params.period))
    default: return schoolIntelligence(db)
  }
}