import { DB, Subject, SchoolClass, Teacher, Student, Parent, User, ParentStudentLink } from './types'
import { addDays, todayISO, schoolDaysBetween, toISO } from '../utils/date'

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260816)
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

const SUBJECTS: Subject[] = [
  { id: 'sub_math', name: 'Mathematics', short: 'Math', color: '#0A84FF' },
  { id: 'sub_phy', name: 'Physics', short: 'Phy', color: '#0066CC' },
  { id: 'sub_chem', name: 'Chemistry', short: 'Chem', color: '#1F9D5C' },
  { id: 'sub_bio', name: 'Biology', short: 'Bio', color: '#E8930C' },
  { id: 'sub_eng', name: 'English', short: 'Eng', color: '#4DB1FF' },
  { id: 'sub_cs', name: 'Computer Science', short: 'CS', color: '#F5A623' },
  { id: 'sub_hindi', name: 'Hindi', short: 'Hindi', color: '#005BB5' },
  { id: 'sub_evs', name: 'Environmental Studies', short: 'EVS', color: '#2F9E5F' },
  { id: 'sub_sci', name: 'Science', short: 'Sci', color: '#1F9D5C' },
  { id: 'sub_sst', name: 'Social Studies', short: 'SST', color: '#9BD0FF' },
  { id: 'sub_his', name: 'History', short: 'His', color: '#E8930C' },
  { id: 'sub_geo', name: 'Geography', short: 'Geo', color: '#2F9E5F' },
  { id: 'sub_civ', name: 'Civics', short: 'Civ', color: '#0A84FF' },
  { id: 'sub_sans', name: 'Sanskrit', short: 'San', color: '#F5A623' },
  { id: 'sub_fren', name: 'French', short: 'Fr', color: '#9BD0FF' },
  { id: 'sub_ger', name: 'German', short: 'De', color: '#4DB1FF' },
  { id: 'sub_span', name: 'Spanish', short: 'Es', color: '#F5A623' },
  { id: 'sub_econ', name: 'Economics', short: 'Eco', color: '#1F9D5C' },
  { id: 'sub_acc', name: 'Accountancy', short: 'Acc', color: '#0A84FF' },
  { id: 'sub_bst', name: 'Business Studies', short: 'BSt', color: '#2F9E5F' },
  { id: 'sub_comm', name: 'Commerce', short: 'Com', color: '#5A6B85' },
  { id: 'sub_pol', name: 'Political Science', short: 'Pol', color: '#0066CC' },
  { id: 'sub_psy', name: 'Psychology', short: 'Psy', color: '#005BB5' },
  { id: 'sub_soc', name: 'Sociology', short: 'Soc', color: '#E8930C' },
  { id: 'sub_ip', name: 'Informatics Practices', short: 'IP', color: '#0A84FF' },
  { id: 'sub_pe', name: 'Physical Education', short: 'PE', color: '#E5484D' },
  { id: 'sub_art', name: 'Art & Craft', short: 'Art', color: '#D96A00' },
  { id: 'sub_music', name: 'Music', short: 'Mus', color: '#D96A00' },
  { id: 'sub_dance', name: 'Dance', short: 'Dan', color: '#E5484D' },
  { id: 'sub_drama', name: 'Drama', short: 'Dra', color: '#005BB5' },
  { id: 'sub_gk', name: 'General Knowledge', short: 'GK', color: '#1F9D5C' },
  { id: 'sub_moral', name: 'Moral Science', short: 'Mor', color: '#0066CC' },
  { id: 'sub_robotics', name: 'Robotics', short: 'Rob', color: '#4DB1FF' },
  { id: 'sub_coding', name: 'Coding', short: 'Code', color: '#2F9E5F' },
]

const TOPICS: Record<string, string[]> = {
  sub_math: ['Algebra', 'Trigonometry', 'Calculus', 'Coordinate Geometry', 'Statistics'],
  sub_phy: ['Mechanics', 'Laws of Motion', 'Thermodynamics', 'Optics', 'Waves'],
  sub_chem: ['Atomic Structure', 'Chemical Bonding', 'Thermochemistry', 'Equilibrium', 'Organic Chem'],
  sub_bio: ['Cell Biology', 'Genetics', 'Ecology', 'Human Physiology', 'Plant Kingdom'],
  sub_eng: ['Grammar', 'Comprehension', 'Writing Skills', 'Literature'],
  sub_cs: ['Python', 'Data Structures', 'Networking', 'SQL', 'Web Basics'],
}

