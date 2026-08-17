import React, { useEffect } from 'react'
import { LogBox } from 'react-native'
import { Stack, Redirect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { store, useSession } from '@/data/store'

// Upstream expo-router/React 19 dev-only warning: useLinking resolves the
// initial deep-link URL before the root mounts. Benign; no functional impact.
LogBox.ignoreLogs(["Can't perform a React state update on a component that hasn't mounted yet"])

export default function RootLayout() {
  const session = useSession()

  useEffect(() => {
    if (store.hydrated) {
      store.generateSystemNotifications()
    }
  }, [store.hydrated])

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="create-school" />
        <Stack.Screen name="student" />
        <Stack.Screen name="teacher" />
        <Stack.Screen name="parent" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="report-card" />
        <Stack.Screen name="timeline" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="notifications" />
      </Stack>
      {session ? null : <Redirect href="/" />}
    </>
  )
}