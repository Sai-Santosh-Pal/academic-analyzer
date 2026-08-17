import { useSyncExternalStore, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DB, Role, AttendanceStatus, AppNotification, CalendarTask, Intervention, User, Student, Teacher, Subject, SchoolClass, ParentStudentLink } from './types'
import { buildSeed } from './seed'
import { addDays, todayISO, toISO } from '../utils/date'
import { teacherName, subjectName } from './stats'
import {
  pushCloudState, pullCloudState, listenCloudState, firebaseReady, watchCloudAuth,
  signInEmail, signUpSchool, createSchoolAccount, signOutCloud, getUserProfile,
  getSchoolMeta, defaultSchoolId, CloudUserProfile, cachedCloudIdentity, normalizeDb,
} from '../services/firebase'

const STORAGE_KEY = 'academic-analyzer-db-v1'
const SESSION_KEY = 'academic-analyzer-session-v1'
const CLOUD_KEY = 'academic-analyzer-cloud-v1'
const CLOUD_META_KEY = 'academic-analyzer-cloud-meta-v1'

/** A freshly provisioned school: subject catalog only, no people or records. */
function emptySchoolDb(admin: User): DB {
  const seed = buildSeed()
  return {
    ...seed,
    users: [admin],
    students: [],
    teachers: [],
    parents: [],
    parentLinks: [],
    classes: [],
    assessments: [],
    marks: [],
    attendance: [],
    assignments: [],
    submissions: [],
    timetable: [],
    notifications: [],
    calendarTasks: [],
    interventions: [],
    interventionResults: [],
    reports: [],
    insights: [],
  }
}

class Store {
  private db: DB = buildSeed()
  private session: { userId: string; role: Role } | null = null
  private listeners = new Set<() => void>()
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private cloudPushTimer: ReturnType<typeof setTimeout> | null = null
  private cloudUnsub: (() => void) | null = null
  private lastPushedAt = 0
  private lastAppliedAt = 0
  private cloudSchoolId: string | null = null
  private cloudSchoolName: string | null = null
  private authUnsub: (() => void) | null = null
  private authReady = false
  /** While set, handleAuthUser ignores any Firebase user other than this uid (used while provisioning accounts so createUserWithEmailAndPassword's automatic sign-in never hijacks the session). */
  private suppressAuthSwitchTo: string | null = null
  /** In-memory creator password so the caller's session can always be restored after provisioning an account. */
  private cloudPassword: string | null = null
  cloudUser: { uid: string; role: Role; schoolId: string; name: string } | null = null
  cloudSyncEnabled = false
  cloudAvailable = false
  cloudLastSync: number | null = null
  cloudError: string | null = null
  hydrated = false

  constructor() {
    this.hydrate()
    this.authUnsub = watchCloudAuth((u) => { void this.handleAuthUser(u) })
  }

  private async handleAuthUser(u: { uid: string; email: string } | null) {
    this.authReady = true
    if (this.suppressAuthSwitchTo && u && u.uid !== this.suppressAuthSwitchTo) return
    if (!u) {
      if (this.cloudUser) {
        this.cloudUser = null
        this.cloudSchoolId = null
        this.cloudSchoolName = null
        this.cloudPassword = null
        this.stopCloudListeners()
        this.session = null
        this.cloudError = null
        AsyncStorage.removeItem(SESSION_KEY).catch(() => {})
        this.emit()
      }
      return
    }
    try {
      let profile: CloudUserProfile | null | undefined
      for (let attempt = 0; attempt < 5; attempt++) {
        profile = await getUserProfile(u.uid)
        if (profile) break
        // A missing node right after sign-up is a race (the profile write
        // lands a moment after the auth listener fires); transient errors
        // (offline etc.) are not races, so bail immediately.
        if (profile === undefined) break
        await new Promise((r) => setTimeout(r, 1000))
      }
      if (!profile) {
        console.warn(`[auth-load] profile unavailable for ${u.email}:`, profile === undefined ? 'server error/timeout' : 'node missing after retries')
        // Fall back to the last-known identity so a flaky connection doesn't
        // dead-end the sign-in; listeners re-sync when connectivity returns.
        const cachedIdentity = await cachedCloudIdentity(u.uid)
        if (cachedIdentity) {
          console.warn('[auth-load] restoring from cached identity')
          this.cloudAvailable = true
          this.cloudSyncEnabled = true
          this.cloudSchoolId = cachedIdentity.schoolId
          this.cloudUser = { uid: u.uid, role: cachedIdentity.role, schoolId: cachedIdentity.schoolId, name: cachedIdentity.name }
          this.session = { userId: u.uid, role: cachedIdentity.role }
          this.cloudError = null
          this.startCloudListeners()
          this.emit()
          return
        }
        this.cloudError = 'Sign-in succeeded but your account could not be loaded — check your internet connection and try again.'
        this.emit()
        return
      }
      const schoolId = profile.schoolId
      const meta = await getSchoolMeta(schoolId)
      this.cloudSchoolName = meta?.name ?? 'School'
      this.cloudAvailable = true
      this.cloudSyncEnabled = true
      const remote = await pullCloudState(schoolId)
      if (remote && remote.updatedAt > this.lastAppliedAt && remote.updatedAt > this.lastPushedAt) {
        this.db = remote.db
        this.lastAppliedAt = remote.updatedAt
      } else if (!remote) {
        // No school snapshot in RTDB yet (fresh sign-up / first device, or the
        // snapshot was never pushed). Seed it so every device sees the same
        // state and the signed-in user always exists in db.users.
        const currentUser = { id: u.uid, role: profile.role, name: profile.name, email: profile.email, avatarHue: profile.avatarHue ?? 0 }
        if (!this.db.users.some((x) => x.id === u.uid)) {
          this.db = emptySchoolDb(currentUser)
        }
        const updatedAt = Date.now()
        await pushCloudState(schoolId, this.db, updatedAt).catch(() => {})
        this.lastPushedAt = updatedAt
      }
      this.cloudSchoolId = schoolId
      this.cloudUser = { uid: u.uid, role: profile.role, schoolId, name: profile.name }
      this.session = { userId: u.uid, role: profile.role }
      this.cloudError = null
      this.startCloudListeners()
      this.persistLocal()
      this.emit()
    } catch (e) {
      console.warn('cloud sign-in load failed', e)
      this.cloudError = 'Sign-in succeeded but your data could not be loaded — check your connection and try again.'
      this.emit()
    }
  }

