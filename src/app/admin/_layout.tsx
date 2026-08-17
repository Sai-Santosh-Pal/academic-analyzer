import React from 'react'
import { Stack, Redirect } from 'expo-router'
import { useSession } from '@/data/store'

export default function AdminLayout() {
  const session = useSession()
  if (!session) return <Redirect href="/" />
  if (session.role !== 'admin') return <Redirect href={`/${session.role}`} />
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-teacher" />
      <Stack.Screen name="student-detail" />
      <Stack.Screen name="class-detail" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}