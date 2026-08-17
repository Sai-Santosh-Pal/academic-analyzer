import React from 'react'
import { Stack, Redirect } from 'expo-router'
import { useSession } from '@/data/store'

export default function StudentLayout() {
  const session = useSession()
  if (!session) return <Redirect href="/" />
  if (session.role !== 'student') return <Redirect href={`/${session.role}`} />
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="assessments" />
      <Stack.Screen name="assignments" />
      <Stack.Screen name="timetable" />
      <Stack.Screen name="subjects" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="what-changed" />
      <Stack.Screen name="study-plan" />
      <Stack.Screen name="copilot" />
      <Stack.Screen name="report" />
    </Stack>
  )
}