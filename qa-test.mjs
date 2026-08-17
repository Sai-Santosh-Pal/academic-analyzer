import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut, deleteUser, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'

const cfg = {
  apiKey: 'AIzaSyB05t9ZbbJjzOug-zLTfZ2pt0Eh9aQ6oGY',
  authDomain: 'school-analyzer-7934d.firebaseapp.com',
  projectId: 'school-analyzer-7934d',
  storageBucket: 'school-analyzer-7934d.firebasestorage.app',
  messagingSenderId: '181286877673',
  appId: '1:181286877673:web:f5a34facc173f0b33a7378',
}

const app = initializeApp(cfg)
const auth = getAuth(app)
const db = getFirestore(app)
const email = `qa-test-${Date.now()}@example.com`

try {
  const cred = await createUserWithEmailAndPassword(auth, email, 'testpass123')
  const uid = cred.user.uid
  console.log('AUTH signUp: OK, uid =', uid)

  try {
    await setDoc(doc(db, 'users', uid), { role: 'admin', schoolId: 'school_' + uid.slice(0, 8), name: 'QA Test', email, avatarHue: 42 })
    console.log('FIRESTORE setDoc users/{uid}: OK')
  } catch (e) {
    console.log('FIRESTORE setDoc users/{uid}: FAILED ->', e.code ?? e.message)
  }
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    console.log('FIRESTORE getDoc users/{uid}: OK exists =', snap.exists())
  } catch (e) {
    console.log('FIRESTORE getDoc users/{uid}: FAILED ->', e.code ?? e.message)
  }
  try {
    const schoolId = 'school_' + uid.slice(0, 8)
    await setDoc(doc(db, 'schools', schoolId), { name: 'QA School', createdAt: Date.now() }, { merge: true })
    console.log('FIRESTORE setDoc schools/{schoolId}: OK')
    const snap2 = await getDoc(doc(db, 'schools', schoolId, 'state', 'latest'))
    console.log('FIRESTORE getDoc schools/{schoolId}/state/latest: OK exists =', snap2.exists())
  } catch (e) {
    console.log('FIRESTORE schools path: FAILED ->', e.code ?? e.message)
  }
  try {
    await deleteDoc(doc(db, 'users', uid)).catch(() => {})
    await deleteUser(cred.user)
    console.log('CLEANUP: test user deleted')
  } catch (e) {
    console.log('CLEANUP: failed ->', e.code ?? e.message)
  }
} catch (e) {
  console.log('AUTH signUp: FAILED ->', e.code ?? e.message)
  if ((e.code ?? '').includes('email-already-in-use')) {
    const cred = await signInWithEmailAndPassword(auth, email, 'testpass123').catch(() => null)
    console.log('(already existed — signed in:', !!cred, ')')
  }
}
process.exit(0)
