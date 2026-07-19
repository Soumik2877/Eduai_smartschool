/**
 * EduAI — Full rich seed (Air Force School Kalaikunda)
 * -----------------------------------------------------------------------------
 * Creates real accounts + demo data derived from:
 *   - data/GRADESHEET SCIENCE IX X 26 27.xlsx  (real student names, blank marks)
 *   - data/syllabus class 10.pdf               (real subjects & chapters)
 *
 * Run AFTER applying supabase/schema.sql to the new project:
 *   npm run seed
 * (which runs:  node --env-file=.env.local scripts/seed.mjs)
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SEED_DEMO_PASSWORD, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD  (optional)
 */
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEMO_PW = process.env.SEED_DEMO_PASSWORD || 'Afsk@2027'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@afsk.edu'
const ADMIN_PW = process.env.SEED_ADMIN_PASSWORD || 'AfskAdmin@2027'

if (!URL || !SERVICE_KEY || URL.includes('REPLACE_WITH')) {
  console.error('\n✖ Missing/placeholder Supabase env. Fill NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.\n')
  process.exit(1)
}

const db = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// ------------------------------------------------------------------ real data
const IX_NAMES = [
  'Ayushman Soni','Aditya Raj','Ayushi Maurya','Deepesh','Dev Dasarath','Jigyasha','Jordan',
  'Jyotika','N Dorish','Nayeem','Prashant','Sayanai Mahata','Shalini','Yashvardhan','Subhajit',
  'Anushka','Arnav Kumar','Koushik Mahata','Om Roy','Raunak Jana','Shivam Singh',
]
const X_NAMES = [
  'Mihika Saikia','Arav Yadav','Aranya','Arnav Chaudhary','Ayushi','Bhumika','Manaswee','Ritanshi',
  'Rupam','Sangita','Aditya Verma','Arush Kumar','Aryan','Viraj','Aditya Nandi','Akhanda Pratap',
  'Ansh Raj','Deep','Jiya','Komal Rani','Nisha Kumari','Smriti Raj',
]

const SUBJECTS = [
  { name: 'Science',        color: '#10B981' },
  { name: 'Mathematics',    color: '#EF4444' },
  { name: 'English',        color: '#6366F1' },
  { name: 'Social Science', color: '#8B5CF6' },
  { name: 'Hindi',          color: '#F59E0B' },
  { name: 'I.T.',           color: '#06B6D4' },
]

// syllabus-accurate quiz/revision topics
const TOPICS = {
  'Science': ['Life Processes','Control and Coordination','Chemical Reactions and Equations','Acids, Bases and Salts','Electricity'],
  'Mathematics': ['Real Numbers','Polynomials','Pair of Linear Equations','Quadratic Equations'],
  'English': ['A Letter to God','Nelson Mandela','Fire and Ice','A Tiger in the Zoo','Modals & Concord'],
  'Social Science': ['Resources and Development','Nationalism in Europe','Power Sharing','Development'],
  'Hindi': ['Surdas ke Pad','Bade Bhai Sahab','Vyakaran - Samaas','Harihar Kaka'],
  'I.T.': ['Self Management','Digital Documentation'],
}

// gradesheet-accurate assessments (completed → seeded as performance records)
const ASSESSMENTS = {
  IX: [ { name: 'PT 1', max: 25 }, { name: 'Half-Yearly', max: 25 }, { name: 'PT 2', max: 25 } ],
  X:  [ { name: 'Rapid Digester', max: 10 }, { name: 'PT 1', max: 20 } ],
}
const UPCOMING = {
  IX: [ { name: 'PT 3', max: 25, days: 12 }, { name: 'Term 2 Examination', max: 50, days: 34 } ],
  X:  [ { name: 'Half-Yearly Examination', max: 40, days: 18 }, { name: 'PT 2', max: 20, days: 40 } ],
}

const BADGES = ['first_focus','7_day_streak','quiz_master','early_bird','subject_champion','century_club']

// ------------------------------------------------------------------ helpers
const rnd = (a, b) => a + Math.random() * (b - a)
const irnd = (a, b) => Math.round(rnd(a, b))
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString()
const daysAhead = (d) => new Date(Date.now() + d * 86400000).toISOString()
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')

