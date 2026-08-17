// Firebase bridge: auth (email/password), Realtime Database mirror for all
// textual data, and account provisioning for the school → teacher → parent →
// ward hierarchy. Images are hosted separately via the imgbb API.

import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateCurrentUser, Auth, User as AuthUser } from 'firebase/auth'
import { getDatabase, ref, set, get, onValue, Database } from 'firebase/database'
import { initAuth } from './auth-init'
import { DB, Role } from '@/data/types'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  databaseURL: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyB05t9ZbbJjzOug-zLTfZ2pt0Eh9aQ6oGY',
  authDomain: 'school-analyzer-7934d.firebaseapp.com',
  databaseURL: 'https://school-analyzer-7934d-default-rtdb.firebaseio.com',
  projectId: 'school-analyzer-7934d',
  storageBucket: 'school-analyzer-7934d.firebasestorage.app',
  messagingSenderId: '181286877673',
  appId: '1:181286877673:web:f5a34facc173f0b33a7378',
}

export function firebaseConfigFromEnv(): FirebaseConfig | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
      databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? `https://${projectId}-default-rtdb.firebaseio.com`,
      projectId,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
    }
  }
  return FIREBASE_CONFIG
}

let app: FirebaseApp | null = null
let rtdb: Database | null = null
let auth: Auth | null = null
let checked = false

export function firebaseReady(): boolean {
  if (checked && app) return true
  checked = true
  const cfg = firebaseConfigFromEnv()
  if (!cfg) return false
  try {
    app = getApps().length ? getApp() : initializeApp(cfg)
    auth = initAuth(app)
    rtdb = getDatabase(app)
    if (Platform.OS === 'web') {
      import('firebase/analytics')
        .then(({ getAnalytics }) => { getAnalytics(app!) })
        .catch(() => {})
    }
    return true
  } catch (e) {
    console.warn('Firebase init failed', e)
    app = null
    rtdb = null
    auth = null
    checked = false
    return false
  }
}

function defaultSchoolId(): string {
  return 'nova-heights-demo'
}

// ---------------- Auth ----------------

export function cloudAuthReady(): Auth | null {
  if (!firebaseReady()) return null
  return auth
}

/** Reject with a friendly offline message if the request never settles. */
async function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error('network-unreachable')), ms)
  })
  try {
    return await Promise.race([p, timeout])
  } finally {
    clearTimeout(timer)
  }
}

export interface CloudUserInfo {
  uid: string
  email: string
}

export function watchCloudAuth(cb: (u: CloudUserInfo | null) => void): () => void {
  const a = cloudAuthReady()
  if (!a) return () => {}
  return onAuthStateChanged(a, (u: AuthUser | null) => {
    cb(u ? { uid: u.uid, email: u.email ?? '' } : null)
  })
}

export async function signInEmail(email: string, password: string): Promise<{ ok: boolean; message: string }> {
  const a = cloudAuthReady()
  if (!a) return { ok: false, message: 'Firebase is not configured (EXPO_PUBLIC_FIREBASE_* env vars).' }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await withTimeout(signInWithEmailAndPassword(a, email.trim(), password), 10000)
      return { ok: true, message: '' }
    } catch (e: any) {
      const msg = friendlyAuthError(e)
      // Transient network failures get one automatic retry.
      if (attempt === 0 && msg.includes('reach the server')) continue
      return { ok: false, message: msg }
    }
  }
  return { ok: false, message: 'Can\u2019t reach the server — check your internet connection and try again.' }
}

export async function signUpSchool(schoolName: string, adminName: string, email: string, password: string): Promise<{ ok: boolean; message: string; uid?: string; schoolId?: string }> {
  const a = cloudAuthReady()
  if (!a) return { ok: false, message: 'Firebase is not configured.' }
  try {
    const cred = await withTimeout(createUserWithEmailAndPassword(a, email.trim(), password))
    const uid = cred.user.uid
    const schoolId = `school_${uid.slice(0, 8)}`
    const saved = await setUserProfile(uid, { role: 'admin', schoolId, name: adminName, email: email.trim(), avatarHue: Math.floor(Math.random() * 360) })
    if (!saved) {
      await cred.user.delete().catch(() => {})
      return { ok: false, message: rtdbNotReadyMessage() }
    }
    const meta = metaRef(schoolId)
    if (meta) await set(meta, { name: schoolName, createdAt: Date.now() }).catch(() => {})
    return { ok: true, message: '', uid, schoolId }
  } catch (e: any) {
    return { ok: false, message: friendlyAuthError(e) }
  }
}

