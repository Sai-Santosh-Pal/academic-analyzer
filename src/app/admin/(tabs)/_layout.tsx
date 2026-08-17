import React from 'react'
import { Tabs } from 'expo-router'
import { Icon } from '@/components/icons'
import { C } from '@/theme'

export default function AdminTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.text3,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: C.border, borderTopWidth: 1, height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'School', tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="people" options={{ title: 'People', tabBarIcon: ({ color, size }) => <Icon name="users" size={size} color={color} /> }} />
      <Tabs.Screen name="classes" options={{ title: 'Classes', tabBarIcon: ({ color, size }) => <Icon name="school" size={size} color={color} /> }} />
      <Tabs.Screen name="timetable" options={{ title: 'Timetable', tabBarIcon: ({ color, size }) => <Icon name="calendar" size={size} color={color} /> }} />
      <Tabs.Screen name="substitutions" options={{ title: 'Substitution', tabBarIcon: ({ color, size }) => <Icon name="refresh" size={size} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Icon name="grid" size={size} color={color} /> }} />
    </Tabs>
  )
}