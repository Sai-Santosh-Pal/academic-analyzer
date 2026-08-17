import React, { useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useStore, api } from '@/data/store'
import { C, F, S } from '@/theme'
import { Screen, Header, Card, Segmented, Chip, Sheet, Field, Input, Btn, Row, EmptyState } from '@/components/ui'
import { Icon, IconName } from '@/components/icons'
import { studentByUser, classOf, subjectName } from '@/data/stats'
import { todayISO, addDays, parseISO, formatHuman, weekday, daysBetween } from '@/utils/date'
import { CalendarTask, Assessment, Assignment, TimetableEntry } from '@/data/types'

type ViewMode = 'day' | 'week' | 'month'

interface CalItem {
  key: string
  date: string
  title: string
  sub: string
  time?: string | null
  type: 'task' | 'assessment' | 'assignment' | 'class'
  color: string
  soft: string
  icon: IconName
  completed?: boolean
  priority?: string
  task?: CalendarTask
}

const TYPE_META: Record<CalendarTask['type'], { icon: IconName; color: string; soft: string; label: string }> = {
  study: { icon: 'bookOpen', color: C.primary, soft: C.primarySoft, label: 'Study' },
  homework: { icon: 'clipboard', color: C.accent, soft: C.accentSoft, label: 'Homework' },
  exam: { icon: 'target', color: C.danger, soft: C.dangerSoft, label: 'Exam' },
  personal: { icon: 'user', color: C.success, soft: C.successSoft, label: 'Personal' },
  deadline: { icon: 'clock', color: C.warning, soft: C.warningSoft, label: 'Deadline' },
}