export async function createSchoolAccount(role: Role, schoolId: string, name: string, email: string, password: string): Promise<{ ok: boolean; message: string; uid?: string }> {
  const a = cloudAuthReady()
  if (!a) return { ok: false, message: 'Firebase is not configured.' }
  const previous = a.currentUser
  try {
    const cred = await withTimeout(createUserWithEmailAndPassword(a, email.trim(), password))
    const uid = cred.user.uid
    const saved = await setUserProfile(uid, { role, schoolId, name, email: email.trim(), avatarHue: Math.floor(Math.random() * 360) })
    if (previous) {
      // createUserWithEmailAndPassword switches the device session to the new
      // account; restore the caller's session so the admin/parent stays signed in.
      await updateCurrentUser(a, previous).catch((e) => console.warn('session restore failed', e))
    }
    if (!saved) {
      await cred.user.delete().catch(() => {})
      return { ok: false, message: rtdbNotReadyMessage() }
    }
    return { ok: true, message: '', uid }
  } catch (e: any) {
    return { ok: false, message: friendlyAuthError(e) }
  }
}

export async function signOutCloud(): Promise<void> {
  const a = cloudAuthReady()
  if (!a) return
  try {
    await signOut(a)
  } catch (e) {
    console.warn('sign out failed', e)
  }
}

function friendlyAuthError(e: any): string {
  const code = e?.code ?? e?.message ?? ''
  if (code.includes('network-unreachable') || code.includes('network-request-failed') || code.includes('unavailable')) return 'Can\u2019t reach the server — check your internet connection and try again.'
  if (code.includes('email-already-in-use')) return 'An account with that email already exists.'
  if (code.includes('invalid-email')) return 'That email address looks invalid.'
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.'
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) return 'Incorrect email or password.'
  if (code.includes('too-many-requests')) return 'Too many attempts — try again in a minute.'
  return e?.message ?? 'Something went wrong. Try again.'
}

// ---------------- Profiles ----------------

export interface CloudUserProfile {
  role: Role
  schoolId: string
  name: string
  email: string
  avatarHue: number
  avatarUrl?: string
}

const PROFILE_CACHE_PREFIX = 'cloud-profile:'

async function cacheProfile(uid: string, profile: CloudUserProfile | null): Promise<void> {
  try {
    if (profile) await AsyncStorage.setItem(PROFILE_CACHE_PREFIX + uid, JSON.stringify(profile))
    else await AsyncStorage.removeItem(PROFILE_CACHE_PREFIX + uid)
  } catch {
    // Cache is best-effort; never fail profile loads over it.
  }
}

async function cachedProfile(uid: string): Promise<CloudUserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_CACHE_PREFIX + uid)
    return raw ? (JSON.parse(raw) as CloudUserProfile) : null
  } catch {
    return null
  }
}

const IDENTITY_CACHE_PREFIX = 'cloud-identity:'

/** Persist the last-known identity so sign-in can survive RTDB hiccups. */
export async function cacheCloudIdentity(uid: string, identity: { role: Role; schoolId: string; name: string }): Promise<void> {
  try {
    await AsyncStorage.setItem(IDENTITY_CACHE_PREFIX + uid, JSON.stringify(identity))
  } catch {
    // Best-effort cache.
  }
}

export async function cachedCloudIdentity(uid: string): Promise<{ role: Role; schoolId: string; name: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(IDENTITY_CACHE_PREFIX + uid)
    return raw ? (JSON.parse(raw) as { role: Role; schoolId: string; name: string }) : null
  } catch {
    return null
  }
}

function isOfflineError(e: any): boolean {
  const code = String(e?.code ?? '').toLowerCase()
  const message = e?.message ?? ''
  return code === 'unavailable' || code === 'failed-precondition' || code === 'network_error' || message.includes('offline') || message.includes('network')
}

function isPermissionError(e: any): boolean {
  const code = String(e?.code ?? '').toLowerCase()
  const message = e?.message ?? ''
  return code === 'permission-denied' || code === 'permission_denied' || message.includes('permission denied')
}

function isRtdbMissingError(e: any): boolean {
  const message = e?.message ?? ''
  return message.includes('was not found') || message.includes('does not exist') || message.includes('has not been used') || message.includes('is disabled')
}

function rtdbNotReadyMessage(): string {
  return 'The Firebase Realtime Database is not set up for this project. Create it in the Firebase console, then try again.'
}

/** Server-first read; the SDK serves cached data when offline. */
async function readNodeOrNull(path: string) {
  if (!rtdb) throw new Error('rtdb-unavailable')
  return withTimeout(get(ref(rtdb, path)), 8000)
}

/**
 * Server-first profile read (cached fallback when offline).
 * Returns the profile, `null` when the node definitively does not exist yet
 * (the profile write races the auth listener during sign-up), or `undefined`
 * on transient failures (offline / permissions / RTDB not provisioned).
 */
export async function getUserProfile(uid: string): Promise<CloudUserProfile | null | undefined> {
  if (!firebaseReady() || !rtdb) return cachedProfile(uid)
  try {
    const snap = await readNodeOrNull(`users/${uid}`)
    if (!snap.exists()) {
      await cacheProfile(uid, null)
      return null
    }
    const profile = snap.val() as CloudUserProfile
    await cacheProfile(uid, profile)
    await cacheCloudIdentity(uid, { role: profile.role, schoolId: profile.schoolId, name: profile.name })
    return profile
  } catch (e) {
    const cached = await cachedProfile(uid)
    if (cached) return cached
    if (isOfflineError(e)) return undefined
    if (isPermissionError(e) || isRtdbMissingError(e)) {
      console.warn('getUserProfile failed', (e as any)?.code ?? (e as any)?.message)
      return undefined
    }
    console.warn('getUserProfile failed', e)
    return undefined
  }
}

