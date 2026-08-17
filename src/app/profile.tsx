import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useStore, api, store } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Avatar, Row, Divider, Notice, Btn } from '@/components/ui'
import { Icon } from '@/components/icons'
import { imgbbUpload, imgbbConfigured } from '@/services/imgbb'
import { studentByUser, teacherOf, parentOf, linkedChildren, classOf, attendanceStats, overallAvg, className } from '@/data/stats'

const ROLE_HOME: Record<string, string> = { student: '/student', teacher: '/teacher', parent: '/parent', admin: '/admin' }

export default function ProfileScreen() {
  const { db, user, session } = useStore()
  const router = useRouter()
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMsg, setPhotoMsg] = useState<string | null>(null)
  if (!user) return null
  const student = studentByUser(db, user.id)
  const teacher = teacherOf(db, user.id)
  const parent = parentOf(db, user.id)
  const children = parent ? linkedChildren(db, parent.id) : []

  const uploadPhoto = async () => {
    setPhotoMsg(null)
    if (!imgbbConfigured()) {
      setPhotoMsg('imgbb not configured — set EXPO_PUBLIC_IMGBB_KEY to enable photo uploads.')
      return
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      setPhotoMsg('Photo library permission denied.')
      return
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.6, allowsEditing: true })
    if (res.canceled || !res.assets[0]?.base64) return
    setPhotoBusy(true)
    try {
      const hosted = await imgbbUpload(res.assets[0].base64)
      if (hosted) {
        api.updateProfile(user.id, { avatarUrl: hosted.thumbUrl })
        setPhotoMsg('Photo uploaded and set as your avatar.')
      } else {
        setPhotoMsg('Upload failed — check your imgbb key.')
      }
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <Screen scroll>
      <Header title="Profile" subtitle={user.email} />
      <Card>
        <Row gap={14}>
          <Avatar name={user.name} hue={user.avatarHue} size={56} url={user.avatarUrl} />
          <View style={{ flex: 1 }}>
            <Text style={F.h1}>{user.name}</Text>
            <Text style={[F.caption, { marginTop: 2, textTransform: 'capitalize' }]}>{user.role} account</Text>
          </View>
        </Row>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.md }} onPress={uploadPhoto} disabled={photoBusy}>
          <Icon name="user" size={15} color={C.primary} />
          <Text style={[F.body, { color: C.primary, fontWeight: '700' }]}>{photoBusy ? 'Uploading…' : 'Upload profile photo'}</Text>
        </TouchableOpacity>
        {photoMsg ? <Text style={[F.caption, { marginTop: 6, color: C.text2 }]}>{photoMsg}</Text> : null}
        {student ? (
          <View style={{ marginTop: S.md }}>
            <Divider m={S.md} />
            <Text style={[F.h3, { color: C.primary }]}>{className(db, student.classId)} · Roll {student.rollNumber}</Text>
            <Row gap={S.md} style={{ marginTop: S.md }}>
              <Card style={{ flex: 1, padding: 12, backgroundColor: C.bg }}>
                <Text style={F.caption}>OVERALL</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.primary }}>{overallAvg(db, student.id) !== null ? `${Math.round(overallAvg(db, student.id)!)}%` : '—'}</Text>
              </Card>
              <Card style={{ flex: 1, padding: 12, backgroundColor: C.bg }}>
                <Text style={F.caption}>ATTENDANCE</Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: C.success }}>{attendanceStats(db, student.id).pct}%</Text>
              </Card>
            </Row>
          </View>
        ) : null}
        {teacher ? (
          <View style={{ marginTop: S.md }}>
            <Divider m={S.md} />
            <Text style={F.body2}>{teacher.classIds.length} classes · {teacher.subjectIds.length} subjects</Text>
            <Text style={[F.caption, { marginTop: 4 }]}>Class teacher of {teacher.classTeacherOfIds.map((c) => className(db, c)).join(', ') || '—'}</Text>
          </View>
        ) : null}
        {parent ? (
          <View style={{ marginTop: S.md }}>
            <Divider m={S.md} />
            <Text style={F.h3}>Linked children ({children.length})</Text>
            {children.map((c) => (
              <Text key={c.id} style={[F.body2, { marginTop: 4 }]}>· {user.name.split(' ')[0] && ''}{''}{''}</Text>
            ))}
          </View>
        ) : null}
      </Card>

      <Card style={{ marginTop: S.md }}>
        <Text style={F.h2}>Account</Text>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: S.md }} onPress={() => router.push('/notifications')}>
          <Icon name="bell" size={18} color={C.primary} />
          <Text style={[F.body, { flex: 1 }]}>Notifications</Text>
          <Icon name="chevron" size={16} color={C.text3} />
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => router.push('/timeline')}>
          <Icon name="clock" size={18} color={C.primary} />
          <Text style={[F.body, { flex: 1 }]}>Academic timeline</Text>
          <Icon name="chevron" size={16} color={C.text3} />
        </TouchableOpacity>
        {student ? (
          <>
            <Divider />
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => router.push(`/report-card?studentId=${student.id}`)}>
              <Icon name="file" size={18} color={C.primary} />
              <Text style={[F.body, { flex: 1 }]}>Report card</Text>
              <Icon name="chevron" size={16} color={C.text3} />
            </TouchableOpacity>
          </>
        ) : null}
      </Card>

      <Notice tone="info" >
        Demo environment — data is fictional. Stored locally by default; cloud sync (Firebase) is optional.
      </Notice>

      <Btn
        label="Sign out"
        variant="outline"
        onPress={() => {
          api.logout()
          store.generateSystemNotifications()
          router.replace('/')
        }}
        style={{ marginTop: S.lg, borderColor: C.danger + '55' }}
      />
    </Screen>
  )
}