export default function StudentCalendar() {
  const { db, user } = useStore()
  const student = studentByUser(db, user?.id ?? '')
  const [view, setView] = useState<ViewMode>('day')
  const [cursor, setCursor] = useState(todayISO())
  const [taskSheet, setTaskSheet] = useState(false)
  const [editing, setEditing] = useState<CalendarTask | null>(null)

  if (!student) return null
  const cls = classOf(db, student.id)!

  const items = useMemo(() => {
    const out: CalItem[] = []
    for (const t of db.calendarTasks.filter((t) => t.ownerId === student.id)) {
      const meta = TYPE_META[t.type]
      out.push({ key: `t_${t.id}`, date: t.date, title: t.title, sub: `${meta.label} · ${t.durationMin} min`, time: t.startTime, type: 'task', color: meta.color, soft: meta.soft, icon: meta.icon, completed: t.completed, priority: t.priority, task: t })
    }
    for (const a of db.assessments.filter((a) => a.classId === student.classId)) {
      out.push({ key: `a_${a.id}`, date: a.date, title: `${subjectName(db, a.subjectId)} — ${a.title}`, sub: `${a.maxMarks} marks`, type: 'assessment', color: C.danger, soft: C.dangerSoft, icon: 'target' })
    }
    for (const s of db.submissions.filter((s) => s.studentId === student.id && s.status !== 'submitted')) {
      const a = db.assignments.find((x) => x.id === s.assignmentId)!
      if (!a) continue
      out.push({ key: `s_${s.id}`, date: a.dueDate, title: `Due: ${a.title}`, sub: `${subjectName(db, a.subjectId)} · ${a.priority} priority`, type: 'assignment', color: C.accent, soft: C.accentSoft, icon: 'clipboard' })
    }
    const wd = weekday(todayISO())
    for (const t of db.timetable.filter((t) => t.classId === student.classId && t.day === wd)) {
      const subj = db.subjects.find((x) => x.id === t.subjectId)!
      const date = nextInstance(t.day)
      out.push({ key: `tt_${t.id}`, date, title: subj.name, sub: `Period ${t.period}`, time: t.startTime, type: 'class', color: subj.color, soft: subj.color + '22', icon: 'school' })
    }
    return out.sort((a, b) => (a.time ?? '23:59').localeCompare(b.time ?? '23:59'))
  }, [db, student.id])

  const dayItems = items.filter((i) => i.date === cursor)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(cursor, i - weekday(cursor) + 1))

  const monthGrid = useMemo(() => {
    const first = parseISO(cursor.slice(0, 8) + '01')
    const start = addDays(cursor.slice(0, 8) + '01', -((weekday(cursor.slice(0, 8) + '01') + 6) % 7))
    const days: { date: string; count: number; inMonth: boolean; has: boolean }[] = []
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i)
      const count = items.filter((it) => it.date === d).length
      days.push({ date: d, count, inMonth: d.slice(0, 7) === cursor.slice(0, 7), has: count > 0 })
    }
    return days
  }, [items, cursor])

  return (
    <Screen scroll>
      <Header
        title="Calendar"
        subtitle={formatHuman(cursor, { weekday: true })}
        right={<TouchableOpacity onPress={() => { setEditing(null); setTaskSheet(true) }} style={{ backgroundColor: C.primary, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={19} color="#fff" /></TouchableOpacity>}
      />
      <Segmented<ViewMode>
        options={[{ key: 'day', label: 'Day' }, { key: 'week', label: 'Week' }, { key: 'month', label: 'Month' }]}
        value={view}
        onChange={setView}
      />

      {view === 'day' ? (
        <>
          <Row gap={8} style={{ marginTop: S.md }}>
            <TouchableOpacity onPress={() => setCursor(addDays(cursor, -1))} style={styles.navBtn}><Icon name="back" size={16} color={C.text2} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setCursor(todayISO())} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
              <Text style={[F.caption, { color: C.primary, fontWeight: '800' }]}>{cursor === todayISO() ? 'TODAY' : 'GO TO TODAY'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCursor(addDays(cursor, 1))} style={styles.navBtn}><Icon name="chevron" size={16} color={C.text2} /></TouchableOpacity>
          </Row>
          <View style={{ marginTop: S.md, gap: 8 }}>
            {dayItems.length === 0 ? (
              <EmptyState icon="calendar" title="Nothing scheduled" sub="Create a study session, homework task or deadline for this day." action={<Btn label="Add task" variant="soft" onPress={() => { setEditing(null); setTaskSheet(true) }} />} />
            ) : dayItems.map((it) => <CalItemRow key={it.key} it={it} onPress={() => { setEditing(it.task ?? null); if (it.task) setTaskSheet(true) }} onToggle={it.task ? () => api.updateCalendarTask(it.task!.id, { completed: !it.completed }) : undefined} />)}
          </View>
        </>
      ) : null}

      {view === 'week' ? (
        <>
          <View style={{ flexDirection: 'row', marginTop: S.md, gap: 6 }}>
            {weekDays.map((d) => {
              const sel = d === cursor
              const count = items.filter((i) => i.date === d).length
              return (
                <TouchableOpacity key={d} onPress={() => setCursor(d)} style={{ flex: 1, alignItems: 'center', backgroundColor: sel ? C.primary : C.card, borderRadius: 12, paddingVertical: 9, borderWidth: 1, borderColor: sel ? C.primary : C.border }}>
                  <Text style={{ fontSize: 9.5, fontWeight: '800', color: sel ? '#fff' : C.text3 }}>{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][weekday(d)]}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: sel ? '#fff' : C.text, marginTop: 2 }}>{parseISO(d).getDate()}</Text>
                  {count > 0 ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: sel ? '#fff' : C.primary, marginTop: 3 }} /> : <View style={{ height: 8 }} />}
                </TouchableOpacity>
              )
            })}
          </View>
          <View style={{ marginTop: S.md, gap: 8 }}>
            {items.filter((i) => weekDays.includes(i.date)).length === 0 ? <EmptyState icon="calendar" title="Quiet week" sub="No tasks or events this week." /> : null}
            {weekDays.map((d) => {
              const its = items.filter((i) => i.date === d)
              if (!its.length) return null
              return (
                <View key={d}>
                  <Text style={[F.micro, { color: C.primary, marginBottom: 6, marginTop: 4 }]}>{formatHuman(d, { weekday: true }).toUpperCase()}</Text>
                  {its.map((it) => <CalItemRow key={it.key} it={it} onPress={() => { setEditing(it.task ?? null); if (it.task) setTaskSheet(true) }} onToggle={it.task ? () => api.updateCalendarTask(it.task!.id, { completed: !it.completed }) : undefined} />)}
                </View>
              )
            })}
          </View>
        </>
      ) : null}

      {view === 'month' ? (
        <>
          <Row between style={{ marginTop: S.md, marginBottom: S.sm }}>
            <TouchableOpacity onPress={() => setCursor(addDays(cursor, -30))} style={styles.navBtn}><Icon name="back" size={16} color={C.text2} /></TouchableOpacity>
            <Text style={F.h2}>{parseISO(cursor).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            <TouchableOpacity onPress={() => setCursor(addDays(cursor, 30))} style={styles.navBtn}><Icon name="chevron" size={16} color={C.text2} /></TouchableOpacity>
          </Row>
          <Card style={{ padding: S.md }}>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '800', color: C.text3 }}>{d}</Text>)}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {monthGrid.map((d, i) => (
                <TouchableOpacity key={i} onPress={() => { setCursor(d.date); setView('day') }} style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: d.date === todayISO() ? C.primary : d.date === cursor ? C.primarySoft : 'transparent' }}>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: d.date === todayISO() ? '#fff' : d.inMonth ? C.text : C.text3 }}>{parseISO(d.date).getDate()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 2, height: 4 }}>
                    {d.has ? <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary }} /> : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
          <Text style={[F.caption, { marginTop: S.md, marginBottom: 6 }]}>EVENTS THIS MONTH</Text>
          <View style={{ gap: 8 }}>
            {items.filter((i) => i.date.slice(0, 7) === cursor.slice(0, 7)).slice(0, 14).map((it) => <CalItemRow key={it.key} it={it} onPress={() => { setEditing(it.task ?? null); if (it.task) setTaskSheet(true) }} onToggle={it.task ? () => api.updateCalendarTask(it.task!.id, { completed: !it.completed }) : undefined} />)}
          </View>
        </>
      ) : null}

      <TaskSheet
        visible={taskSheet}
        onClose={() => setTaskSheet(false)}
        editing={editing}
        defaultDate={cursor}
        studentId={student.id}
        onSaved={() => setTaskSheet(false)}
      />
    </Screen>
  )
}

