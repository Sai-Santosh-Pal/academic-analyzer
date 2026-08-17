// Auth bootstrap for web: browserLocalPersistence (localStorage) is the
// getAuth() default on web, so no extra setup is required.

import { FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

export function initAuth(app: FirebaseApp): Auth {
  return getAuth(app)
}