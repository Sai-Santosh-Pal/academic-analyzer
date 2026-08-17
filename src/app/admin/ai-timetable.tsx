import React, { useState } from 'react'
import { View, Text, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Row, Chip, Btn, Notice, SectionHeader } from '@/components/ui'
import { generateClassTimetable, slotsToEntries, GeneratedSlot, TimetableConflict } from '@/ai/timetable'
import { weekdayName } from '@/utils/date'

const PERIOD_OPTIONS = [5, 6, 7, 8, 9, 10]
const DURATION_OPTIONS = [30, 35, 40, 45, 50, 60]
const DAY_OPTIONS = [5, 6, 7]
const BREAK_OPTIONS = [5, 10, 15, 20, 30]
const LUNCH_OPTIONS = [30, 40, 45, 60]

export default function AITimetableScreen() {
  const params = useLocalSearchParams<{ classId: string }>()
  const { db } = useStore()
  const router = useRouter()
  const cls = db.classes.find((c) => c.id === String(params.classId))

  const [days, setDays] = useState(5)
  const [periods, setPeriods] = useState(8)
  const [duration, setDuration] = useState(40)
  const [startTime, setStartTime] = useState('09:00')
  const [breakAfter, setBreakAfter] = useState(3)
  const [breakMinutes, setBreakMinutes] = useState(10)
  const [lunchAfter, setLunchAfter] = useState(6)
  const [lunchMinutes, setLunchMinutes] = useState(40)
  const [zeroPeriod, setZeroPeriod] = useState(true)
  const [extraInfo, setExtraInfo] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ slots: GeneratedSlot[]; notes: string[]; conflicts: TimetableConflict[]; source: 'ai' | 'local' } | null>(null)
  const [saved, setSaved] = useState(false)

  if (!cls) return <Screen><Header title="AI timetable" /><Text style={{ padding: S.lg }}>Class not found.</Text></Screen>

  const generate = async () => {
    setError(null)
    setResult(null)
    setSaved(false)
    if (breakAfter >= periods) { setError('Break must come after a period that exists.'); return }
    if (lunchAfter >= periods) { setError('Lunch must come after a period that exists.'); return }
    if (!/^\d{1,2}:\d{2}$/.test(startTime.trim())) { setError('Start time must look like 09:00.'); return }
    setBusy(true)
    try {
      const res = await generateClassTimetable(db, {
        classId: cls.id,
        days, periodsPerDay: periods, periodMinutes: duration,
        startTime: startTime.trim(), breakAfter, breakMinutes, lunchAfter, lunchMinutes,
        zeroPeriod, extraInfo,
      })
      if (res.error) setError(res.error)
      if (res.slots.length) setResult({ slots: res.slots, notes: res.issues, conflicts: res.conflicts, source: res.source })
      else setError(res.error ?? 'Could not generate a valid timetable. Adjust the settings and try again.')
    } catch (e) {
      setError(`Generation failed: ${String(e).slice(0, 120)}`)
    } finally {
      setBusy(false)
    }
  }

  const accept = () => {
    if (!result) return
    api.replaceClassTimetable(cls.id, slotsToEntries(result.slots, {
      classId: cls.id, days, periodsPerDay: periods, periodMinutes: duration,
      startTime: startTime.trim(), breakAfter, breakMinutes, lunchAfter, lunchMinutes,
      zeroPeriod, extraInfo,
    }))
    setSaved(true)
  }

  const assignConflict = (c: TimetableConflict, teacherId: string) => {
    setResult((prev) => {
      if (!prev) return prev
      const slots = prev.slots.map((s) => (s.day === c.day && s.period === c.period && !s.teacherId ? { ...s, teacherId } : s))
      const conflicts = prev.conflicts.filter((x) => !(x.day === c.day && x.period === c.period))
      return { ...prev, slots, conflicts }
    })
  }

  const autoFix = () => {
    setResult((prev) => {
      if (!prev) return prev
      let slots = prev.slots
      const remaining: TimetableConflict[] = []
      for (const c of prev.conflicts) {
        if (c.candidates.length) {
          slots = slots.map((s) => (s.day === c.day && s.period === c.period && !s.teacherId ? { ...s, teacherId: c.candidates[0].id } : s))
        } else {
          remaining.push(c)
        }
      }
      return { ...prev, slots, conflicts: remaining }
    })
  }

  const existing = db.timetable.filter((t) => t.classId === cls.id).length

  return (
    <Screen scroll>
      <Header title="AI timetable" subtitle={`${cls.name} ${cls.section} · generated with a thinking model`} />
      {existing > 0 ? <Notice tone="warn">This class already has {existing} scheduled period(s). Generating will replace them.</Notice> : null}

      <SectionHeader title="School schedule" />
      <Card>
        <Text style={[F.caption, { marginBottom: 6 }]}>SCHOOL DAYS PER WEEK</Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {DAY_OPTIONS.map((d) => <Chip key={d} label={`${d} days`} tone={days === d ? 'info' : 'neutral'} onPress={() => setDays(d)} selected={days === d} />)}
        </Row>

        <Text style={[F.caption, { marginTop: S.md, marginBottom: 6 }]}>PERIODS PER DAY</Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {PERIOD_OPTIONS.map((p) => <Chip key={p} label={`${p}`} tone={periods === p ? 'info' : 'neutral'} onPress={() => setPeriods(p)} selected={periods === p} />)}
        </Row>

        <Text style={[F.caption, { marginTop: S.md, marginBottom: 6 }]}>PERIOD DURATION (MINUTES)</Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {DURATION_OPTIONS.map((d) => <Chip key={d} label={`${d} min`} tone={duration === d ? 'info' : 'neutral'} onPress={() => setDuration(d)} selected={duration === d} />)}
        </Row>
        <TextInput value={String(duration)} onChangeText={(t) => setDuration(Math.max(5, Math.min(120, Number(t) || 0)))} placeholder="Custom minutes" placeholderTextColor={C.text3} keyboardType="number-pad" style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff', maxWidth: 140, marginTop: S.sm }} />

        <Text style={[F.caption, { marginTop: S.md, marginBottom: 6 }]}>START TIME</Text>
        <TextInput value={startTime} onChangeText={setStartTime} placeholder="09:00" placeholderTextColor={C.text3} style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff', maxWidth: 140 }} />

        <Text style={[F.caption, { marginTop: S.md, marginBottom: 6 }]}>ZERO PERIOD (CLASS TEACHER)</Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Chip label="On — class teacher sits in the class" tone={zeroPeriod ? 'good' : 'neutral'} onPress={() => setZeroPeriod(true)} selected={zeroPeriod} />
          <Chip label="Off" tone={!zeroPeriod ? 'neutral' : 'info'} onPress={() => setZeroPeriod(false)} selected={!zeroPeriod} />
        </Row>
        <Text style={[F.caption, { marginTop: 6, lineHeight: 17 }]}>
          {zeroPeriod ? 'Every day starts with a zero period: the class teacher sits in the class with the students before period 1. It is not part of the scheduled grid.' : 'No zero period — the day starts directly at period 1.'}
        </Text>
      </Card>

      <SectionHeader title="Breaks" />
      <Card>
        <Text style={[F.caption, { marginBottom: 6 }]}>SHORT BREAK AFTER PERIOD</Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Chip label="None" tone={breakAfter === 0 ? 'neutral' : 'info'} onPress={() => setBreakAfter(0)} selected={breakAfter === 0} />
          {Array.from({ length: periods - 1 }, (_, i) => i + 1).map((p) => (
            <Chip key={p} label={`after P${p}`} tone={breakAfter === p ? 'info' : 'neutral'} onPress={() => setBreakAfter(p)} selected={breakAfter === p} />
          ))}
        </Row>
        {breakAfter > 0 ? (
          <>
            <Text style={[F.caption, { marginTop: S.md, marginBottom: 6 }]}>BREAK DURATION</Text>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {BREAK_OPTIONS.map((m) => <Chip key={m} label={`${m} min`} tone={breakMinutes === m ? 'info' : 'neutral'} onPress={() => setBreakMinutes(m)} selected={breakMinutes === m} />)}
            </Row>
            <TextInput value={String(breakMinutes)} onChangeText={(t) => setBreakMinutes(Math.max(1, Math.min(120, Number(t) || 0)))} placeholder="Custom minutes" placeholderTextColor={C.text3} keyboardType="number-pad" style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff', maxWidth: 140, marginTop: S.sm }} />
          </>
        ) : null}

        <Text style={[F.caption, { marginTop: S.md, marginBottom: 6 }]}>LUNCH AFTER PERIOD</Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Chip label="None" tone={lunchAfter === 0 ? 'neutral' : 'info'} onPress={() => setLunchAfter(0)} selected={lunchAfter === 0} />
          {Array.from({ length: periods - 1 }, (_, i) => i + 1).map((p) => (
            <Chip key={p} label={`after P${p}`} tone={lunchAfter === p ? 'info' : 'neutral'} onPress={() => setLunchAfter(p)} selected={lunchAfter === p} />
          ))}
        </Row>
        {lunchAfter > 0 ? (
          <>
            <Text style={[F.caption, { marginTop: S.md, marginBottom: 6 }]}>LUNCH DURATION</Text>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {LUNCH_OPTIONS.map((m) => <Chip key={m} label={`${m} min`} tone={lunchMinutes === m ? 'info' : 'neutral'} onPress={() => setLunchMinutes(m)} selected={lunchMinutes === m} />)}
            </Row>
            <TextInput value={String(lunchMinutes)} onChangeText={(t) => setLunchMinutes(Math.max(1, Math.min(180, Number(t) || 0)))} placeholder="Custom minutes" placeholderTextColor={C.text3} keyboardType="number-pad" style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff', maxWidth: 140, marginTop: S.sm }} />
          </>
        ) : null}
      </Card>

      <SectionHeader title="Extra instructions" />
      <Card>
        <TextInput
          value={extraInfo}
          onChangeText={setExtraInfo}
          placeholder={'Anything the AI must follow, e.g.:\n"EVS every day first period"\n"PE only on Wednesday"\n"No classes after 2pm on Friday"\n"Hindi twice a week"'}
          placeholderTextColor={C.text3}
          multiline
          style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 110, backgroundColor: '#fff', textAlignVertical: 'top' }}
        />
        <Text style={[F.caption, { marginTop: S.sm }]}>The AI balances subjects across the week and never double-books a teacher (it also checks other classes' timetables).</Text>
      </Card>

      {error ? <Text style={{ color: C.danger, fontWeight: '700', fontSize: 12.5, marginTop: S.md }}>{error}</Text> : null}
      <Btn label={busy ? 'Thinking…' : 'Generate timetable'} onPress={generate} loading={busy} style={{ marginTop: S.md }} />

      {result ? (
        <>
          <SectionHeader title="Generated preview" />
          <Card style={{ paddingHorizontal: 0, overflow: 'hidden' }}>
            {Array.from({ length: days }, (_, d) => {
              const daySlots = result.slots.filter((s) => s.day === d).sort((a, b) => a.period - b.period)
              return (
                <View key={d} style={{ paddingHorizontal: S.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={[F.caption, { fontWeight: '900', marginBottom: 6 }]}>{weekdayName(d)}</Text>
                  <Row gap={6} style={{ flexWrap: 'wrap' }}>
                    {zeroPeriod ? (
                      <View style={{ backgroundColor: C.black, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, minWidth: 52, alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)' }}>P0</Text>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }} numberOfLines={1}>Class teacher</Text>
                      </View>
                    ) : null}
                    {daySlots.map((s) => {
                      const subj = db.subjects.find((x) => x.id === s.subjectId)
                      const noTeacher = !s.teacherId
                      return (
                        <View key={`${d}-${s.period}`} style={{ backgroundColor: noTeacher ? C.dangerSoft : (subj?.color ?? C.primary) + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, minWidth: 40, alignItems: 'center', borderWidth: noTeacher ? 1 : 0, borderColor: C.danger }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: noTeacher ? C.danger : C.text3 }}>P{s.period}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: noTeacher ? C.danger : subj?.color ?? C.primary }} numberOfLines={1}>{noTeacher ? '?' : subj?.short ?? '?'}</Text>
                        </View>
                      )
                    })}
                  </Row>
                </View>
              )
            })}
          </Card>
          {result.conflicts.length ? (
            <>
              <SectionHeader title={`${result.conflicts.length} conflict(s) to solve`} />
              {result.conflicts.map((c, i) => {
                const solved = !result.slots.find((s) => s.day === c.day && s.period === c.period && !s.teacherId)
                if (solved) return null
                return (
                  <Card key={`${c.day}-${c.period}`} style={{ backgroundColor: C.dangerSoft, borderColor: C.danger + '55', marginBottom: S.sm }}>
                    <Text style={[F.body2, { fontWeight: '800', color: C.danger }]}>
                      {weekdayName(c.day)} · Period {c.period} · {c.subjectName}
                    </Text>
                    <Text style={[F.caption, { marginTop: 2, lineHeight: 16 }]}>{c.reason}</Text>
                    {c.candidates.length ? (
                      <Row gap={6} style={{ flexWrap: 'wrap', marginTop: S.sm }}>
                        {c.candidates.map((t) => (
                          <Chip key={t.id} label={t.name} tone="good" onPress={() => assignConflict(c, t.id)} selected={false} />
                        ))}
                      </Row>
                    ) : (
                      <Text style={[F.caption, { marginTop: S.sm }]}>Add a teacher who teaches this subject first, then regenerate.</Text>
                    )}
                  </Card>
                )
              })}
              <Btn label="Auto-fix all conflicts" variant="warning" onPress={autoFix} style={{ marginBottom: S.md }} />
            </>
          ) : null}
          {result.notes.length ? (
            <View style={{ marginTop: S.sm }}>
              <Notice tone="info">AI notes: {result.notes.join(' · ')}</Notice>
            </View>
          ) : null}
          {result.conflicts.length ? (
            <View style={{ marginTop: S.sm }}>
              <Notice tone="warn">Resolve the conflicts above before saving — slots without a teacher are shown with a red "?".</Notice>
            </View>
          ) : null}
          {result.source === 'local' ? (
            <View style={{ marginTop: S.sm }}>
              <Notice tone="warn">This is a basic fallback timetable (AI unavailable). Balance and teacher assignment may be imperfect — review it before saving.</Notice>
            </View>
          ) : null}
          <Btn label={saved ? 'Timetable saved ✓' : 'Save this timetable'} onPress={accept} disabled={saved} style={{ marginTop: S.md }} />
          {saved ? (
            <Btn label="Open class timetable" variant="soft" onPress={() => router.replace(`/admin/class-timetable?classId=${cls.id}`)} style={{ marginTop: S.sm }} />
          ) : null}
        </>
      ) : null}

      <View style={{ marginTop: S.md }}>
        <Notice tone="info">Tip: after saving, open the class timetable to tweak any period manually.</Notice>
      </View>
    </Screen>
  )
}