export async function setUserProfile(uid: string, profile: CloudUserProfile): Promise<boolean> {
  if (!firebaseReady() || !rtdb) return false
  try {
    await withTimeout(set(ref(rtdb, `users/${uid}`), stripUndefined(profile)), 10000)
    await cacheProfile(uid, profile)
    return true
  } catch (e) {
    console.warn('setUserProfile failed', e)
    return false
  }
}

// ---------------- Per-school data mirror ----------------

function metaRef(schoolId: string) {
  if (!firebaseReady() || !rtdb) return null
  return ref(rtdb, `schools/${schoolId}/meta`)
}

function stateRef(schoolId: string) {
  if (!firebaseReady() || !rtdb) return null
  return ref(rtdb, `schools/${schoolId}/state`)
}

export interface CloudState {
  db: DB
  updatedAt: number
}

export async function getSchoolMeta(schoolId: string): Promise<{ name: string } | null> {
  if (!firebaseReady() || !rtdb) return null
  try {
    const snap = await readNodeOrNull(`schools/${schoolId}/meta`)
    if (!snap.exists()) return null
    const d = snap.val() as { name?: string }
    return { name: d.name ?? 'School' }
  } catch (e) {
    console.warn('getSchoolMeta failed', e)
    return null
  }
}

/** Push the full school DB snapshot to the Realtime Database. */
/** RTDB rejects undefined values; recursively strip them before any write. */
function stripUndefined(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripUndefined)
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val !== undefined) out[k] = stripUndefined(val)
    }
    return out
  }
  return v
}

export async function pushCloudState(schoolId: string, db: DB, updatedAt: number): Promise<boolean> {
  const r = stateRef(schoolId)
  if (!r) return false
  try {
    await withTimeout(set(r, { db: stripUndefined(db), updatedAt }), 10000)
    return true
  } catch (e) {
    console.warn('RTDB push failed', e)
    return false
  }
}

const DB_ARRAY_FIELDS: (keyof DB)[] = [
  'users', 'students', 'teachers', 'parents', 'parentLinks', 'classes', 'subjects',
  'assessments', 'marks', 'attendance', 'assignments', 'submissions', 'timetable',
  'notifications', 'calendarTasks', 'interventions', 'interventionResults', 'leaves', 'timelineEvents', 'reports', 'insights',
]

/** RTDB omits empty arrays; restore them so screens never hit undefined. */
export function normalizeDb(raw: Partial<DB> | undefined): DB {
  const out = {} as Record<keyof DB, unknown[]>
  for (const f of DB_ARRAY_FIELDS) out[f] = Array.isArray(raw?.[f]) ? (raw![f] as unknown[]) : []
  const db = out as DB
  for (const t of db.teachers) {
    if (!Array.isArray(t.subjectIds)) t.subjectIds = []
    if (!Array.isArray(t.classIds)) t.classIds = []
    if (!Array.isArray(t.classTeacherOfIds)) t.classTeacherOfIds = []
    if (typeof t.workload !== 'number') t.workload = 40
  }
  for (const c of db.classes) {
    if (!Array.isArray(c.subjectIds)) c.subjectIds = []
    if (typeof c.classTeacherId !== 'string') c.classTeacherId = ''
  }
  for (const s of db.students) {
    if (typeof s.gender !== 'string') s.gender = 'M'
    if (typeof s.attendanceProfile !== 'string') s.attendanceProfile = 'normal'
    if (typeof s.performanceProfile !== 'string') s.performanceProfile = 'stable'
  }
  for (const l of db.leaves) {
    if (!Array.isArray(l.periods)) l.periods = []
    if (typeof l.status !== 'string') l.status = 'pending'
  }
  return db
}

/** Pull the latest school DB snapshot, or null if none exists. */
export async function pullCloudState(schoolId: string): Promise<CloudState | null> {
  if (!firebaseReady() || !rtdb) return null
  try {
    const snap = await readNodeOrNull(`schools/${schoolId}/state`)
    if (!snap.exists()) return null
    const data = snap.val() as { db?: DB; updatedAt?: number }
    if (!data.db?.users?.length) return null
    return { db: normalizeDb(data.db), updatedAt: data.updatedAt ?? 0 }
  } catch (e) {
    console.warn('RTDB pull failed', e)
    return null
  }
}

/** Subscribe to remote changes for a school. Returns unsubscribe. */
export function listenCloudState(schoolId: string, cb: (state: CloudState) => void): () => void {
  const r = stateRef(schoolId)
  if (!r) return () => {}
  return onValue(
    r,
    (snap) => {
      if (!snap.exists()) return
      const data = snap.val() as { db?: DB; updatedAt?: number }
      if (data.db?.users?.length) cb({ db: normalizeDb(data.db), updatedAt: data.updatedAt ?? 0 })
    },
    (e) => console.warn('RTDB listener error', e)
  )
}

export { defaultSchoolId }