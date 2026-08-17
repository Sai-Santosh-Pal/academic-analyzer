import React from 'react'
import { Stack, Redirect } from 'expo-router'
import { useSession } from '@/data/store'

export default function TeacherLayout() {
  const session = useSession()
  if (!session) return <Redirect href="/" />
  if (session.role !== 'teacher') return <Redirect href={`/${session.role}`} />
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="class-detail" />
      <Stack.Screen name="add-parent" />
      <Stack.Screen name="add-student" />
      <Stack.Screen name="student-detail" />
      <Stack.Screen name="mark-attendance" />
      <Stack.Screen name="assessment-detail" />
      <Stack.Screen name="enter-marks" />
      <Stack.Screen name="interventions" />
      <Stack.Screen name="lesson-planner" />
      <Stack.Screen name="contact-parent" />
      <Stack.Screen name="ai-tools" />
      <Stack.Screen name="notify" />
      <Stack.Screen name="reports" />
    </Stack>
  )
}