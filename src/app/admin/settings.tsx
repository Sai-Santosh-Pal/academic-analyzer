import React from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useStore, api, store } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Btn, Notice, Chip } from '@/components/ui'
import { schoolStats } from '@/data/stats'

export default function AdminSettings() {
  const { db } = useStore()
  const router = useRouter()
  const stats = schoolStats(db)
  const cloudAvailable = store.cloudAvailable
  const cloudOn = store.cloudSyncEnabled
  const lastSync = store.cloudLastSync

  return (
    <Screen scroll>
      <Header title="Settings" subtitle="School details & data management" />

      <Card>
        <Text style={[F.h3, { color: C.primary }]}>School profile</Text>
        <Row between style={{ paddingVertical: 6, marginTop: 6 }}>
          <Text style={F.body2}>School name</Text>
          <Text style={[F.body2, { fontWeight: '800' }]}>{store.schoolName}</Text>
        </Row>
        <Row between style={{ paddingVertical: 6 }}>
          <Text style={F.body2}>Academic year</Text>
          <Text style={[F.body2, { fontWeight: '800' }]}>2026–27</Text>
        </Row>
        <Row between style={{ paddingVertical: 6 }}>
          <Text style={F.body2}>Students</Text>
          <Text style={[F.body2, { fontWeight: '800' }]}>{stats.students}</Text>
        </Row>
        <Row between style={{ paddingVertical: 6 }}>
          <Text style={F.body2}>Teachers</Text>
          <Text style={[F.body2, { fontWeight: '800' }]}>{stats.teachers}</Text>
        </Row>
        <Row between style={{ paddingVertical: 6 }}>
          <Text style={F.body2}>Parents</Text>
          <Text style={[F.body2, { fontWeight: '800' }]}>{stats.parents}</Text>
        </Row>
      </Card>

      <Card style={{ marginTop: S.md }}>
        <Text style={[F.h3, { color: C.primary }]}>Cloud sync (Firebase)</Text>
        <Text style={[F.body2, { marginTop: 4, lineHeight: 18 }]}>
          When enabled, the full school dataset is mirrored to the Firebase Realtime Database and kept in sync across devices in real time. Configured via EXPO_PUBLIC_FIREBASE_* env vars.
        </Text>
        <Row between style={{ marginTop: S.md }}>
          <View style={{ flex: 1 }}>
            <Text style={[F.body2, { fontWeight: '700' }]}>Status</Text>
            <Text style={[F.caption, { marginTop: 2 }]}>
              {!cloudAvailable ? 'Firebase not configured — add EXPO_PUBLIC_FIREBASE_API_KEY and PROJECT_ID to enable.' : cloudOn ? `Sync enabled${lastSync ? ` · last sync ${new Date(lastSync).toLocaleTimeString()}` : ''}` : 'Sync disabled'}
            </Text>
          </View>
          <Chip label={cloudOn ? 'On' : 'Off'} tone={cloudOn ? 'good' : 'neutral'} />
        </Row>
        <Btn
          label={cloudOn ? 'Disable cloud sync' : 'Enable cloud sync'}
          variant={cloudOn ? 'outline' : 'primary'}
          size="sm"
          disabled={!cloudAvailable}
          onPress={() => api.setCloudSync(!cloudOn)}
          style={{ marginTop: S.md }}
        />
      </Card>

      <Card style={{ marginTop: S.md, backgroundColor: C.warningSoft, borderColor: C.warning + '44' }}>
        <Text style={[F.h3, { color: C.warning }]}>Danger zone</Text>
        <Text style={[F.body2, { marginTop: 4, lineHeight: 18 }]}>Reset wipes all local data and restores the original demo dataset. This cannot be undone.</Text>
        <Btn
          label="Reset demo data"
          variant="danger"
          style={{ marginTop: S.md }}
          onPress={() => { api.resetDemo(); router.replace('/') }}
        />
      </Card>

      <Notice tone="info">This demo runs fully on-device. Cloud sync (Firebase) is optional and must be explicitly enabled by the administrator.</Notice>
    </Screen>
  )
}