  get schoolName(): string {
    return this.cloudSchoolName ?? 'School'
  }

  get cloudId(): string {
    return this.cloudSchoolId ?? defaultSchoolId()
  }

  private async hydrate() {
    try {
      const [rawDb, rawSession, rawCloud, rawMeta] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SESSION_KEY),
        AsyncStorage.getItem(CLOUD_KEY),
        AsyncStorage.getItem(CLOUD_META_KEY),
      ])
      if (rawDb) {
        const parsed = JSON.parse(rawDb) as DB
        if (parsed.users?.length) this.db = normalizeDb(parsed)
      }
      if (rawSession) this.session = JSON.parse(rawSession)
      if (rawMeta) {
        const meta = JSON.parse(rawMeta) as { pushedAt?: number; appliedAt?: number }
        this.lastPushedAt = meta.pushedAt ?? 0
        this.lastAppliedAt = meta.appliedAt ?? 0
      }
      this.cloudAvailable = firebaseReady()
      if (!this.authReady) {
        this.cloudSyncEnabled = rawCloud ? rawCloud === 'true' : false
      } else if (!this.cloudUser) {
        this.cloudSyncEnabled = rawCloud ? rawCloud === 'true' : false
      }
      if (this.cloudSyncEnabled && this.cloudAvailable) {
        this.applyRemote(await pullCloudState(this.cloudId), true)
        this.startCloudListeners()
      }
      this.hydrated = true
      this.emit()
    } catch {
      this.hydrated = true
      this.emit()
    }
  }

  private applyRemote(state: { db: DB; updatedAt: number } | null, fromPull: boolean) {
    if (!state) return
    if (state.updatedAt <= this.lastAppliedAt) return
    if (state.updatedAt <= this.lastPushedAt) return
    this.db = state.db
    this.lastAppliedAt = state.updatedAt
    AsyncStorage.setItem(CLOUD_META_KEY, JSON.stringify({ pushedAt: this.lastPushedAt, appliedAt: this.lastAppliedAt })).catch(() => {})
    this.persistLocal()
    this.emit()
  }

  private startCloudListeners() {
    this.stopCloudListeners()
    this.cloudUnsub = listenCloudState(this.cloudId, (state) => this.applyRemote(state, false))
  }

  private stopCloudListeners() {
    if (this.cloudUnsub) {
      this.cloudUnsub()
      this.cloudUnsub = null
    }
  }

  private persistLocal() {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.db)).catch(() => {})
  }

  private persist() {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.persistLocal()
      this.pushCloud()
    }, 400)
  }

  private syncNow() {
    this.persistLocal()
    this.emit()
    if (!this.cloudSyncEnabled || !this.cloudAvailable) return Promise.resolve()
    if (this.cloudPushTimer) clearTimeout(this.cloudPushTimer)
    const updatedAt = Date.now()
    return pushCloudState(this.cloudId, this.db, updatedAt)
      .then((ok) => {
        if (ok) {
          this.lastPushedAt = Math.max(this.lastPushedAt, updatedAt)
          this.cloudLastSync = updatedAt
          AsyncStorage.setItem(CLOUD_META_KEY, JSON.stringify({ pushedAt: this.lastPushedAt, appliedAt: this.lastAppliedAt })).catch(() => {})
        }
      })
      .catch(() => {})
  }

  private pushCloud() {
    if (!this.cloudSyncEnabled || !this.cloudAvailable) return
    if (this.cloudPushTimer) clearTimeout(this.cloudPushTimer)
    this.cloudPushTimer = setTimeout(async () => {
      const updatedAt = Date.now()
      const ok = await pushCloudState(this.cloudId, this.db, updatedAt)
      if (ok) {
        this.lastPushedAt = Math.max(this.lastPushedAt, updatedAt)
        this.cloudLastSync = updatedAt
        AsyncStorage.setItem(CLOUD_META_KEY, JSON.stringify({ pushedAt: this.lastPushedAt, appliedAt: this.lastAppliedAt })).catch(() => {})
        this.emit()
      }
    }, 1200)
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }

  /** Resolve once handleAuthUser has finished (session ready or error surfaced). */
  private waitForAuthLoad(timeoutMs = 15000): Promise<void> {
    return new Promise((resolve) => {
      const start = Date.now()
      const check = () => {
        if (this.cloudUser || this.cloudError) return resolve()
        if (Date.now() - start > timeoutMs) return resolve()
        setTimeout(check, 250)
      }
      check()
    })
  }

  subscribe = (cb: () => void) => {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  getSnapshot = (): DB => this.db

  getSession() {
    return this.session
  }

  getState(): DB {
    return this.db
  }

  // ---------------- Session ----------------

  login(userId: string, role: Role) {
    this.session = { userId, role }
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(this.session)).catch(() => {})
    this.emit()
  }

  logout() {
    this.session = null
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {})
    if (this.cloudUser) {
      this.cloudUser = null
      this.cloudSchoolId = null
      this.cloudSchoolName = null
      this.stopCloudListeners()
      void signOutCloud()
    }
    this.emit()
  }

  resetDemo() {
    this.db = buildSeed()
    this.persist()
    this.emit()
  }

  updateProfile(userId: string, patch: Partial<Pick<User, 'name' | 'avatarUrl' | 'email'>>) {
    const u = this.db.users.find((x) => x.id === userId)
    if (u) Object.assign(u, patch)
    this.persist()
    this.emit()
  }

  // ---------------- Cloud sync ----------------

  setCloudSync(enabled: boolean) {
    this.cloudSyncEnabled = enabled
    AsyncStorage.setItem(CLOUD_KEY, String(enabled)).catch(() => {})
    if (enabled) this.startCloudListeners()
    else this.stopCloudListeners()
    this.emit()
  }

  // ---------------- Cloud auth ----------------

  get isCloudMode(): boolean {
    return !!this.cloudUser
  }

  async signInCloud(email: string, password: string): Promise<{ ok: boolean; message: string }> {
    this.cloudError = null
    const res = await signInEmail(email, password)
    if (res.ok) {
      this.cloudPassword = password
      // handleAuthUser (via onAuthStateChanged) loads profile + school db
      this.session = null
      AsyncStorage.removeItem(SESSION_KEY).catch(() => {})
      await this.waitForAuthLoad(12000)
      if (!this.cloudUser && !this.cloudError) {
        this.cloudError = 'Your account could not be loaded — check your connection and try again.'
        this.emit()
      }
    }
    return res
  }

  async signUpSchoolAccount(schoolName: string, adminName: string, email: string, password: string): Promise<{ ok: boolean; message: string }> {
    const res = await signUpSchool(schoolName, adminName, email, password)
    if (!res.ok) return res
    const uid = res.uid!
    const admin: User = { id: uid, role: 'admin', name: adminName, email: email.trim(), avatarHue: Math.floor(Math.random() * 360) }
    this.db = emptySchoolDb(admin)
    this.cloudSchoolId = res.schoolId!
    this.cloudAvailable = true
    this.cloudSyncEnabled = true
    this.cloudUser = { uid, role: 'admin', schoolId: res.schoolId!, name: adminName }
    this.session = { userId: uid, role: 'admin' }
    this.cloudError = null
    this.persistLocal()
    this.emit()
    // handleAuthUser (profile + school state) converges in the background; the
    // profile write races the auth listener, hence the optimistic session above.
    await this.waitForAuthLoad()
    return { ok: true, message: '' }
  }

  async signOutCloudAccount(): Promise<void> {
    await signOutCloud()
  }

  // ---------------- Account provisioning (hierarchy) ----------------

  private async provisionAccount(creatorUid: string, run: () => Promise<{ ok: boolean; message: string }>): Promise<{ ok: boolean; message: string }> {
    this.suppressAuthSwitchTo = creatorUid
    try {
      const res = await run()
      if (res.ok) {
        await this.syncNow()
      }
      return res
    } finally {
      this.suppressAuthSwitchTo = null
      // createUserWithEmailAndPassword auto-signs-in the new account; make sure
      // the caller's session is the one that sticks (updateCurrentUser restore
      // in createSchoolAccount usually handles it — re-auth as a fallback).
      if (this.cloudUser?.uid !== creatorUid || this.session?.userId !== creatorUid) {
        if (this.cloudPassword) {
          const creatorEmail = this.db.users.find((u) => u.id === creatorUid)?.email
          if (creatorEmail) await this.signInCloud(creatorEmail, this.cloudPassword).catch(() => {})
        }
      }
    }
  }

  async createTeacherAccount(opts: { name: string; email: string; password: string; subjectIds: string[]; classTeacherOfIds?: string[] }): Promise<{ ok: boolean; message: string }> {
    if (!this.cloudUser) return { ok: false, message: 'Sign in to your school account first.' }
    const creatorUid = this.cloudUser.uid
    return this.provisionAccount(creatorUid, async () => {
      const res = await createSchoolAccount('teacher', this.cloudUser!.schoolId, opts.name, opts.email, opts.password)
      if (!res.ok || !res.uid) return res
      const uid = res.uid
      const classTeacherOfIds = opts.classTeacherOfIds ?? []
      this.db.users.push({ id: uid, role: 'teacher', name: opts.name, email: opts.email.trim(), avatarHue: Math.floor(Math.random() * 360) })
      // classIds are assigned automatically when a timetable is generated/saved for a class.
      this.db.teachers.push({ id: uid, userId: uid, subjectIds: opts.subjectIds, classIds: [], classTeacherOfIds, workload: 40 })
      return { ok: true, message: '' }
    })
  }

  async createParentAccount(opts: { name: string; email: string; password: string }): Promise<{ ok: boolean; message: string }> {
    if (!this.cloudUser) return { ok: false, message: 'Sign in to your school account first.' }
    const creatorUid = this.cloudUser.uid
    return this.provisionAccount(creatorUid, async () => {
      const res = await createSchoolAccount('parent', this.cloudUser!.schoolId, opts.name, opts.email, opts.password)
      if (!res.ok || !res.uid) return res
      const uid = res.uid
      this.db.users.push({ id: uid, role: 'parent', name: opts.name, email: opts.email.trim(), avatarHue: Math.floor(Math.random() * 360) })
      this.db.parents.push({ id: uid, userId: uid })
      return { ok: true, message: '' }
    })
  }

  async createStudentAccount(opts: { name: string; email: string; password: string; classId: string; parentId?: string }): Promise<{ ok: boolean; message: string }> {
    if (!this.cloudUser) return { ok: false, message: 'Sign in to your teacher or parent account first.' }
    if (this.cloudUser.role !== 'teacher' && this.cloudUser.role !== 'parent') return { ok: false, message: 'Only teachers or parents can create student accounts.' }
    if (!this.db.classes.some((c) => c.id === opts.classId)) return { ok: false, message: 'Pick a class for the student.' }
    const creatorUid = this.cloudUser.uid
    return this.provisionAccount(creatorUid, async () => {
      const res = await createSchoolAccount('student', this.cloudUser!.schoolId, opts.name, opts.email, opts.password)
      if (!res.ok || !res.uid) return res
      const uid = res.uid
      const cls = this.db.classes.find((c) => c.id === opts.classId)
      const roll = cls ? this.db.students.filter((s) => s.classId === cls.id).length + 1 : 1
      this.db.users.push({ id: uid, role: 'student', name: opts.name, email: opts.email.trim(), avatarHue: Math.floor(Math.random() * 360) })
      this.db.students.push({ id: uid, userId: uid, classId: opts.classId, rollNumber: roll, gender: 'M', attendanceProfile: 'normal', performanceProfile: 'stable' })
      if (opts.parentId) {
        const code = `${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
        this.db.parentLinks.push({ id: `plk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, parentId: opts.parentId, studentId: uid, code })
      }
      const classTeacher = cls ? this.db.teachers.find((t) => t.id === cls.classTeacherId) : undefined
      if (classTeacher && cls) this.sendNotification([classTeacher.userId], 'New student added', `${opts.name} was added to ${cls.name} ${cls.section}.`, 'system', 'medium', `/teacher/class-detail?classId=${opts.classId}`)
      return { ok: true, message: '' }
    })
  }

  // ---------------- Mutations ----------------

  markAttendance(records: { studentId: string; classId: string; subjectId: string; date: string; period: number; status: AttendanceStatus }[], markedBy: string) {
    for (const r of records) {
      const existing = this.db.attendance.find(
        (x) => x.studentId === r.studentId && x.subjectId === r.subjectId && x.date === r.date && x.period === r.period && x.classId === r.classId
      )
      if (existing) {
        existing.status = r.status
        existing.markedBy = markedBy
      } else {
        this.db.attendance.push({ id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ...r, markedBy })
      }
    }
    this.autoNotifyAttendance(records)
    this.persist()
    this.emit()
  }

  private autoNotifyAttendance(records: { studentId: string; subjectId: string; date: string; status: AttendanceStatus }[]) {
    const perStudent = new Map<string, { absent: string[]; late: string[] }>()
    for (const r of records) {
      if (r.status === 'present') continue
      const entry = perStudent.get(r.studentId) ?? { absent: [], late: [] }
      entry[r.status === 'absent' ? 'absent' : 'late'].push(subjectName(this.db, r.subjectId))
      perStudent.set(r.studentId, entry)
    }
    for (const [sid, e] of perStudent) {
      const parents = this.parentUserIdsForStudents([sid])
      if (!parents.length) continue
      const parts = [
        ...(e.absent.length ? [`absent in ${e.absent.join(', ')}`] : []),
        ...(e.late.length ? [`late in ${e.late.join(', ')}`] : []),
      ]
      this.sendNotification(parents, `Attendance update: ${this.studentDisplayName(sid)}`, `Marked ${parts.join(' and ')}.`, 'attendance', 'high', `/parent/child-reports?studentId=${sid}`)
    }
  }

  saveMarks(entries: { assessmentId: string; studentId: string; score: number; topics?: { topic: string; score: number; max: number }[] }[], enteredBy: string) {
    const asm = this.db.assessments.find((a) => a.id === entries[0]?.assessmentId)
    if (asm) asm.status = 'marked'
    for (const e of entries) {
      const existing = this.db.marks.find((m) => m.assessmentId === e.assessmentId && m.studentId === e.studentId)
      const topics = e.topics ?? existing?.topics ?? []
      if (existing) {
        existing.score = e.score
        existing.topics = topics
      } else {
        this.db.marks.push({ id: `mrk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, assessmentId: e.assessmentId, studentId: e.studentId, score: e.score, topics, enteredBy })
      }
    }
    this.autoNotifyMarks(entries)
    this.persist()
    this.emit()
  }

  private autoNotifyMarks(entries: { assessmentId: string; studentId: string; score: number }[]) {
    const byStudent = new Map<string, { subj: string; score: number; max: number }[]>()
    for (const e of entries) {
      const asm = this.db.assessments.find((a) => a.id === e.assessmentId)
      if (!asm) continue
      const arr = byStudent.get(e.studentId) ?? []
      arr.push({ subj: subjectName(this.db, asm.subjectId), score: e.score, max: asm.maxMarks })
      byStudent.set(e.studentId, arr)
    }
    for (const [sid, ms] of byStudent) {
      const parents = this.parentUserIdsForStudents([sid])
      if (!parents.length) continue
      const first = ms[0]
      const extra = ms.length > 1 ? ` (+${ms.length - 1} more subject${ms.length > 2 ? 's' : ''})` : ''
      this.sendNotification(parents, `Marks entered: ${first.subj}`, `${this.studentDisplayName(sid)} scored ${first.score}/${first.max} in ${first.subj}${extra}.`, 'marks', 'medium', `/parent/child-reports?studentId=${sid}`)
    }
  }

  createAssessment(partial: Omit<DB['assessments'][number], 'id' | 'status'> & { status?: DB['assessments'][number]['status'] }) {
    const a = { ...partial, id: `asm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, status: partial.status ?? 'scheduled' } as DB['assessments'][number]
    this.db.assessments.push(a)
    this.autoNotifyAssessment(a)
    this.persist()
    this.emit()
    return a
  }

  private autoNotifyAssessment(a: DB['assessments'][number]) {
    const classStudents = this.db.students.filter((s) => s.classId === a.classId).map((s) => s.id)
    const parents = this.parentUserIdsForStudents(classStudents)
    if (parents.length) this.sendNotification(parents, `${subjectName(this.db, a.subjectId)} assessment scheduled`, `${a.title} on ${a.date} — out of ${a.maxMarks} marks.`, 'assessment', 'medium', '/parent/children')
    this.sendNotification(classStudents.map((sid) => this.db.students.find((s) => s.id === sid)?.userId ?? '').filter(Boolean), 'Upcoming assessment', `${subjectName(this.db, a.subjectId)} ${a.title} is scheduled on ${a.date}.`, 'assessment', 'medium')
  }

  createAssignment(partial: Omit<DB['assignments'][number], 'id'>) {
    const a = { ...partial, id: `asg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
    this.db.assignments.push(a)
    for (const s of this.db.students.filter((s) => s.classId === a.classId)) {
      this.db.submissions.push({ id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, assignmentId: a.id, studentId: s.id, submittedAt: null, status: 'pending', score: null })
    }
    const classStudents = this.db.students.filter((s) => s.classId === a.classId)
    this.sendNotification(classStudents.map((s) => s.userId), 'New assignment', `${a.title} (${subjectName(this.db, a.subjectId)}) — due ${a.dueDate}.`, 'deadline', 'medium')
    const parents = this.parentUserIdsForStudents(classStudents.map((s) => s.id))
    if (parents.length) this.sendNotification(parents, `Assignment: ${a.title}`, `Your child has a new ${subjectName(this.db, a.subjectId)} assignment due ${a.dueDate}.`, 'deadline', 'medium', '/parent/children')
    this.persist()
    this.emit()
    return a
  }

  setSubmission(assignmentId: string, studentId: string, status: DB['submissions'][number]['status'], score?: number | null) {
    const s = this.db.submissions.find((x) => x.assignmentId === assignmentId && x.studentId === studentId)
    if (s) {
      s.status = status
      s.submittedAt = status === 'submitted' ? todayISO() : null
      if (score !== undefined) s.score = score
    }
    this.persist()
    this.emit()
  }

  createCalendarTask(partial: Omit<CalendarTask, 'id'>) {
    const t = { ...partial, id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
    this.db.calendarTasks.push(t)
    this.persist()
    this.emit()
    return t
  }

  updateCalendarTask(id: string, patch: Partial<CalendarTask>) {
    const t = this.db.calendarTasks.find((x) => x.id === id)
    if (t) Object.assign(t, patch)
    this.persist()
    this.emit()
  }

  deleteCalendarTask(id: string) {
    this.db.calendarTasks = this.db.calendarTasks.filter((x) => x.id !== id)
    this.persist()
    this.emit()
  }

  createIntervention(partial: Omit<Intervention, 'id' | 'status'> & { status?: Intervention['status'] }) {
    const iv = { ...partial, id: `int_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, status: partial.status ?? 'active' }
    this.db.interventions.push(iv)
    this.persist()
    this.emit()
    return iv
  }

  completeIntervention(id: string, result?: { beforeScore: number; afterScore: number; followUpAssessmentId: string }) {
    const iv = this.db.interventions.find((x) => x.id === id)
    if (iv) iv.status = 'completed'
    if (result) {
      this.db.interventionResults.push({ id: `ir_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, interventionId: id, ...result, measuredAt: todayISO() })
    }
    this.persist()
    this.emit()
  }

  sendNotification(userIds: string[], title: string, body: string, type: AppNotification['type'], priority: AppNotification['priority'], route?: string) {
    for (const userId of userIds) {
      this.db.notifications.unshift({ id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, userId, title, body, type, priority, createdAt: toISO(new Date()), read: false, ...(route ? { route } : {}) })
    }
    this.persist()
    this.emit()
  }

  /** User ids of every parent linked to the given students. */
  private parentUserIdsForStudents(studentIds: string[]): string[] {
    const ids = new Set<string>()
    for (const sid of studentIds) {
      for (const l of this.db.parentLinks) {
        if (l.studentId !== sid) continue
        const p = this.db.parents.find((x) => x.id === l.parentId)
        if (p) ids.add(p.userId)
      }
    }
    return [...ids]
  }

  private studentDisplayName(studentId: string): string {
    const s = this.db.students.find((x) => x.id === studentId)
    return this.db.users.find((u) => u.id === s?.userId)?.name ?? 'Your child'
  }

  markNotificationRead(id: string) {
    const n = this.db.notifications.find((x) => x.id === id)
    if (n) n.read = true
    this.persist()
    this.emit()
  }

  markAllNotificationsRead(userId: string) {
    this.db.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true
    })
    this.persist()
    this.emit()
  }

  saveReport(partial: Omit<DB['reports'][number], 'id' | 'createdAt'>) {
    const r = { ...partial, id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, createdAt: toISO(new Date()) }
    this.db.reports.unshift(r)
    this.persist()
    this.emit()
    return r
  }

  saveInsight(partial: Omit<DB['insights'][number], 'id' | 'createdAt'>) {
    const existing = this.db.insights.find((i) => i.scope === partial.scope && i.scopeId === partial.scopeId && i.kind === partial.kind)
    if (existing) {
      Object.assign(existing, partial, { createdAt: toISO(new Date()) })
      this.emit()
      return existing
    }
    const i = { ...partial, id: `ins_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, createdAt: toISO(new Date()) }
    this.db.insights.push(i)
    this.persist()
    this.emit()
    return i
  }

  dismissInsight(id: string) {
    const i = this.db.insights.find((x) => x.id === id)
    if (i) i.dismissed = true
    this.emit()
  }

  // ---------------- Admin management ----------------

  createUser(name: string, email: string, role: Role) {
    const u: User = { id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, role, name, email, avatarHue: Math.floor(Math.random() * 360) }
    this.db.users.push(u)
    this.persist()
    return u
  }

  createStudent(student: Omit<Student, 'id'>, user: { name: string; email: string }) {
    const u = this.createUser(user.name, user.email, 'student')
    const s: Student = { ...student, id: `stu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, userId: u.id, rollNumber: student.rollNumber || this.db.students.filter((x) => x.classId === student.classId).length + 1 }
    this.db.students.push(s)
    this.persist()
    this.emit()
    return s
  }

  createTeacher(teacher: Omit<Teacher, 'id'>, user: { name: string; email: string }) {
    const u = this.createUser(user.name, user.email, 'teacher')
    const t: Teacher = { ...teacher, id: `tch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, userId: u.id }
    this.db.teachers.push(t)
    this.persist()
    this.emit()
    return t
  }

  deleteStudent(studentId: string) {
    const s = this.db.students.find((x) => x.id === studentId)
    this.db.students = this.db.students.filter((x) => x.id !== studentId)
    this.db.users = this.db.users.filter((u) => u.id !== s?.userId)
    this.db.marks = this.db.marks.filter((m) => m.studentId !== studentId)
    this.db.attendance = this.db.attendance.filter((a) => a.studentId !== studentId)
    this.db.submissions = this.db.submissions.filter((s) => s.studentId !== studentId)
    this.db.parentLinks = this.db.parentLinks.filter((l) => l.studentId !== studentId)
    this.persist()
    this.emit()
  }

  createClass(partial: Omit<SchoolClass, 'id'>) {
    const c: SchoolClass = { ...partial, id: `cls_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
    this.db.classes.push(c)
    this.persist()
    this.emit()
    return c
  }

  updateClass(id: string, patch: Partial<SchoolClass>) {
    const c = this.db.classes.find((x) => x.id === id)
    if (!c) return
    Object.assign(c, patch)
    for (const t of this.db.teachers) {
      if (t.classTeacherOfIds.includes(id) && t.id !== patch.classTeacherId) {
        t.classTeacherOfIds = t.classTeacherOfIds.filter((x) => x !== id)
      }
      if (patch.classTeacherId && t.id === patch.classTeacherId && !t.classTeacherOfIds.includes(id)) {
        t.classTeacherOfIds.push(id)
        if (!t.classIds.includes(id)) t.classIds.push(id)
      }
    }
    this.persist()
    this.emit()
  }

  updateTeacher(id: string, patch: Partial<Teacher> & { name?: string }) {
    const t = this.db.teachers.find((x) => x.id === id)
    if (!t) return
    if (patch.name) {
      const u = this.db.users.find((x) => x.id === t.userId)
      if (u) u.name = patch.name
    }
    const { name: _name, ...rest } = patch
    Object.assign(t, rest)
    const cids = new Set(t.classIds)
    for (const c of this.db.classes) {
      if (c.classTeacherId === t.id && !cids.has(c.id)) t.classIds.push(c.id)
      if (c.classTeacherId === t.id && !t.classTeacherOfIds.includes(c.id)) t.classTeacherOfIds.push(c.id)
    }
    this.persist()
    this.emit()
  }

  addSubject(name: string): Subject | null {
    const n = name.trim()
    if (!n) return null
    const existing = this.db.subjects.find((s) => s.name.toLowerCase() === n.toLowerCase())
    if (existing) return existing
    const palette = ['#097FE8', '#9849E8', '#27918D', '#FF6D00', '#9C7054', '#FFB110', '#E0447A', '#5FA94F', '#B45309', '#0EA5E9', '#DB2777', '#059669']
    const color = palette[this.db.subjects.length % palette.length]
    const s: Subject = { id: `sub_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: n, short: n.length > 8 ? n.slice(0, 7) + '…' : n, color }
    this.db.subjects.push(s)
    this.persist()
    this.emit()
    return s
  }

  /** Timetable writes assign a class to every teacher who appears in it (and to the class teacher). */
  private syncTeacherClasses(classId: string) {
    const inTimetable = this.db.timetable.filter((e) => e.classId === classId)
    for (const t of this.db.teachers) {
      const teaches = inTimetable.some((e) => e.teacherId === t.id)
      const isClassTeacher = t.classTeacherOfIds.includes(classId)
      if ((teaches || isClassTeacher) && !t.classIds.includes(classId)) t.classIds.push(classId)
    }
  }

  replaceClassTimetable(classId: string, entries: Omit<DB['timetable'][number], 'id'>[]) {
    this.db.timetable = this.db.timetable.filter((x) => x.classId !== classId)
    for (const e of entries) {
      this.db.timetable.push({ ...e, id: `tt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` })
    }
    this.syncTeacherClasses(classId)
    this.autoNotifyTimetable(classId, entries)
    this.persist()
    this.emit()
  }

  private autoNotifyTimetable(classId: string, entries: Omit<DB['timetable'][number], 'id'>[]) {
    const teacherIds = [...new Set(entries.map((e) => e.teacherId).filter(Boolean))]
    const userIds = teacherIds
      .map((tid) => this.db.teachers.find((t) => t.id === tid)?.userId)
      .filter((u): u is string => !!u)
    if (!userIds.length) return
    const cls = this.db.classes.find((c) => c.id === classId)
    const label = cls ? `${cls.name} ${cls.section}` : 'your class'
    this.sendNotification(userIds, 'Timetable generated', `The timetable for ${label} is ready. Check your assigned periods.`, 'timetable', 'medium', `/teacher/class-detail?classId=${classId}`)
  }

  addParentLink(parentId: string, studentId: string) {
    const code = `${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    const link: ParentStudentLink = { id: `plk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, parentId, studentId, code }
    this.db.parentLinks.push(link)
    this.persist()
    this.emit()
    return link
  }

  unlinkChild(parentId: string, studentId: string) {
    this.db.parentLinks = this.db.parentLinks.filter((l) => !(l.parentId === parentId && l.studentId === studentId))
    this.persist()
    this.emit()
  }

  linkChildByCode(parentId: string, code: string): { ok: boolean; message: string } {
    const link = this.db.parentLinks.find((l) => l.code.toLowerCase() === code.trim().toLowerCase())
    if (!link) return { ok: false, message: 'Invalid linking code. Ask your school for the correct code.' }
    if (link.parentId === parentId) return { ok: false, message: 'This child is already linked to your account.' }
    const taken = this.db.parentLinks.find((l) => l.parentId === parentId && l.studentId === link.studentId)
    if (taken) return { ok: false, message: 'This child is already linked to your account.' }
    this.db.parentLinks.push({ ...link, id: `plk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, parentId })
    this.persist()
    this.emit()
    return { ok: true, message: 'Child linked successfully.' }
  }

  updateTimetableEntry(id: string, patch: Partial<DB['timetable'][number]>) {
    const e = this.db.timetable.find((x) => x.id === id)
    if (e) {
      Object.assign(e, patch)
      this.syncTeacherClasses(e.classId)
    }
    this.persist()
    this.emit()
  }

  addTimetableEntry(partial: Omit<DB['timetable'][number], 'id'>) {
    const e = { ...partial, id: `tt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
    this.db.timetable.push(e)
    this.syncTeacherClasses(e.classId)
    this.persist()
    this.emit()
    return e
  }

  deleteTimetableEntry(id: string) {
    this.db.timetable = this.db.timetable.filter((x) => x.id !== id)
    this.persist()
    this.emit()
  }

  // ---------------- Notifications engine ----------------

  generateSystemNotifications() {
    const db = this.db
    const now = todayISO()
    const created: AppNotification[] = []
    const push = (userId: string, title: string, body: string, type: AppNotification['type'], priority: AppNotification['priority'], route?: string) => {
      const dup = db.notifications.find((n) => n.userId === userId && n.title === title && n.body === body)
      if (!dup) created.push({ id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, userId, title, body, type, priority, createdAt: toISO(new Date()), read: false, route })
    }

    // Assignment deadlines (students + parents)
    for (const sub of db.submissions) {
      const asg = db.assignments.find((a) => a.id === sub.assignmentId)
      if (!asg) continue
      const daysLeft = Math.round((new Date(asg.dueDate).getTime() - new Date(now).getTime()) / 86400000)
      const s = db.students.find((x) => x.id === sub.studentId)
      if (!s || sub.status === 'submitted') continue
      const parentIds = this.parentUserIdsForStudents([s.id])
      if (daysLeft === 1) {
        push(s.userId, 'Assignment due tomorrow', `"${asg.title}" (${subjectName(db, asg.subjectId)}) is due tomorrow.`, 'deadline', 'high')
        for (const pid of parentIds) push(pid, 'Assignment due tomorrow', `${this.studentDisplayName(s.id)} has "${asg.title}" due tomorrow.`, 'deadline', 'high')
      }
      if (daysLeft < 0) {
        push(s.userId, 'Assignment overdue', `"${asg.title}" is overdue. Please submit it soon.`, 'deadline', 'high')
        for (const pid of parentIds) push(pid, 'Assignment overdue', `${this.studentDisplayName(s.id)}'s "${asg.title}" is overdue.`, 'deadline', 'high')
      }
    }

    // Upcoming assessments (students + parents)
    for (const s of db.students) {
      for (const a of db.assessments.filter((a) => a.classId === s.classId && a.status === 'scheduled')) {
        const daysLeft = Math.round((new Date(a.date).getTime() - new Date(now).getTime()) / 86400000)
        if (daysLeft === 2) {
          push(s.userId, 'Assessment in 2 days', `${subjectName(db, a.subjectId)} ${a.title} is scheduled in 2 days.`, 'assessment', 'medium')
          for (const pid of this.parentUserIdsForStudents([s.id])) push(pid, `Assessment: ${this.studentDisplayName(s.id)}`, `${subjectName(db, a.subjectId)} ${a.title} is in 2 days.`, 'assessment', 'medium')
        }
      }
    }

    // Attendance warnings (students + parents)
    for (const s of db.students) {
      const week = db.attendance.filter((r) => r.studentId === s.id && r.date >= addDays(now, -7))
      if (week.length >= 4) {
        const absent = week.filter((r) => r.status === 'absent').length
        if (absent >= 2) {
          push(s.userId, 'Attendance warning', `You have ${absent} absences this week.`, 'attendance', 'medium')
          for (const l of db.parentLinks.filter((l) => l.studentId === s.id)) {
            const p = db.parents.find((x) => x.id === l.parentId)
            if (p) push(p.userId, `Attendance update: ${db.users.find((u) => u.id === s.userId)?.name}`, `Your child has ${absent} absences this week.`, 'attendance', 'medium')
          }
        }
      }
    }

    // Teacher: marking pending / attendance pending
    for (const t of db.teachers) {
      const pendingMarking = db.assessments.filter((a) => a.teacherId === t.id && a.status === 'scheduled' && a.date < now)
      if (pendingMarking.length) push(t.userId, 'Marking pending', `${pendingMarking.length} assessment(s) are past their date and need marks.`, 'assessment', 'medium')
      const today = db.attendance.some((r) => r.date === now && db.classes.some((c) => c.classTeacherId === t.id && c.id === r.classId))
      if (!today) push(t.userId, 'Attendance pending', 'Class attendance for today has not been marked yet.', 'attendance', 'medium')
    }

    if (created.length) {
      db.notifications.unshift(...created)
      this.persist()
      this.emit()
    }
  }
}

export const store = new Store()

export function useDB(): DB {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}

export function useSession(): { userId: string; role: Role } | null {
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSession(),
    () => null
  )
}

export function useCurrentUser(): User | null {
  const session = useSession()
  const db = useDB()
  if (!session) return null
  return db.users.find((u) => u.id === session.userId) ?? null
}

export function useStore() {
  const db = useDB()
  const session = useSession()
  return { db, session, user: session ? db.users.find((u) => u.id === session.userId) ?? null : null, cloudError: store.cloudError, schoolName: store.schoolName }
}

export function useAction<T extends (...args: never[]) => unknown>(fn: T): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(fn, []) as T
}

export const api = {
  login: (userId: string, role: Role) => store.login(userId, role),
  logout: () => store.logout(),
  resetDemo: () => store.resetDemo(),
  updateProfile: (userId: string, patch: Partial<Pick<User, 'name' | 'avatarUrl' | 'email'>>) => store.updateProfile(userId, patch),
  setCloudSync: (enabled: boolean) => store.setCloudSync(enabled),
  signInCloud: (email: string, password: string) => store.signInCloud(email, password),
  signUpSchoolAccount: (schoolName: string, adminName: string, email: string, password: string) => store.signUpSchoolAccount(schoolName, adminName, email, password),
  signOutCloudAccount: () => store.signOutCloudAccount(),
  createTeacherAccount: (o: Parameters<Store['createTeacherAccount']>[0]) => store.createTeacherAccount(o),
  createParentAccount: (o: Parameters<Store['createParentAccount']>[0]) => store.createParentAccount(o),
  createStudentAccount: (o: Parameters<Store['createStudentAccount']>[0]) => store.createStudentAccount(o),
  markAttendance: (r: Parameters<Store['markAttendance']>[0], by: string) => store.markAttendance(r, by),
  saveMarks: (e: Parameters<Store['saveMarks']>[0], by: string) => store.saveMarks(e, by),
  createAssessment: (p: Parameters<Store['createAssessment']>[0]) => store.createAssessment(p),
  createAssignment: (p: Parameters<Store['createAssignment']>[0]) => store.createAssignment(p),
  setSubmission: (a: string, s: string, st: DB['submissions'][number]['status'], sc?: number | null) => store.setSubmission(a, s, st, sc),
  createCalendarTask: (p: Parameters<Store['createCalendarTask']>[0]) => store.createCalendarTask(p),
  updateCalendarTask: (id: string, patch: Partial<CalendarTask>) => store.updateCalendarTask(id, patch),
  deleteCalendarTask: (id: string) => store.deleteCalendarTask(id),
  createIntervention: (p: Parameters<Store['createIntervention']>[0]) => store.createIntervention(p),
  completeIntervention: (id: string, r?: { beforeScore: number; afterScore: number; followUpAssessmentId: string }) => store.completeIntervention(id, r),
  sendNotification: (u: string[], t: string, b: string, type: AppNotification['type'], p: AppNotification['priority'], route?: string) => store.sendNotification(u, t, b, type, p, route),
  markNotificationRead: (id: string) => store.markNotificationRead(id),
  markAllNotificationsRead: (userId: string) => store.markAllNotificationsRead(userId),
  saveReport: (p: Parameters<Store['saveReport']>[0]) => store.saveReport(p),
  saveInsight: (p: Parameters<Store['saveInsight']>[0]) => store.saveInsight(p),
  dismissInsight: (id: string) => store.dismissInsight(id),
  createStudent: (s: Omit<Student, 'id'>, u: { name: string; email: string }) => store.createStudent(s, u),
  createTeacher: (t: Omit<Teacher, 'id'>, u: { name: string; email: string }) => store.createTeacher(t, u),
  deleteStudent: (id: string) => store.deleteStudent(id),
  createClass: (c: Omit<SchoolClass, 'id'>) => store.createClass(c),
  updateClass: (id: string, p: Partial<SchoolClass>) => store.updateClass(id, p),
  updateTeacher: (id: string, p: Partial<Teacher> & { name?: string }) => store.updateTeacher(id, p),
  addSubject: (name: string) => store.addSubject(name),
  replaceClassTimetable: (classId: string, entries: Omit<DB['timetable'][number], 'id'>[]) => store.replaceClassTimetable(classId, entries),
  addParentLink: (parentId: string, studentId: string) => store.addParentLink(parentId, studentId),
  linkChildByCode: (parentId: string, code: string) => store.linkChildByCode(parentId, code),
  unlinkChild: (parentId: string, studentId: string) => store.unlinkChild(parentId, studentId),
  updateTimetableEntry: (id: string, p: Partial<DB['timetable'][number]>) => store.updateTimetableEntry(id, p),
  addTimetableEntry: (p: Omit<DB['timetable'][number], 'id'>) => store.addTimetableEntry(p),
  deleteTimetableEntry: (id: string) => store.deleteTimetableEntry(id),
  generateSystemNotifications: () => store.generateSystemNotifications(),
}