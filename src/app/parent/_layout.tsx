import React from 'react'
import { Stack, Redirect } from 'expo-router'
import { useSession } from '@/data/store'

export default function ParentLayout() {
  const session = useSession()
  if (!session) return <Redirect href="/" />
  if (session.role !== 'parent') return <Redirect href={`/${session.role}`} />
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="children" />
      <Stack.Screen name="add-ward" />
      <Stack.Screen name="child-reports" />
      <Stack.Screen name="report" />
    </Stack>
  )
}