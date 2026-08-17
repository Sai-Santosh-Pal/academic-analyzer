import React from 'react'
import { Tabs } from 'expo-router'
import { Icon } from '@/components/icons'
import { C } from '@/theme'

export default function TeacherTabs() {
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
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="classes" options={{ title: 'Classes', tabBarIcon: ({ color, size }) => <Icon name="school" size={size} color={color} /> }} />
      <Tabs.Screen name="students" options={{ title: 'Students', tabBarIcon: ({ color, size }) => <Icon name="users" size={size} color={color} /> }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarIcon: ({ color, size }) => <Icon name="trend" size={size} color={color} /> }} />
      <Tabs.Screen name="ai" options={{ title: 'AI Tools', tabBarIcon: ({ color, size }) => <Icon name="sparkle" size={size} color={color} /> }} />
    </Tabs>
  )
}