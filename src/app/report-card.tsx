import React, { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as Printing from 'expo-print'
import { useStore } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Btn, Chip, Notice, SectionHeader, Avatar } from '@/components/ui'
import { Icon } from '@/components/icons'
import { buildReportCardData } from '@/services/report-card'
import { buildZip } from '@/services/zip'
import { className, studentName } from '@/data/stats'

export default function ReportCardScreen() {
  const params = useLocalSearchParams<{ studentId?: string; classId?: string; bulk?: string }>()
  const { db, schoolName } = useStore()
  const [busy, setBusy] = useState<string | null>(null)
  const [lastUri, setLastUri] = useState<string | null>(null)

  const studentId = params.studentId ? String(params.studentId) : null
  const classId = params.classId ? String(params.classId) : null
  const bulk = params.bulk === '1'
  const students = classId
    ? db.students.filter((s) => s.classId === classId)
    : studentId
      ? db.students.filter((s) => s.id === studentId)
      : []

  const pdfBytes = (pdf: string): Uint8Array => {
    const bytes = new Uint8Array(pdf.length)
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
    return bytes
  }

  const writePdf = async (name: string, pdf: string): Promise<File> => {
    const file = new File(Paths.cache, name)
    file.create({ overwrite: true })
    file.write(pdfBytes(pdf))
    return file
  }

  const shareSingle = async () => {
    if (!students[0]) return
    setBusy('Generating PDF…')
    try {
      const data = buildReportCardData(db, students[0].id, schoolName)
      const file = await writePdf(data.fileName, data.pdf)
      setLastUri(file.uri)
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: 'Share report card' })
    } catch (e) {
      console.warn('share failed', e)
    } finally {
      setBusy(null)
    }
  }

  const printSingle = async () => {
    if (!students[0]) return
    setBusy('Preparing print…')
    try {
      const data = buildReportCardData(db, students[0].id, schoolName)
      const file = await writePdf(data.fileName, data.pdf)
      setLastUri(file.uri)
      await Printing.printAsync({ uri: file.uri })
    } catch (e) {
      console.warn('print failed', e)
    } finally {
      setBusy(null)
    }
  }

  const shareBulk = async () => {
    if (!students.length) return
    setBusy(`Generating ${students.length} report cards…`)
    try {
      const files: { name: string; data: Uint8Array }[] = []
      for (const s of students) {
        const data = buildReportCardData(db, s.id, schoolName)
        files.push({ name: data.fileName, data: pdfBytes(data.pdf) })
      }
      const zip = buildZip(files)
      const name = `ReportCards_${className(db, classId ?? '').replace(/[^A-Za-z0-9]/g, '')}.zip`
      const file = new File(Paths.cache, name)
      file.create({ overwrite: true })
      file.write(zip)
      setLastUri(file.uri)
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/zip', dialogTitle: 'Share report cards' })
    } catch (e) {
      console.warn('bulk failed', e)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Screen scroll>
      <Header title={bulk ? 'Class report cards' : 'Report card'} subtitle="Generated on-device from verified records" />

      {students[0] ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar name={studentName(db, students[0].id)} hue={db.users.find((u) => u.id === students[0].userId)?.avatarHue ?? 0} size={42} />
          <View style={{ flex: 1 }}>
            <Text style={F.h2}>{studentName(db, students[0].id)}</Text>
            <Text style={[F.caption, { marginTop: 1 }]}>{className(db, students[0].classId)}</Text>
          </View>
          <Chip label="A4 PDF" tone="info" />
        </Card>
      ) : null}

      {bulk ? (
        <>
          <Card style={{ marginTop: S.md }}>
            <Text style={[F.h2, { color: C.primary }]}>Bulk generation</Text>
            <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>
              A PDF report card is generated for every student in {className(db, classId ?? '')} ({students.length} students), then packaged into a single ZIP for sharing or printing.
            </Text>
            <Row gap={6} style={{ marginTop: S.sm, flexWrap: 'wrap' }}>
              <Chip label={`${students.length} students`} tone="neutral" />
              <Chip label="One click" tone="neutral" />
              <Chip label="ZIP output" tone="neutral" />
            </Row>
          </Card>
          <Btn label={`Generate & share ${students.length} report cards`} onPress={shareBulk} loading={!!busy} style={{ marginTop: S.md }} />
        </>
      ) : (
        <Card style={{ marginTop: S.md }}>
          <Text style={[F.h2, { color: C.primary }]}>Single report card</Text>
          <Text style={[F.body2, { marginTop: 6, lineHeight: 19 }]}>
            One-page PDF with overall %, grade, attendance, subject table (latest score, trend, grade) and teacher remarks. Numbers come from verified school records only.
          </Text>
          <Row gap={S.md} style={{ marginTop: S.md }}>
            <Btn label="Share PDF" onPress={shareSingle} loading={!!busy} style={{ flex: 1 }} />
            <Btn label="Print" variant="soft" onPress={printSingle} loading={!!busy} style={{ flex: 1 }} />
          </Row>
        </Card>
      )}

      {lastUri ? <Notice tone="success">Generated — saved as {lastUri.split('/').pop()}</Notice> : null}

      {busy ? (
        <Card style={{ marginTop: S.md, alignItems: 'center', paddingVertical: 26 }}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={[F.body2, { marginTop: 10 }]}>{busy}</Text>
        </Card>
      ) : null}

      <SectionHeader title="What's inside" />
      <Card>
        {[
          ['Header', 'School name, term, student details'],
          ['Summary', 'Overall %, grade, attendance'],
          ['Subjects', 'Latest score, trend arrow, grade per subject'],
          ['Remarks', 'Focus areas from real topic analysis'],
        ].map(([k, v]) => (
          <Row key={k} gap={10} style={{ paddingVertical: 6 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={12} color={C.primary} />
            </View>
            <Text style={[F.body2, { flex: 1 }]}>{k}</Text>
            <Text style={[F.caption, { flex: 1.4 }]}>{v}</Text>
          </Row>
        ))}
      </Card>
    </Screen>
  )
}