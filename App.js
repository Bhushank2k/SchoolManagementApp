import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { loadSnapshot, saveSnapshot } from './storage';

const STORAGE_KEY = 'school-management-v4';
const DB_NAME = 'school-management.db';
const TABS = ['Overview', 'Exams', 'Timetable', 'Backup'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EMPTY = { students: [], exams: [], timetable: [], updatedAt: null };

function notify(title, message) {
  if (Platform.OS === 'web' && typeof globalThis.alert === 'function') globalThis.alert(title + '\n' + message);
  else Alert.alert(title, message);
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function validateSnapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Backup must be a JSON object.');
  ['students', 'exams', 'timetable'].forEach((key) => {
    if (!Array.isArray(value[key])) throw new Error('Backup is missing the ' + key + ' list.');
    if (!value[key].every((row) => row && typeof row === 'object' && typeof row.id === 'string')) throw new Error('Backup contains invalid ' + key + ' records.');
  });
  return { students: value.students, exams: value.exams, timetable: value.timetable, updatedAt: value.updatedAt || null };
}
const uid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);

export default function App() {
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examClass, setExamClass] = useState('');
  const [subject, setSubject] = useState('');
  const [periodClass, setPeriodClass] = useState('');
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:45');
  const [backupText, setBackupText] = useState('');

  useEffect(() => {
    let active = true;
    loadSnapshot().then((value) => { if (active) setData(value ? validateSnapshot(value) : EMPTY); })
      .catch((e) => { if (active) setError(e.message || 'Could not load records.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const commit = useCallback(async (mutator) => {
    setSaving(true);
    setError('');
    try { setData(await saveSnapshot(mutator(data))); }
    catch (e) { setError(e.message || 'Could not save changes.'); }
    finally { setSaving(false); }
  }, [data]);

  const addStudent = () => {
    if (!studentName.trim() || !studentClass.trim()) return notify('Missing details', 'Enter a student name and class.');
    commit((d) => ({ ...d, students: [...d.students, { id: uid(), name: studentName.trim(), className: studentClass.trim() }] }));
    setStudentName(''); setStudentClass('');
  };
  const addExam = () => {
    if (!examTitle.trim() || !examClass.trim() || !validDate(examDate)) return notify('Check exam details', 'Enter an exam name, class, and real date in YYYY-MM-DD format.');
    commit((d) => ({ ...d, exams: [...d.exams, { id: uid(), title: examTitle.trim(), className: examClass.trim(), date: examDate }] }));
    setExamTitle(''); setExamClass(''); setExamDate('');
  };
  const addPeriod = () => {
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!subject.trim() || !periodClass.trim() || !timePattern.test(startTime) || !timePattern.test(endTime) || startTime >= endTime) return notify('Check timetable details', 'Enter a subject, class, valid 24-hour times, and an end time after the start.');
    commit((d) => ({ ...d, timetable: [...d.timetable, { id: uid(), day, subject: subject.trim(), className: periodClass.trim(), startTime, endTime }] }));
    setSubject(''); setPeriodClass('');
  };
  const remove = (key, id) => commit((d) => ({ ...d, [key]: d[key].filter((row) => row.id !== id) }));
  const exams = useMemo(() => [...data.exams].sort((a, b) => a.date.localeCompare(b.date)), [data.exams]);
  const periods = useMemo(() => [...data.timetable].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime)), [data.timetable]);

  const exportBackup = async () => {
    const content = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), ...data }, null, 2);
    setBackupText(content);
    try { await Share.share({ title: 'School Management backup.json', message: content }); }
    catch (_) { notify('Backup ready', 'The JSON backup is displayed below. Copy it and save it securely.'); }
  };
  const restoreBackup = async () => {
    try {
      const parsed = JSON.parse(backupText);
      const validated = validateSnapshot(parsed);
      const next = await saveSnapshot(validated);
      setData(next);
      notify('Backup restored', 'Student, exam, and timetable records have been replaced.');
    } catch (e) { notify('Restore failed', e.message || 'The backup is invalid.'); }
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#2457d6" /><Text style={styles.muted}>Opening school records…</Text></SafeAreaView>;
  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>SCHOOL ADMIN</Text><Text style={styles.heading}>School Management</Text></View><Text style={styles.status}>{saving ? 'Saving…' : 'Local data'}</Text></View>
    <View style={styles.nav}>{TABS.map((name) => <Pressable key={name} onPress={() => setTab(name)} style={[styles.navItem, tab === name && styles.navActive]}><Text style={[styles.navText, tab === name && styles.navTextActive]}>{name}</Text></Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {tab === 'Overview' ? <>
        <Text style={styles.pageTitle}>Overview</Text><Text style={styles.subtitle}>Offline-first school planning for Android and web.</Text>
        <View style={styles.stats}><Stat label="Students" value={data.students.length} /><Stat label="Exams" value={data.exams.length} /><Stat label="Periods" value={data.timetable.length} /></View>
        <Card title="Add student"><Field label="Student name" value={studentName} onChangeText={setStudentName} placeholder="e.g. Asha Sharma" /><Field label="Class / section" value={studentClass} onChangeText={setStudentClass} placeholder="e.g. 8-A" /><Action label="Add student" onPress={addStudent} /></Card>
        <Card title="Student directory">{data.students.length ? data.students.map((s) => <Record key={s.id} title={s.name} detail={s.className} onDelete={() => remove('students', s.id)} />) : <Empty text="No students added yet." />}</Card>
        <Card title="Upcoming exams">{exams.slice(0, 5).length ? exams.slice(0, 5).map((e) => <Record key={e.id} title={e.title} detail={e.className + ' · ' + e.date} />) : <Empty text="No exams scheduled." />}<Action secondary label="Plan exams" onPress={() => setTab('Exams')} /></Card>
      </> : null}
      {tab === 'Exams' ? <>
        <Text style={styles.pageTitle}>Exam planner</Text><Text style={styles.subtitle}>Schedule and manage exams by class.</Text>
        <Card title="Schedule an exam"><Field label="Exam name" value={examTitle} onChangeText={setExamTitle} placeholder="Mid-term mathematics" /><Field label="Class / section" value={examClass} onChangeText={setExamClass} placeholder="8-A" /><Field label="Exam date (YYYY-MM-DD)" value={examDate} onChangeText={setExamDate} placeholder="2026-11-12" /><Action label="Add exam" onPress={addExam} /></Card>
        <Card title={'Scheduled exams · ' + exams.length}>{exams.length ? exams.map((e) => <Record key={e.id} title={e.title} detail={e.className + ' · ' + e.date} onDelete={() => remove('exams', e.id)} />) : <Empty text="Your exam schedule will appear here." />}</Card>
      </> : null}
      {tab === 'Timetable' ? <>
        <Text style={styles.pageTitle}>Class timetable</Text><Text style={styles.subtitle}>Create weekly subject periods with start and end times.</Text>
        <Card title="Add a period"><Text style={styles.fieldLabel}>Day</Text><View style={styles.dayRow}>{DAYS.map((name) => <Pressable key={name} onPress={() => setDay(name)} style={[styles.dayChip, day === name && styles.daySelected]}><Text style={[styles.dayText, day === name && styles.dayTextSelected]}>{name.slice(0, 3)}</Text></Pressable>)}</View><Field label="Subject" value={subject} onChangeText={setSubject} placeholder="Science" /><Field label="Class / section" value={periodClass} onChangeText={setPeriodClass} placeholder="8-A" /><View style={styles.twoFields}><View style={styles.flex}><Field label="Start (24-hour)" value={startTime} onChangeText={setStartTime} placeholder="09:00" /></View><View style={styles.flex}><Field label="End (24-hour)" value={endTime} onChangeText={setEndTime} placeholder="09:45" /></View></View><Action label="Add period" onPress={addPeriod} /></Card>
        <Card title="Weekly timetable">{periods.length ? periods.map((p) => <Record key={p.id} title={p.day + ' · ' + p.startTime + '–' + p.endTime} detail={p.subject + ' · ' + p.className} onDelete={() => remove('timetable', p.id)} />) : <Empty text="Add a period to start your weekly timetable." />}</Card>
      </> : null}
      {tab === 'Backup' ? <>
        <Text style={styles.pageTitle}>Backup & restore</Text><Text style={styles.subtitle}>Export a portable JSON backup or restore a saved snapshot.</Text>
        <Card title="Create backup"><Text style={styles.body}>Includes students, exams, and timetable periods. Keep the file private because it may contain sensitive student information.</Text><Action label="Export / share backup" onPress={exportBackup} />{backupText ? <><Text style={styles.fieldLabel}>Backup JSON / restore input</Text><TextInput value={backupText} onChangeText={setBackupText} multiline textAlignVertical="top" style={[styles.input, styles.jsonInput]} /></> : null}</Card>
        <Card title="Restore from JSON"><Text style={styles.body}>Restore replaces the current student, exam, and timetable lists. Export a backup first if needed.</Text><TextInput value={backupText} onChangeText={setBackupText} multiline textAlignVertical="top" placeholder="Paste a previously exported backup JSON here" style={[styles.input, styles.jsonInput]} /><Action label="Validate and restore" onPress={restoreBackup} /></Card>
        <Card title="Storage"><Text style={styles.body}>{Platform.OS === 'web' ? 'Browser data is local to this browser profile; clearing site data may erase it.' : 'Records are stored in the app-local SQLite database; uninstalling may remove them.'} Android and web records do not automatically sync.</Text><Text style={styles.muted}>Last saved: {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'Not saved yet'}</Text></Card>
      </> : null}
      <Text style={styles.footer}>Local-first · Back up regularly · No cloud sync</Text>
    </ScrollView>
  </SafeAreaView>;
}

function Stat({ label, value }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Card({ title, children }) { return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>; }
function Field({ label, ...props }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor="#94a3b8" autoCapitalize="sentences" /></View>; }
function Action({ label, onPress, secondary = false }) { return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary]}><Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text></Pressable>; }
function Empty({ text }) { return <Text style={styles.empty}>{text}</Text>; }
function Record({ title, detail, onDelete }) { return <View style={styles.record}><View style={styles.recordCopy}><Text style={styles.recordTitle}>{title}</Text>{detail ? <Text style={styles.recordDetail}>{detail}</Text> : null}</View>{onDelete ? <Pressable accessibilityRole="button" accessibilityLabel={'Delete ' + title} onPress={onDelete} style={styles.delete}><Text style={styles.deleteText}>Delete</Text></Pressable> : null}</View>; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#f4f7fb'}, center:{flex:1,alignItems:'center',justifyContent:'center',gap:12,backgroundColor:'#f4f7fb'},
  header:{paddingHorizontal:20,paddingTop:16,paddingBottom:18,backgroundColor:'#102b52',flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:2,color:'#a8c6ff',marginBottom:5}, heading:{fontSize:22,fontWeight:'800',color:'#fff'}, status:{color:'#fff',fontSize:12,fontWeight:'700'},
  nav:{flexDirection:'row',backgroundColor:'#fff',paddingHorizontal:8,borderBottomWidth:1,borderBottomColor:'#e2e8f0'}, navItem:{flex:1,alignItems:'center',paddingVertical:14,borderBottomWidth:3,borderBottomColor:'transparent'}, navActive:{borderBottomColor:'#2457d6'}, navText:{fontSize:12,color:'#64748b',fontWeight:'700'}, navTextActive:{color:'#2457d6'},
  content:{padding:16,paddingBottom:38,maxWidth:860,width:'100%',alignSelf:'center'}, pageTitle:{fontSize:25,fontWeight:'800',color:'#14213a',marginTop:5}, subtitle:{fontSize:14,color:'#64748b',lineHeight:21,marginTop:5,marginBottom:17},
  stats:{flexDirection:'row',gap:10,marginBottom:14}, stat:{flex:1,backgroundColor:'#fff',borderRadius:15,padding:16,borderWidth:1,borderColor:'#e7edf5'}, statValue:{fontSize:26,fontWeight:'800',color:'#2457d6'}, statLabel:{fontSize:12,color:'#64748b',marginTop:3,fontWeight:'600'},
  card:{backgroundColor:'#fff',borderRadius:16,padding:16,marginBottom:14,borderWidth:1,borderColor:'#e6ebf2'}, cardTitle:{fontSize:16,fontWeight:'800',color:'#18263f',marginBottom:12}, field:{marginBottom:12}, fieldLabel:{fontSize:12,fontWeight:'700',color:'#475569',marginBottom:6},
  input:{borderWidth:1,borderColor:'#d7e0ec',borderRadius:10,paddingHorizontal:12,paddingVertical:11,fontSize:14,color:'#18263f',backgroundColor:'#fff',minHeight:44}, button:{backgroundColor:'#2457d6',borderRadius:10,paddingVertical:13,paddingHorizontal:16,alignItems:'center',marginTop:3}, buttonText:{color:'#fff',fontSize:14,fontWeight:'800'}, buttonSecondary:{backgroundColor:'#edf3ff',marginTop:10}, buttonTextSecondary:{color:'#2457d6'},
  record:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eef2f7',gap:10}, recordCopy:{flex:1}, recordTitle:{fontSize:14,fontWeight:'700',color:'#18263f'}, recordDetail:{fontSize:12,color:'#64748b',marginTop:4}, delete:{paddingHorizontal:10,paddingVertical:7,borderRadius:8,backgroundColor:'#fff1f2'}, deleteText:{fontSize:11,color:'#be123c',fontWeight:'700'},
  empty:{fontSize:13,color:'#94a3b8',lineHeight:20,paddingVertical:8}, body:{fontSize:13,color:'#64748b',lineHeight:20,marginBottom:12}, muted:{fontSize:12,color:'#64748b',marginTop:10}, error:{backgroundColor:'#fff1f2',padding:12,borderRadius:10,marginBottom:12}, errorText:{color:'#be123c',fontSize:13},
  dayRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:14}, dayChip:{paddingVertical:8,paddingHorizontal:11,borderRadius:9,backgroundColor:'#f1f5f9'}, daySelected:{backgroundColor:'#2457d6'}, dayText:{fontSize:12,color:'#475569',fontWeight:'700'}, dayTextSelected:{color:'#fff'}, twoFields:{flexDirection:'row',gap:10}, flex:{flex:1}, jsonInput:{minHeight:160,marginTop:8,fontFamily:Platform.OS==='web'?'monospace':undefined,fontSize:12}, footer:{fontSize:11,color:'#94a3b8',textAlign:'center',paddingVertical:18}
});