const TEACHER_NAMES = [
  { name: 'Rajesh Mehta', subj: 'sub_math' },
  { name: 'Kavita Verma', subj: 'sub_phy' },
  { name: 'Sunil Sharma', subj: 'sub_chem' },
  { name: 'Anita Iyer', subj: 'sub_bio' },
  { name: 'Meera Nair', subj: 'sub_eng' },
  { name: 'Vikram Kaur', subj: 'sub_cs' },
]

const CLASSES: Array<Omit<SchoolClass, 'classTeacherId' | 'subjectIds'> & { size: number }> = [
  { id: 'cls_11a', name: 'XI', section: 'A', academicYear: '2026–27', size: 36 },
  { id: 'cls_11b', name: 'XI', section: 'B', academicYear: '2026–27', size: 24 },
  { id: 'cls_10a', name: 'X', section: 'A', academicYear: '2026–27', size: 20 },
  { id: 'cls_8b', name: 'VIII', section: 'B', academicYear: '2026–27', size: 18 },
  { id: 'cls_9a', name: 'IX', section: 'A', academicYear: '2026–27', size: 22 },
]

const FIRST = ['Aarav', 'Anaya', 'Priya', 'Rohan', 'Sneha', 'Arjun', 'Diya', 'Kabir', 'Ishita', 'Rahul', 'Neha', 'Vivaan', 'Aisha', 'Riya', 'Aditya', 'Sara', 'Manav', 'Kriti', 'Yash', 'Tara', 'Dev', 'Mira', 'Nikhil', 'Sanya', 'Karan', 'Zara', 'Farhan', 'Gauri', 'Aryan', 'Pooja', 'Ravi', 'Lakshmi', 'Sameer', 'Naina', 'Harsh', 'Ira']
const LAST = ['Sharma', 'Patel', 'Singh', 'Reddy', 'Iyer', 'Gupta', 'Khan', 'Das', 'Menon', 'Chopra', 'Rao', 'Kulkarni', 'Verma', 'Bose', 'Nair', 'Mehta', 'Joshi', 'Kapoor', 'Malhotra', 'Saxena', 'Dutta', 'Agarwal', 'Pillai', 'Bhatt', 'Chawla', 'Gill', 'Handa', 'Jain', 'Kaur', 'Lal', 'Mehra', 'Nigam', 'Oberoi', 'Pradhan', 'Qureshi', 'Rastogi']

const HUE = (i: number) => (i * 47) % 360

let uid = 0
const nid = (p: string) => `${p}_${String(++uid).padStart(4, '0')}`