async function chunkedInsert(table, rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).insert(rows.slice(i, i + 500))
    if (error) throw new Error(`${table}: ${error.message}`)
  }
}

// ------------------------------------------------------------------ cleanup
async function wipeDemo() {
  console.log('• Cleaning previous demo accounts…')
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  const victims = (data?.users || []).filter(u =>
    (u.email || '').endsWith('@afsk.edu') || u.email === ADMIN_EMAIL)
  for (const u of victims) {
    await db.from('profiles').delete().eq('id', u.id)   // cascades child rows
    await db.auth.admin.deleteUser(u.id)
  }
  console.log(`  removed ${victims.length} user(s)`)
}

async function createUser(email, meta) {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: email === ADMIN_EMAIL ? ADMIN_PW : DEMO_PW,
    email_confirm: true,
    user_metadata: meta,
  })
  if (error) throw new Error(`createUser ${email}: ${error.message}`)
  return data.user
}

// ------------------------------------------------------------------ main
async function main() {
  console.log('\n=== EduAI seed — Air Force School Kalaikunda ===\n')

  await wipeDemo()

  // classes (schema.sql already inserted them; look up ids)
  const { data: classes, error: cErr } = await db.from('classes').select('id, name').in('name', ['Class IX - Science', 'Class X - Science'])
  if (cErr) throw cErr
  const classIX = classes.find(c => c.name === 'Class IX - Science')
  const classX = classes.find(c => c.name === 'Class X - Science')
  if (!classIX || !classX) throw new Error('Classes not found — run supabase/schema.sql first.')

  // buffers for bulk insert
  const subjectsRows = [], perfRows = [], examRows = [], quizRows = [],
        focusRows = [], studyRows = [], assignRows = [], achieveRows = [], notifRows = []
  const students = [] // {id, name, grade, enrollment}

  const roster = [
    ...IX_NAMES.map((n, i) => ({ name: n, grade: 'IX', idx: i + 1, classId: classIX.id })),
    ...X_NAMES.map((n, i) => ({ name: n, grade: 'X', idx: i + 1, classId: classX.id })),
  ]

  console.log(`• Creating ${roster.length} student accounts + data…`)
  for (const s of roster) {
    const enrollment = `AFSK-${s.grade}-${String(s.idx).padStart(2, '0')}`
    const email = `${enrollment.toLowerCase()}@afsk.edu`
    const user = await createUser(email, {
      full_name: s.name, role: 'student', enrollment_no: enrollment, class_id: s.classId,
    })

    const ability = clamp(rnd(0.42, 0.96), 0.3, 0.99)     // per-student baseline
    const xp = irnd(150, 3200)
    const streak = irnd(0, 21)
    await db.from('profiles').update({ xp_points: xp, streak_days: streak, school_id: 'AFSK' }).eq('id', user.id)

    students.push({ id: user.id, name: s.name, grade: s.grade, enrollment, ability })

    // subjects (per-user)
    const subjMap = {}
    for (const sub of SUBJECTS) {
      const id = crypto.randomUUID()
      subjMap[sub.name] = id
      subjectsRows.push({ id, user_id: user.id, name: sub.name, color: sub.color, difficulty: irnd(2, 5) })
    }

    // performance records (completed assessments) — real gradesheet columns
    for (const sub of SUBJECTS) {
      for (const [ai, a] of ASSESSMENTS[s.grade].entries()) {
        const perf = clamp(ability + rnd(-0.14, 0.12), 0.2, 1)
        perfRows.push({
          user_id: user.id, subject_id: subjMap[sub.name],
          score: Math.round(a.max * perf), max_score: a.max,
          recorded_at: daysAgo(90 - ai * 28 + irnd(-3, 3)),
        })
      }
    }

    // upcoming exams (exam portlet / countdown)
    for (const e of UPCOMING[s.grade]) {
      examRows.push({
        user_id: user.id, subject_id: subjMap['Science'],
        title: e.name, exam_date: daysAhead(e.days + irnd(-2, 2)),
        syllabus: TOPICS['Science'].slice(0, 3).join(', '),
      })
    }

    // quizzes (last ~3 weeks)
    const nQ = irnd(6, 14)
    for (let q = 0; q < nQ; q++) {
      const sub = pick(SUBJECTS).name
      const total = 10
      const score = Math.round(total * clamp(ability + rnd(-0.2, 0.15), 0.1, 1))
      quizRows.push({
        user_id: user.id, subject_id: subjMap[sub], topic: pick(TOPICS[sub]),
        difficulty: pick(['easy','medium','hard']), score, total_questions: total,
        completed: true, questions: [], created_at: daysAgo(irnd(0, 21)),
      })
    }

    // focus sessions (drives weekly focus + streak charts)
    for (let d = 0; d < 30; d++) {
      const active = Math.random() < clamp(ability, 0.35, 0.9)
      if (!active) continue
      const bouts = irnd(1, 3)
      for (let b = 0; b < bouts; b++) {
        focusRows.push({
          user_id: user.id, subject_id: subjMap[pick(SUBJECTS).name],
          duration_minutes: pick([25, 25, 50]), break_minutes: 5,
          completed: true, created_at: daysAgo(d),
        })
      }
    }

    // today's study plan (planner / today schedule)
    const today = new Date().toISOString().split('T')[0]
    for (let i = 0; i < irnd(1, 3); i++) {
      const start = 15 + i * 2
      studyRows.push({
        user_id: user.id, subject_id: subjMap[pick(SUBJECTS).name], date: today,
        start_time: `${String(start).padStart(2, '0')}:00`, end_time: `${String(start + 1).padStart(2, '0')}:00`,
        duration_minutes: 60, session_type: pick(['study','revision','practice']), completed: Math.random() < 0.4,
      })
    }

    // assignments
    const homeworks = [
      ['Life Processes — worksheet', 'Science'], ['Quadratic Equations — Ex 4.2', 'Mathematics'],
      ['A Letter to God — Q&A', 'English'], ['Nationalism in Europe notes', 'Social Science'],
      ['Electricity numericals', 'Science'], ['Digital Documentation practical', 'I.T.'],
    ]
    for (let i = 0; i < irnd(3, 6); i++) {
      const [title, sub] = pick(homeworks)
      const offset = irnd(-6, 9)
      assignRows.push({
        user_id: user.id, subject_id: subjMap[sub], title,
        description: 'Assigned by subject teacher.', due_date: daysAhead(offset),
        status: offset < 0 ? (Math.random() < 0.5 ? 'overdue' : 'completed') : (Math.random() < 0.3 ? 'completed' : 'pending'),
        priority: irnd(1, 3),
      })
    }

    // achievements + notifications
    const nB = Math.floor(xp / 600)
    const shuffled = [...BADGES].sort(() => Math.random() - 0.5).slice(0, clamp(nB, 0, BADGES.length))
    for (const b of shuffled) achieveRows.push({ user_id: user.id, badge_key: b })
    notifRows.push(
      { user_id: user.id, title: 'New study note shared', body: 'Your Science teacher shared "Electricity — Key Formulae".', type: 'info' },
      { user_id: user.id, title: 'PT 1 marks published', body: 'Check the Analytics tab for your Periodic Test 1 performance.', type: 'success' },
    )
  }

  console.log('• Inserting student data…')
  await chunkedInsert('subjects', subjectsRows)
  await chunkedInsert('performance_records', perfRows)
  await chunkedInsert('exams', examRows)
  await chunkedInsert('quiz_sessions', quizRows)
  await chunkedInsert('focus_sessions', focusRows)
  await chunkedInsert('study_sessions', studyRows)
  await chunkedInsert('assignments', assignRows)
  await chunkedInsert('achievements', achieveRows)
  await chunkedInsert('notifications', notifRows)

  // ---- teacher
  console.log('• Creating demo science teacher…')
  const teacher = await createUser('teacher.science@afsk.edu', {
    full_name: 'Mrs. Anjali Sharma', role: 'teacher', teacher_id: 'AFSK-TCH-SCI',
  })
  await db.from('profiles').update({ school_id: 'AFSK' }).eq('id', teacher.id)
  await chunkedInsert('teacher_classes', [
    { teacher_id: teacher.id, class_id: classIX.id, subject_name: 'Science' },
    { teacher_id: teacher.id, class_id: classX.id, subject_name: 'Science' },
  ])
  await chunkedInsert('notes', [
    { teacher_id: teacher.id, class_id: classX.id, subject_name: 'Science', title: 'Life Processes — Chapter Notes',
      content: 'Nutrition, respiration, transportation and excretion in plants and animals. Focus on diagrams of the human digestive & respiratory system.', file_url: null },
    { teacher_id: teacher.id, class_id: classX.id, subject_name: 'Science', title: 'Chemical Reactions & Equations',
      content: 'Types of reactions: combination, decomposition, displacement, double displacement, redox. Practice balancing equations.', file_url: null },
    { teacher_id: teacher.id, class_id: classX.id, subject_name: 'Science', title: 'Electricity — Key Formulae',
      content: "Ohm's law, resistance in series & parallel, heating effect of current, electric power P = VI.", file_url: null },
    { teacher_id: teacher.id, class_id: classIX.id, subject_name: 'Science', title: 'PT 1 Revision Sheet (Class IX)',
      content: 'Revision questions for Periodic Test 1 covering matter, atoms & molecules and the fundamental unit of life.', file_url: null },
    { teacher_id: teacher.id, class_id: classX.id, subject_name: 'Science', title: 'Acids, Bases and Salts',
      content: 'pH scale, indicators, reactions of acids and bases, common salts and their uses.', file_url: null },
  ])
  // observations across a sample of students
  const logTemplates = [
    ['academic', 'Excellent grasp of Life Processes; scored consistently well in class tests.'],
    ['academic', 'Needs to revise numerical problems in Electricity before PT 2.'],
    ['behavior', 'Very attentive and asks thoughtful questions during lab sessions.'],
    ['attendance', 'Regular and punctual throughout the month.'],
    ['remark', 'Showed great improvement after the doubt-clearing session.'],
    ['academic', 'Strong in theory but should practice diagram-based questions.'],
  ]
  const logRows = []
  for (const st of students.filter((_, i) => i % 3 === 0)) {
    const [type, content] = pick(logTemplates)
    logRows.push({ teacher_id: teacher.id, student_id: st.id, log_type: type, content, subject_name: 'Science' })
  }
  await chunkedInsert('student_logs', logRows)

  // ---- parents (link to children)
  console.log('• Creating demo parents + linking children…')
  const parentPlan = [
    { name: 'Mr. Rakesh Saikia', email: 'parent.saikia@afsk.edu', children: ['Mihika Saikia'] },
    { name: 'Mrs. Sunita Raj',   email: 'parent.raj@afsk.edu',    children: ['Aditya Raj','Ansh Raj'] },
    { name: 'Mr. Deb Mahata',    email: 'parent.mahata@afsk.edu', children: ['Sayanai Mahata','Koushik Mahata'] },
  ]
  for (const p of parentPlan) {
    const parent = await createUser(p.email, { full_name: p.name, role: 'parent' })
    await db.from('profiles').update({ school_id: 'AFSK' }).eq('id', parent.id)
    for (const childName of p.children) {
      const child = students.find(s => s.name === childName)
      if (child) await db.from('profiles').update({ parent_id: parent.id }).eq('id', child.id)
    }
  }

  // ---- admin
  console.log('• Creating admin account…')
  const admin = await createUser(ADMIN_EMAIL, { full_name: 'School Administrator', role: 'admin' })
  await db.from('profiles').update({ role: 'admin', school_id: 'AFSK' }).eq('id', admin.id)

  // ------------------------------------------------------------------ summary
  console.log('\n✔ Seed complete.\n')
  console.log('  Students : ' + students.length + '  (Class IX: ' + IX_NAMES.length + ', Class X: ' + X_NAMES.length + ')')
  console.log('  Teacher  : Mrs. Anjali Sharma   (ID AFSK-TCH-SCI)')
  console.log('  Parents  : ' + parentPlan.length)
  console.log('\n  ── Demo logins ─────────────────────────────────────────────')
  console.log('  Admin   : ' + ADMIN_EMAIL + '  /  ' + ADMIN_PW)
  console.log('  Teacher : AFSK-TCH-SCI (or teacher.science@afsk.edu)  /  ' + DEMO_PW)
  console.log('  Student : AFSK-X-01   (or afsk-x-01@afsk.edu)         /  ' + DEMO_PW)
  console.log('  Parent  : parent.raj@afsk.edu                          /  ' + DEMO_PW)
  console.log('  ────────────────────────────────────────────────────────────\n')
}

main().catch(e => { console.error('\n✖ Seed failed:', e.message, '\n'); process.exit(1) })