function CalItemRow({ it, onPress, onToggle }: { it: CalItem; onPress?: () => void; onToggle?: () => void }) {
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, opacity: it.completed ? 0.55 : 1 }}>
      {it.time ? (
        <View style={{ alignItems: 'center', width: 42 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: C.text }}>{it.time}</Text>
        </View>
      ) : null}
      <TouchableOpacity onPress={onToggle} disabled={!onToggle} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: it.completed ? C.success : C.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: it.completed ? C.success : C.border }}>
        {it.completed ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : null}
      </TouchableOpacity>
      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={onPress} activeOpacity={0.8}>
        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: it.soft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={it.icon} size={16} color={it.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[F.h3, { fontSize: 13.5 }]} numberOfLines={1}>{it.title}</Text>
          <Text style={[F.caption, { marginTop: 1 }]}>{it.sub}</Text>
        </View>
        {it.priority === 'high' ? <Chip label="!" tone="bad" /> : null}
      </TouchableOpacity>
    </Card>
  )
}

function TaskSheet({ visible, onClose, editing, defaultDate, studentId, onSaved }: { visible: boolean; onClose: () => void; editing: CalendarTask | null; defaultDate: string; studentId: string; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<CalendarTask['type']>('study')
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState('16:00')
  const [duration, setDuration] = useState('45')
  const [priority, setPriority] = useState<CalendarTask['priority']>('medium')
  const [recurring, setRecurring] = useState<CalendarTask['recurring']>('none')

  React.useEffect(() => {
    if (visible) {
      setTitle(editing?.title ?? '')
      setType(editing?.type ?? 'study')
      setDate(editing?.date ?? defaultDate)
      setTime(editing?.startTime ?? '16:00')
      setDuration(String(editing?.durationMin ?? 45))
      setPriority(editing?.priority ?? 'medium')
      setRecurring(editing?.recurring ?? 'none')
    }
  }, [visible, editing, defaultDate])

  const save = () => {
    if (!title.trim()) return
    const base = {
      title: title.trim(), type, date, startTime: time || null,
      durationMin: Math.max(5, Number(duration) || 30), priority, recurring,
    }
    if (editing) {
      api.updateCalendarTask(editing.id, base)
    } else {
      api.createCalendarTask({ ...base, ownerId: studentId, completed: false })
    }
    onSaved()
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={editing ? 'Edit task' : 'New task'}>
      <Field label="Title"><Input value={title} onChangeText={setTitle} placeholder="e.g. Trigonometry revision" /></Field>
      <Field label="Type">
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {(Object.keys(TYPE_META) as CalendarTask['type'][]).map((t) => (
            <Chip key={t} label={TYPE_META[t].label} tone={type === t ? 'info' : 'neutral'} onPress={() => setType(t)} selected={type === t} />
          ))}
        </Row>
      </Field>
      <Field label="Date (YYYY-MM-DD)"><Input value={date} onChangeText={setDate} /></Field>
      <Row gap={S.md}>
        <Field label="Start time"><Input value={time} onChangeText={setTime} placeholder="16:00" style={{ minWidth: 90 }} /></Field>
        <Field label="Duration (min)"><Input value={duration} onChangeText={setDuration} keyboardType="numeric" style={{ minWidth: 90 }} /></Field>
      </Row>
      <Field label="Priority">
        <Row gap={8}>
          {(['low', 'medium', 'high'] as const).map((p) => <Chip key={p} label={p} tone={p === 'high' ? 'bad' : p === 'medium' ? 'warn' : 'good'} onPress={() => setPriority(p)} selected={priority === p} />)}
        </Row>
      </Field>
      <Field label="Repeat">
        <Row gap={8}>
          {(['none', 'daily', 'weekly'] as const).map((r) => <Chip key={r} label={r === 'none' ? 'Once' : r} tone={recurring === r ? 'info' : 'neutral'} onPress={() => setRecurring(r)} selected={recurring === r} />)}
        </Row>
      </Field>
      {editing ? (
        <Btn label="Delete task" variant="danger" onPress={() => { api.deleteCalendarTask(editing.id); onSaved() }} style={{ marginBottom: S.sm }} />
      ) : null}
      <Btn label={editing ? 'Save changes' : 'Add to calendar'} onPress={save} />
    </Sheet>
  )
}

function nextInstance(day: number): string {
  const t = todayISO()
  let d = parseISO(t)
  while (d.getDay() !== day) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

const styles = {
  navBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.card, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: C.border },
}