export function buildSeed(): DB {
  const db: DB = {
    users: [], students: [], teachers: [], parents: [], parentLinks: [],
    classes: [], subjects: SUBJECTS, assessments: [], marks: [], attendance: [],
    assignments: [], submissions: [], timetable: [], notifications: [],
    calendarTasks: [], interventions: [], interventionResults: [], leaves: [], timelineEvents: [], reports: [], insights: [],
  }

  const T = todayISO()
  const termStart = addDays(T, -56)

  // ---------- Teachers ----------
  const teachers: Teacher[] = TEACHER_NAMES.map((t, i) => {
    const userId = nid('usr')
    db.users.push({ id: userId, role: 'teacher', name: t.name, email: `${t.name.split(' ')[0].toLowerCase()}@novaschool.edu`, avatarHue: HUE(i + 2) })
    return { id: nid('tch'), userId, subjectIds: [t.subj], classIds: [], classTeacherOfIds: [], workload: between(18, 30) }
  })
  const [tMath, tPhy, tChem, tBio, tEng, tCs] = teachers

  tMath.classIds = ['cls_11a', 'cls_11b', 'cls_9a']
  tPhy.classIds = ['cls_11a', 'cls_11b']
  tChem.classIds = ['cls_11a', 'cls_11b', 'cls_10a']
  tBio.classIds = ['cls_10a', 'cls_9a']
  tEng.classIds = ['cls_11a', 'cls_11b', 'cls_10a', 'cls_9a', 'cls_8b']
  tCs.classIds = ['cls_8b', 'cls_9a', 'cls_10a']
  tPhy.classTeacherOfIds = ['cls_11a']
  tChem.classTeacherOfIds = ['cls_11b']
  tCs.classTeacherOfIds = ['cls_8b']
  tBio.classTeacherOfIds = ['cls_10a', 'cls_9a']
  db.teachers = teachers

  // ---------- Classes ----------
  const classTeacher: Record<string, string> = {
    cls_11a: tPhy.id, cls_11b: tChem.id, cls_10a: tBio.id, cls_8b: tCs.id, cls_9a: tBio.id,
  }
  const classSubjects: Record<string, string[]> = {
    cls_11a: ['sub_math', 'sub_phy', 'sub_chem', 'sub_eng', 'sub_cs'],
    cls_11b: ['sub_math', 'sub_phy', 'sub_chem', 'sub_eng', 'sub_cs'],
    cls_10a: ['sub_math', 'sub_phy', 'sub_chem', 'sub_bio', 'sub_eng'],
    cls_9a: ['sub_math', 'sub_bio', 'sub_eng', 'sub_cs', 'sub_phy'],
    cls_8b: ['sub_math', 'sub_eng', 'sub_cs', 'sub_bio', 'sub_phy'],
  }
  db.classes = CLASSES.map((c) => ({ ...c, classTeacherId: classTeacher[c.id], subjectIds: classSubjects[c.id] }))

  // ---------- Students ----------
  const featured: Record<string, { profile: Student['performanceProfile']; att: Student['attendanceProfile']; gen: Student['gender'] }> = {
    'Aarav Sharma': { profile: 'declining', att: 'normal', gen: 'M' },   // math declining, 91% att
    'Rohan Singh': { profile: 'declining', att: 'low', gen: 'M' },
    'Priya Patel': { profile: 'improving', att: 'strong', gen: 'F' },
    'Anaya Sharma': { profile: 'improving', att: 'strong', gen: 'F' },
    'Diya Gupta': { profile: 'declining', att: 'normal', gen: 'F' },
    'Arjun Reddy': { profile: 'declining', att: 'low', gen: 'M' },
  }

  let nameIdx = 0
  for (const cls of CLASSES) {
    for (let i = 0; i < cls.size; i++) {
      let full: string
      let first = FIRST[nameIdx % FIRST.length]
      let last = LAST[Math.floor(nameIdx / FIRST.length) % LAST.length]
      full = `${first} ${last}`
      nameIdx++
      // force the featured combos
      if (full === 'Aarav Sharma' || full === 'Anaya Sharma') continue
      const featuredKey = Object.keys(featured).find((k) => {
        const [f] = k.split(' ')
        return f === first && last.includes(k.split(' ')[1])
      })
      if (featuredKey) { full = featuredKey; first = full.split(' ')[0]; last = full.split(' ')[1] }

      const userId = nid('usr')
      const perf = featured[full]?.profile ?? (rand() < 0.35 ? 'improving' : rand() < 0.55 ? 'stable' : 'declining')
      const att = featured[full]?.att ?? (rand() < 0.25 ? 'strong' : rand() < 0.75 ? 'normal' : 'low')
      const gender = featured[full]?.gen ?? (rand() < 0.5 ? 'M' : 'F')
      db.users.push({ id: userId, role: 'student', name: full, email: `${first.toLowerCase()}.${last.toLowerCase()}@student.novaschool.edu`, avatarHue: HUE(nameIdx + 7) })
      db.students.push({ id: nid('stu'), userId, classId: cls.id, rollNumber: i + 1, gender, attendanceProfile: att, performanceProfile: perf })
    }
  }
  // Featured students in XI-A (Aarav) and VIII-B (Anaya)
  const mkFeatured = (full: string, clsId: string, roll: number) => {
    const first = full.split(' ')[0]; const last = full.split(' ')[1]
    const userId = nid('usr')
    db.users.push({ id: userId, role: 'student', name: full, email: `${first.toLowerCase()}.${last.toLowerCase()}@student.novaschool.edu`, avatarHue: HUE(220) })
    const s = { id: nid('stu'), userId, classId: clsId, rollNumber: roll, gender: ('Anaya Sharma' === full ? 'F' : 'M') as 'M' | 'F', attendanceProfile: featured[full].att, performanceProfile: featured[full].profile }
    db.students.push(s)
    return s
  }
  const aarav = mkFeatured('Aarav Sharma', 'cls_11a', 1)
  const anaya = mkFeatured('Anaya Sharma', 'cls_8b', 3)

  const studentOf = new Map<string, Student>()
  db.students.forEach((s) => studentOf.set(s.id, s))
  const byClass = (cid: string) => db.students.filter((s) => s.classId === cid)

  // ---------- Parents ----------
  const parentNames = ['Rahul Sharma', 'Neha Singh', 'Vikram Patel', 'Sunita Reddy', 'Anil Gupta', 'Kavita Iyer', 'Mohan Das', 'Rekha Menon', 'Arun Chopra', 'Divya Rao', 'Suresh Kulkarni', 'Lata Verma']
  parentNames.forEach((name, i) => {
    const userId = nid('usr')
    db.users.push({ id: userId, role: 'parent', name, email: `${name.split(' ')[0].toLowerCase()}@gmail.com`, avatarHue: HUE(i + 50) })
    db.parents.push({ id: nid('par'), userId })
  })
  const linkParent = (parentName: string, studentId: string) => {
    const par = db.parents.find((p) => db.users.find((u) => u.id === p.userId)?.name === parentName)!
    const code = `${db.users.find((u) => u.id === studentOf.get(studentId)!.userId)!.name.split(' ')[0].slice(0, 4).toUpperCase()}-${Math.floor(1000 + rand() * 9000)}`
    db.parentLinks.push({ id: nid('plk'), parentId: par.id, studentId, code })
  }
  linkParent('Rahul Sharma', aarav.id)   // two children
  linkParent('Rahul Sharma', anaya.id)
  // link ~10 more parents to random students
  const unlinked = db.students.filter((s) => s.id !== aarav.id && s.id !== anaya.id)
  const linked = new Set<string>()
  db.parents.slice(1).forEach((p) => {
    const n = between(1, 2)
    for (let i = 0; i < n; i++) {
      const cand = unlinked.filter((s) => !linked.has(s.id))
      if (!cand.length) break
      const s = cand[Math.floor(rand() * cand.length)]
      linked.add(s.id)
      linkParent(db.users.find((u) => u.id === p.userId)!.name, s.id)
    }
  })

  // ---------- Timetable (per class, 6 periods, Mon-Fri) ----------
  const PERIODS = [
    { start: '08:00', end: '08:45' }, { start: '08:45', end: '09:30' }, { start: '09:45', end: '10:30' },
    { start: '10:30', end: '11:15' }, { start: '11:30', end: '12:15' }, { start: '12:15', end: '13:00' },
  ]
  const teacherFor = (clsId: string, subjId: string): Teacher => {
    const t = teachers.find((tc) => tc.classIds.includes(clsId) && tc.subjectIds.includes(subjId))
    return t ?? tEng
  }
  for (const cls of db.classes) {
    for (let day = 1; day <= 5; day++) {
      const subs = [...cls.subjectIds]
      for (let p = 0; p < 6; p++) {
        const subjId = subs[p % subs.length]
        const t = teacherFor(cls.id, subjId)
        db.timetable.push({
          id: nid('tt'), classId: cls.id, subjectId: subjId, teacherId: t.id,
          day, period: p + 1, startTime: PERIODS[p].start, endTime: PERIODS[p].end,
        })
      }
    }
  }

  // ---------- Assessments & Marks ----------
  const ASSESS_TITLES = ['Unit Test 1', 'Unit Test 2', 'Unit Test 3', 'Unit Test 4', 'Weekly Quiz', 'Mid Term', 'Chapter Test']
  const subjectTeacher = (clsId: string, subjId: string) => {
    const t = teachers.find((tc) => tc.classIds.includes(clsId) && tc.subjectIds.includes(subjId))
    return t ?? tEng
  }
  const subjectBase: Record<string, Record<string, number>> = {
    'Aarav Sharma': { sub_math: 80, sub_phy: 74, sub_chem: 88, sub_eng: 82, sub_cs: 84 },
    'Rohan Singh': { sub_math: 68, sub_phy: 66, sub_chem: 70, sub_eng: 72, sub_cs: 60 },
    'Priya Patel': { sub_math: 82, sub_phy: 78, sub_chem: 76, sub_eng: 88, sub_cs: 80 },
    'Anaya Sharma': { sub_math: 84, sub_eng: 90, sub_cs: 86, sub_bio: 82, sub_phy: 78 },
  }
  const classBase: Record<string, number> = {
    cls_11a: 74, cls_11b: 71, cls_10a: 76, cls_9a: 72, cls_8b: 80,
  }

  // For each class: 4 completed assessments per subject (week -8, -6, -4, -2), 1 upcoming (+5)
  for (const cls of db.classes) {
    const students = byClass(cls.id)
    const base = classBase[cls.id]
    for (const subjId of cls.subjectIds) {
      const t = subjectTeacher(cls.id, subjId)
      const topics = TOPICS[subjId]
      for (let k = 0; k < 4; k++) {
        const date = addDays(termStart, k * 14 + between(2, 4))
        const ai = nid('asm')
        const maxMarks = [20, 30, 40, 50][k] ?? 40
        db.assessments.push({
          id: ai, classId: cls.id, subjectId: subjId, teacherId: t.id,
          title: k === 3 ? 'Unit Test 4' : k === 2 ? 'Unit Test 3' : k === 1 ? 'Unit Test 2' : 'Unit Test 1',
          date, maxMarks, term: 'Term 1', status: 'marked',
        })
        for (const st of students) {
          const profile = st.performanceProfile
          const sp = st.performanceProfile === 'declining' ? 1 : st.performanceProfile === 'improving' ? -1 : 0
          const sb = subjectBase[db.users.find((u) => u.id === st.userId)?.name ?? '']?.[subjId]
          let level = sb ?? base + between(-9, 9)
          // per-student variation over time
          const trend = profile === 'declining' ? 4 + k * 3 : profile === 'improving' ? -3 - k * 2 : between(-2, 2)
          if (st.performanceProfile === 'declining') level -= k * 4
          if (st.performanceProfile === 'improving') level += k * 3
          const noise = between(-4, 4)
          const pct = Math.max(35, Math.min(99, Math.round(level + noise)))
          const score = Math.round((pct / 100) * maxMarks)
          const topicMarks = topics.slice(0, 4).map((topic, ti) => {
            // Trigonometry weak for Aarav; Mechanics weak for many in Physics
            let tPct = pct + between(-6, 6)
            if (subjId === 'sub_math' && topic === 'Trigonometry' && db.users.find((u) => u.id === st.userId)?.name === 'Aarav Sharma') tPct = pct - 18 - k * 2
            else if (subjId === 'sub_math' && topic === 'Trigonometry' && st.performanceProfile === 'declining') tPct = pct - 8
            else if (subjId === 'sub_phy' && topic === 'Mechanics') tPct = pct - between(4, 10)
            const tScore = Math.max(0, Math.min(maxMarks / 4, Math.round((Math.max(20, Math.min(99, tPct)) / 100) * (maxMarks / 4))))
            return { topic, score: tScore, max: Math.round(maxMarks / 4) }
          })
          db.marks.push({ id: nid('mrk'), assessmentId: ai, studentId: st.id, score, topics: topicMarks, enteredBy: t.id })
        }
      }
      // upcoming assessment
      const date = addDays(T, 5 + between(0, 4))
      const maxMarks = 40
      db.assessments.push({
        id: nid('asm'), classId: cls.id, subjectId: subjId, teacherId: t.id,
        title: 'Unit Test 5', date, maxMarks, term: 'Term 1', status: 'scheduled',
      })
    }
  }
  // Aarav: override math series 82 84 81 67 then follow-up 79 (intervention)
  const aaravMathAsm = db.assessments.filter((a) => a.classId === 'cls_11a' && a.subjectId === 'sub_math' && a.status === 'marked').sort((a, b) => a.date.localeCompare(b.date))
  const aaravScores = [82, 84, 81, 67]
  aaravScores.forEach((pct, i) => {
    const ai = aaravMathAsm[i]
    if (!ai) return
    const m = db.marks.find((m) => m.assessmentId === ai.id && m.studentId === aarav.id)
    if (!m) return
    m.score = Math.round((pct / 100) * ai.maxMarks)
    const topics = TOPICS.sub_math.slice(0, 4)
    m.topics = topics.map((topic, ti) => {
      let tPct = pct + (ti === 1 ? -16 : between(-4, 4))
      if (i >= 2) tPct = Math.min(99, tPct + between(0, 3))
      if (topic === 'Trigonometry') tPct = pct - 16 - i * 2
      if (topic === 'Statistics') tPct = pct + 8
      return { topic, score: Math.max(0, Math.min(ai.maxMarks / 4, Math.round((tPct / 100) * (ai.maxMarks / 4)))), max: Math.round(ai.maxMarks / 4) }
    })
  })
  // Follow-up quiz after intervention (assessment created earlier, marked 79%)
  {
    const fu = {
      id: nid('asm'), classId: 'cls_11a', subjectId: 'sub_math', teacherId: tMath.id,
      title: 'Follow-up Quiz: Trigonometry', date: addDays(T, -2), maxMarks: 25, term: 'Term 1', status: 'marked' as const,
    }
    db.assessments.push(fu)
    byClass('cls_11a').forEach((st) => {
      const basePct = 60 + between(0, 30)
      const pct = st.id === aarav.id ? 79 : basePct
      db.marks.push({ id: nid('mrk'), assessmentId: fu.id, studentId: st.id, score: Math.round((pct / 100) * 25), topics: [{ topic: 'Trigonometry', score: Math.round((pct / 100) * 25), max: 25 }], enteredBy: tMath.id })
    })
  }

  // ---------- Attendance (per student per school day, 2 records/day from timetable) ----------
  const attWindow = schoolDaysBetween(termStart, addDays(T, -1))
  for (const st of db.students) {
    const cls = db.classes.find((c) => c.id === st.classId)!
    const daily = cls.subjectIds.length ? cls.subjectIds : ['sub_eng']
    let lowStreak = 0
    for (const date of attWindow) {
      const w = new Date(date + 'T00:00:00').getDay()
      const periods = db.timetable.filter((tt) => tt.classId === st.classId && tt.day === w)
      const forDay = periods.slice(0, 2)
      for (const tt of forDay) {
        let status: 'present' | 'absent' | 'late' = 'present'
        if (st.attendanceProfile === 'low') {
          status = rand() < 0.22 ? 'absent' : rand() < 0.32 ? 'late' : 'present'
        } else if (st.attendanceProfile === 'strong') {
          status = rand() < 0.02 ? 'late' : 'present'
        } else {
          status = rand() < 0.05 ? 'absent' : rand() < 0.09 ? 'late' : 'present'
        }
        if (status !== 'present') lowStreak++
        db.attendance.push({ id: nid('att'), studentId: st.id, classId: st.classId, subjectId: tt.subjectId, date, period: tt.period, status, markedBy: teacherFor(st.classId, tt.subjectId).id })
      }
    }
  }
  // Aarav: 91% attendance (normal profile already gives ~95%; tweak to land ~91)
  {
    const aaravRecs = db.attendance.filter((a) => a.studentId === aarav.id)
    const targetAbsent = Math.floor(aaravRecs.length * 0.09)
    let absent = 0
    aaravRecs.forEach((r, i) => {
      if (absent < targetAbsent && r.status === 'present' && i % 7 === 0) { r.status = 'absent'; absent++ }
    })
  }

  // ---------- Assignments & Submissions ----------
  for (const cls of db.classes) {
    const students = byClass(cls.id)
    for (const subjId of cls.subjectIds.slice(0, 3)) {
      const t = subjectTeacher(cls.id, subjId)
      const titles: Record<string, string[]> = {
        sub_math: ['Problem Set: Trigonometry', 'Algebra Worksheet', 'Calculus Practice Set'],
        sub_phy: ['Mechanics Problem Set', 'Laws of Motion Worksheet', 'Optics Lab Report'],
        sub_chem: ['Atomic Structure Worksheet', 'Equilibrium Problems', 'Organic Reactions Sheet'],
        sub_eng: ['Essay: My City', 'Comprehension Passage', 'Grammar Workbook'],
        sub_bio: ['Cell Biology Diagram', 'Genetics Worksheet'],
        sub_cs: ['Python Loops Lab', 'SQL Queries Sheet'],
      }
      const list = titles[subjId] ?? ['Worksheet']
      list.forEach((title, i) => {
        const dueOffset = i === 0 ? -between(3, 8) : i === 1 ? between(1, 4) : between(6, 9)
        const due = addDays(T, dueOffset)
        const a = nid('asg')
        db.assignments.push({
          id: a, classId: cls.id, subjectId: subjId, teacherId: t.id, title,
          description: `Complete and submit ${title.toLowerCase()} before the deadline. Show all working steps clearly.`,
          dueDate: due, maxPoints: 10, priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
        })
        for (const st of students) {
          const past = dueOffset < 0
          const low = st.performanceProfile === 'declining' || st.attendanceProfile === 'low'
          let status: 'submitted' | 'missing' | 'pending'
          if (past) status = low && rand() < 0.45 ? 'missing' : 'submitted'
          else status = low && rand() < 0.3 ? 'pending' : 'pending'
          const submittedAt = status === 'submitted' ? addDays(due, -between(1, 3)) : null
          const score = status === 'submitted' ? between(6, 10) : null
          db.submissions.push({ id: nid('sub'), assignmentId: a, studentId: st.id, submittedAt, status, score })
        }
      })
    }
  }
  // Aarav: 3 missed assignments this term (per example)
  {
    const aaravMissing = db.submissions.filter((s) => s.studentId === aarav.id && s.status === 'missing')
    aaravMissing.forEach((s, i) => { if (i < 3) s.status = 'missing'; })
  }

  // ---------- Interventions ----------
  const trigIntervention: DB['interventions'][number] = {
    id: nid('int'), classId: 'cls_11a', subjectId: 'sub_math', studentId: aarav.id,
    title: '3-day Trigonometry Revision Plan',
    problem: 'Mathematics declined by 14 percentage points (Unit Test 4). Decline concentrated in Trigonometry.',
    plan: [
      'Day 1: Trigonometry identities recap + 20 practice problems',
      'Day 2: Applications of Trigonometry (heights & distances) + past-paper questions',
      'Day 3: Diagnostic mini-test on Trigonometry + error review',
      'Follow-up: 25-mark Trigonometry quiz on completion',
    ],
    startDate: addDays(T, -5), endDate: addDays(T, -2), status: 'completed', createdBy: tMath.id,
  }
  db.interventions.push(trigIntervention)
  db.interventionResults.push({
    id: nid('ir'), interventionId: trigIntervention.id,
    beforeScore: 67, afterScore: 79, followUpAssessmentId: db.assessments[db.assessments.length - 1].id, measuredAt: addDays(T, -2),
  })
  // A class-wide intervention for Physics Mechanics
  db.interventions.push({
    id: nid('int'), classId: 'cls_11a', subjectId: 'sub_phy', studentId: null,
    title: 'Mechanics Concept Review (XI-A)',
    problem: '18 students scored below 60% in Mechanics in Unit Test 3.',
    plan: ['Recap of Newton\u2019s Laws with worked examples', 'Small-group problem-solving session', 'Quick 10-question mechanics diagnostic'],
    startDate: addDays(T, -3), endDate: addDays(T, 1), status: 'active', createdBy: tPhy.id,
  })
  db.interventions.push({
    id: nid('int'), classId: 'cls_8b', subjectId: 'sub_math', studentId: null,
    title: 'Fractions & Decimals Drill (VIII-B)',
    problem: 'Class average in Fractions module below benchmark.',
    plan: ['Daily 15-minute fluency drills', 'Peer-tutoring pairs', 'Weekly 10-mark check-in'],
    startDate: addDays(T, -7), endDate: addDays(T, 0), status: 'completed', createdBy: tCs.id,
  })

  // ---------- Calendar tasks ----------
  const taskTypes = ['study', 'homework', 'exam', 'personal'] as const
  for (const st of [aarav, anaya, ...db.students.slice(0, 6)]) {
    const n = between(3, 6)
    for (let i = 0; i < n; i++) {
      const type = taskTypes[between(0, 3)]
      const dayOffset = type === 'exam' ? between(3, 9) : type === 'homework' ? between(-1, 3) : between(0, 6)
      const title =
        type === 'study' ? `${pick(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'])} revision`
        : type === 'homework' ? `${pick(['Mathematics', 'Physics', 'Chemistry', 'English'])} homework`
        : type === 'exam' ? `${pick(['Mathematics', 'Physics', 'Chemistry', 'Biology'])} ${pick(['Unit Test', 'Chapter Test', 'Weekly Quiz'])}`
        : pick(['Football practice', 'Music class', 'Reading club', 'Science fair prep'])
      db.calendarTasks.push({
        id: nid('cal'), ownerId: st.id, title, type,
        date: addDays(T, dayOffset),
        startTime: type === 'study' ? ['16:00', '17:00', '18:00'][between(0, 2)] : null,
        durationMin: type === 'study' ? [30, 45, 60][between(0, 2)] : 60,
        priority: type === 'exam' ? 'high' : type === 'homework' ? 'medium' : 'low',
        recurring: 'none', completed: dayOffset < 0 && rand() < 0.7,
      })
    }
  }

  // ---------- Notifications ----------
  const notif = (userId: string, title: string, body: string, type: DB['notifications'][number]['type'], priority: 'low' | 'medium' | 'high', daysAgo: number, route?: string) => {
    db.notifications.push({ id: nid('ntf'), userId, title, body, type, priority, createdAt: addDays(T, -daysAgo), read: daysAgo > 1, route })
  }
  notif(aarav.userId, 'Marks published', 'Your Mathematics Unit Test 4 score: 67%. Performance declined 14 points.', 'marks', 'high', 3, '/performance')
  notif(aarav.userId, 'Intervention assigned', 'Mrs. Kavita Verma assigned a 3-day Trigonometry revision plan.', 'intervention', 'high', 5, '/assignments')
  notif(aarav.userId, 'Assignment deadline', '"Problem Set: Trigonometry" is due tomorrow.', 'deadline', 'medium', 0)
  notif(aarav.userId, 'Unit Test 5 coming up', 'Mathematics Unit Test 5 is scheduled in 5 days.', 'assessment', 'medium', 0)
  notif(anaya.userId, 'Marks published', 'Your Mathematics Chapter Test score: 86%.', 'marks', 'low', 1, '/performance')
  notif(anaya.userId, 'Attendance warning', 'Your attendance this week is 90%.', 'attendance', 'low', 0)
  const rahul = db.parents.find((p) => db.users.find((u) => u.id === p.userId)?.name === 'Rahul Sharma')!
  notif(rahul.userId, 'Parent notice', 'Aarav\u2019s Mathematics assignment is overdue.', 'announcement', 'medium', 1, '/children')
  notif(rahul.userId, 'Academic update', 'Aarav\u2019s Mathematics declined in Unit Test 4. A revision intervention was assigned.', 'warning', 'high', 3, '/children')
  notif(tPhy.userId, 'Attendance pending', 'XI-A attendance for today has not been marked.', 'attendance', 'high', 0, '/attendance')
  notif(tMath.userId, 'Marking pending', 'Unit Test 5 (XI-A) marks are pending entry.', 'assessment', 'medium', 0)

  // ---------- Admin ----------
  db.users.push({ id: 'usr_admin', role: 'admin', name: 'Priya Deshmukh', email: 'principal@novaschool.edu', avatarHue: 260 })
  db.users.push({ id: 'usr_student_demo', role: 'student', name: 'Aarav Sharma', email: 'aarav.sharma@student.novaschool.edu', avatarHue: 220 })
  db.users.push({ id: 'usr_teacher_demo', role: 'teacher', name: 'Kavita Verma', email: 'kavita@novaschool.edu', avatarHue: 90 })
  db.users.push({ id: 'usr_parent_demo', role: 'parent', name: 'Rahul Sharma', email: 'rahul@gmail.com', avatarHue: 150 })
  db.users.push({ id: 'usr_admin_demo', role: 'admin', name: 'Priya Deshmukh', email: 'principal@novaschool.edu', avatarHue: 260 })

  return db
}

export function schoolName() {
  return 'School'
}