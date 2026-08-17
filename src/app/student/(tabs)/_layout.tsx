import React from 'react'
import { Tabs } from 'expo-router'
import { Icon } from '@/components/icons'
import { C } from '@/theme'

export default function StudentTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.text3,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color, size }) => <Icon name="calendar" size={size} color={color} /> }} />
      <Tabs.Screen name="performance" options={{ title: 'Performance', tabBarIcon: ({ color, size }) => <Icon name="trend" size={size} color={color} /> }} />
      <Tabs.Screen name="coach" options={{ title: 'AI Coach', tabBarIcon: ({ color, size }) => <Icon name="sparkle" size={size} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Icon name="grid" size={size} color={color} /> }} />
    </Tabs>
  )
}