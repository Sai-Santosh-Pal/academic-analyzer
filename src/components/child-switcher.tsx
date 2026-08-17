import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore } from '@/data/store'
import { useSelectedChildId, setSelectedChildId } from '@/data/parent-select'
import { C, F, S } from '@/theme'
import { Avatar } from './ui'
import { parentOf, linkedChildren, classOf, className } from '@/data/stats'
import { Icon } from './icons'

export function ChildSwitcher({ compact }: { compact?: boolean }) {
  const { db, user } = useStore()
  const router = useRouter()
  const selected = useSelectedChildId()
  const parent = parentOf(db, user?.id ?? '')
  if (!parent) return null
  const children = linkedChildren(db, parent.id)
  const active = selected ?? children[0]?.id ?? null

  if (!children.length) return null

  if (compact) {
    return (
      <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={[F.micro, { fontSize: 9 }]}>VIEWING</Text>
          <Text style={[F.h3, { marginTop: 1 }]}>
            {children.find((c) => c.id === active) ? db.users.find((u) => u.id === children.find((c) => c.id === active)!.userId)?.name : ''}
          </Text>
        </View>
        {children.map((c) => {
          const u = db.users.find((x) => x.id === c.userId)!
          return (
            <TouchableOpacity key={c.id} onPress={() => setSelectedChildId(c.id)} activeOpacity={0.8} style={{ opacity: c.id === active ? 1 : 0.45 }}>
              <Avatar name={u.name} hue={u.avatarHue} size={34} ring={c.id === active} />
            </TouchableOpacity>
          )
        })}
        <TouchableOpacity onPress={() => router.push('/parent/children')} hitSlop={8} style={{ padding: 4 }}>
          <Icon name="chevron" size={16} color={C.text3} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {children.map((c) => {
        const u = db.users.find((x) => x.id === c.userId)!
        const cl = classOf(db, c.id)!
        const sel = c.id === active
        return (
          <TouchableOpacity key={c.id} activeOpacity={0.85} onPress={() => setSelectedChildId(c.id)} style={{ flex: 1, backgroundColor: sel ? C.primary : C.card, borderRadius: 16, padding: 12, borderWidth: 1.5, borderColor: sel ? C.primary : C.border, alignItems: 'center' }}>
            <Avatar name={u.name} hue={u.avatarHue} size={40} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: sel ? '#fff' : C.text, marginTop: 6 }}>{u.name.split(' ')[0]}</Text>
            <Text style={{ fontSize: 10.5, fontWeight: '700', color: sel ? 'rgba(255,255,255,0.85)' : C.text3, marginTop: 1 }}>{cl ? `${cl.name} ${cl.section}` : '—'}</Text>
          </TouchableOpacity>
        )
      })}
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/parent/children')} style={{ flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={18} color={C.primary} />
        </View>
        <Text style={{ fontSize: 13, fontWeight: '800', color: C.text, marginTop: 6 }}>Add child</Text>
        <Text style={{ fontSize: 10.5, fontWeight: '700', color: C.text3, marginTop: 1 }}>linking code</Text>
      </TouchableOpacity>
    </View>
  )
}