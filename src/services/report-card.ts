import { DB } from '@/data/types'
import {
  classOf, overallAvg, gradeFor, attendanceStats,
  subjectSeries, subjectTrend,
} from '@/data/stats'

export interface ReportCardData {
  fileName: string
  pdf: string
}

const PRIMARY = '#097FE8'
const INK = '#000000'
const MUTED = '#78736F'
const LIGHT = '#EBEBEB'
const CREAM = '#FCF8F5'
const LIGHT_CREAM = '#FFF5ED'
const PRIMARY_SOFT = '#E6F2FD'
const SUCCESS_SOFT = '#E5F2F1'
const WARNING_SOFT = '#FFF5E0'
const BAND_BG = '#0075DE'
const BAND_SUB = '#E6F2FD'
const TREND_DOWN = '#F64932'
const TREND_UP = '#27918D'

export function buildReportCardData(db: DB, studentId: string, schoolName: string, period = 'Term 1 · 2026–27'): ReportCardData {
  const student = db.students.find((s) => s.id === studentId)!
  const u = db.users.find((x) => x.id === student.userId)!
  const cls = classOf(db, studentId)!
  const overall = overallAvg(db, studentId)
  const att = attendanceStats(db, studentId)
  const g = overall !== null ? gradeFor(overall) : { grade: '—', points: 0 }
  const subjects = cls.subjectIds.map((sid) => db.subjects.find((x) => x.id === sid)!).filter(Boolean)

  const blocks: { rects?: any[]; texts?: any[]; lines?: any[] }[] = []

  // Header band
  blocks.push({
    rects: [{ x: 0, y: 0, w: 595, h: 130, color: BAND_BG }],
    texts: [
      { x: 595 / 2, y: 46, s: schoolName.toUpperCase(), size: 20, bold: true, color: '#FFFFFF', align: 'center' },
      { x: 595 / 2, y: 68, s: 'Academic Progress Report Card', size: 12, color: BAND_SUB, align: 'center' },
      { x: 595 / 2, y: 90, s: period, size: 10, color: BAND_SUB, align: 'center' },
    ],
  })

  // Student info
  blocks.push({
    rects: [{ x: 40, y: 158, w: 515, h: 74, color: CREAM }],
    lines: [{ x1: 40, y1: 158, x2: 555, y2: 158, color: PRIMARY, width: 2 }],
    texts: [
      { x: 56, y: 182, s: 'STUDENT', size: 8, color: MUTED },
      { x: 56, y: 200, s: u.name, size: 14, bold: true, color: INK },
      { x: 320, y: 182, s: 'CLASS', size: 8, color: MUTED },
      { x: 320, y: 200, s: `${cls.name} ${cls.section}`, size: 13, bold: true, color: INK },
      { x: 430, y: 182, s: 'ROLL NO.', size: 8, color: MUTED },
      { x: 430, y: 200, s: String(student.rollNumber), size: 13, bold: true, color: INK },
    ],
  })

  // Performance summary
  blocks.push({
    rects: [
      { x: 40, y: 250, w: 165, h: 74, color: overall !== null && overall >= 70 ? SUCCESS_SOFT : WARNING_SOFT },
      { x: 223, y: 250, w: 165, h: 74, color: PRIMARY_SOFT },
      { x: 406, y: 250, w: 149, h: 74, color: LIGHT_CREAM },
    ],
    texts: [
      { x: 56, y: 274, s: 'OVERALL %', size: 8, color: MUTED },
      { x: 56, y: 298, s: overall !== null ? `${Math.round(overall)}%` : '—', size: 22, bold: true, color: INK },
      { x: 239, y: 274, s: 'GRADE', size: 8, color: MUTED },
      { x: 239, y: 298, s: g.grade, size: 22, bold: true, color: PRIMARY },
      { x: 422, y: 274, s: 'ATTENDANCE', size: 8, color: MUTED },
      { x: 422, y: 298, s: `${att.pct}%`, size: 20, bold: true, color: INK },
    ],
  })

  // Subject table
  const tableTop = 356
  const rowH = 34
  blocks.push({
    rects: [
      { x: 40, y: tableTop, w: 515, h: 30, color: PRIMARY },
      { x: 40, y: tableTop + 30, w: 515, h: 4, color: '#0075DE' },
    ],
    texts: [
      { x: 56, y: tableTop + 19, s: 'SUBJECT', size: 9, bold: true, color: '#FFFFFF' },
      { x: 300, y: tableTop + 19, s: 'LATEST', size: 9, bold: true, color: '#FFFFFF' },
      { x: 386, y: tableTop + 19, s: 'TREND', size: 9, bold: true, color: '#FFFFFF' },
      { x: 480, y: tableTop + 19, s: 'GRADE', size: 9, bold: true, color: '#FFFFFF' },
    ],
  })
  subjects.forEach((subj, i) => {
    const series = subjectSeries(db, studentId, subj.id)
    const t = subjectTrend(db, studentId, subj.id)
    const latest = series.length ? series[series.length - 1].pct : null
    const y = tableTop + 30 + 16 + i * rowH
    const bg = i % 2 === 0 ? '#FFFFFF' : CREAM
    blocks.push({
      rects: [{ x: 40, y: tableTop + 30 + i * rowH, w: 515, h: rowH, color: bg }],
      lines: [{ x1: 40, y1: y + 12, x2: 555, y2: y + 12, color: LIGHT, width: 0.6 }],
      texts: [
        { x: 56, y, s: subj.name, size: 11, bold: true, color: INK },
        { x: 300, y, s: latest !== null ? `${Math.round(latest)}%` : '—', size: 11, bold: true, color: INK },
        { x: 386, y, s: t.dir === 'improving' ? `▲ +${Math.round(t.delta)}` : t.dir === 'declining' ? `▼ ${Math.round(t.delta)}` : '→ 0', size: 11, bold: true, color: t.dir === 'declining' ? TREND_DOWN : t.dir === 'improving' ? TREND_UP : MUTED },
        { x: 480, y, s: latest !== null ? gradeFor(latest).grade : '—', size: 11, bold: true, color: PRIMARY },
      ],
    })
  })

  // Teacher remarks
  const focusY = tableTop + 30 + subjects.length * rowH + 40
  blocks.push({
    texts: [
      { x: 40, y: focusY - 20, s: 'TEACHER REMARKS', size: 8, color: MUTED },
      {
        x: 40, y: focusY, s: 'Performance is being tracked across all subjects. Keep up the good work!',
        size: 11, color: INK,
      },
      { x: 40, y: focusY + 60, s: 'Generated from verified school records. AI assistance is reviewed by teachers before publication.', size: 8, color: MUTED },
    ],
  })

  const pdf = buildPdf(blocks)
  return { fileName: `${u.name.replace(/\s+/g, '_')}_Report_Card.pdf`, pdf }
}

// re-export the pdf builder (kept here for tree-shaking friendliness)
import { buildReportCardPdf as buildPdf } from './pdf'