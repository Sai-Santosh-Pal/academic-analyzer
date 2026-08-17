// Auth bootstrap for native builds: persist the session via AsyncStorage so
// signed-in users survive app restarts (default getAuth() is memory-only on RN).
//
// firebase 12 removed the React Native build (and with it the runtime export of
// getReactNativePersistence), so we provide the equivalent persistence here:
// initializeAuth expects a *class* (it does `new cls()` and asserts the value
// is a function), with instances implementing the internal Persistence surface
// (_isAvailable/_set/_get/_remove). This mirrors @firebase/auth's RN
// implementation exactly.

import { FirebaseApp } from 'firebase/app'
import { initializeAuth, getAuth, Auth, Persistence } from 'firebase/auth'
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'

const PROBE_KEY = '__firebase_rn_storage_available__'

function rnPersistence(storage: typeof ReactNativeAsyncStorage): { new (): Persistence } {
  return class implements Persistence {
    type = 'LOCAL' as const

    async _isAvailable(): Promise<boolean> {
      try {
        if (!storage) return false
        await storage.setItem(PROBE_KEY, '1')
        await storage.removeItem(PROBE_KEY)
        return true
      } catch {
        return false
      }
    }

    _set(key: string, value: string): Promise<void> {
      return storage.setItem(key, JSON.stringify(value))
    }

    async _get(key: string): Promise<string | null> {
      const json = await storage.getItem(key)
      return json ? JSON.parse(json) : null
    }

    _remove(key: string): Promise<void> {
      return storage.removeItem(key)
    }

    _addListener(_key: string, _listener: () => void): void {
      // Listeners are not supported for React Native storage.
    }

    _removeListener(_key: string, _listener: () => void): void {
      // Listeners are not supported for React Native storage.
    }
  }
}

export function initAuth(app: FirebaseApp): Auth {
  try {
    // The runtime contract expects a *class* (the SDK does `new cls()`), even
    // though the public types declare instances — hence the cast.
    return initializeAuth(app, {
      persistence: rnPersistence(ReactNativeAsyncStorage) as unknown as Persistence,
    })
  } catch (e) {
    // Already initialized (e.g. a retry after a partial failure) — reuse it.
    console.warn('initializeAuth: reusing existing instance', e)
    return getAuth(app)
  }
}