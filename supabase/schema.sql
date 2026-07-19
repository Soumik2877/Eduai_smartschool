-- =============================================================================
-- EduAI — Air Force School Kalaikunda
-- CONSOLIDATED, IDEMPOTENT SCHEMA
-- Paste this whole file into the new Supabase project's SQL Editor and Run.
-- It reproduces migrations 001–011 in a clean order and ADDS the two tables
-- (notes, student_logs) that the app queries but no migration ever created.
-- Safe to run more than once.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- CORE TABLES
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid references auth.users primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('student','teacher','parent','admin')) default 'student',
  avatar_url text,
  school_id text,
  parent_id uuid references public.profiles(id),
  enrollment_no text unique,
  teacher_id text unique,
  xp_points int not null default 0,
  streak_days int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  school_id text default 'AFSK',
  created_at timestamptz default now(),
  unique (name, school_id)
);

-- class_id on profiles (added after classes exists)
alter table public.profiles add column if not exists class_id uuid references public.classes(id) on delete set null;

create table if not exists public.teacher_classes (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_name text not null,
  created_at timestamptz default now(),
  unique (teacher_id, class_id, subject_name)
);

create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text not null default '#4F46E5',
  difficulty int not null default 3 check (difficulty between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  duration_minutes int not null,
  session_type text not null default 'study' check (session_type in ('study','revision','practice','break')),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz not null,
  status text not null default 'pending' check (status in ('pending','completed','overdue')),
  priority int not null default 2 check (priority between 1 and 3),
  file_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  exam_date timestamptz not null,
  syllabus text,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  topic text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  score int,
  total_questions int not null default 10,
  completed boolean not null default false,
  questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete set null,
  duration_minutes int not null default 25,
  break_minutes int not null default 5,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  subject text,
  created_at timestamptz not null default now()
);

create table if not exists public.performance_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  exam_id uuid references public.exams(id) on delete set null,
  score numeric not null,
  max_score numeric not null default 100,
  recorded_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_key)
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ⭐ MISSING TABLES the app queries (dashboard/teacher/parent). Never created by any migration.
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  file_url text,
  class_id uuid references public.classes(id) on delete set null,
  subject_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_logs (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  log_type text not null default 'remark' check (log_type in ('academic','behavior','attendance','remark')),
  content text not null,
  subject_name text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- FUNCTIONS
-- -----------------------------------------------------------------------------

-- Role from JWT metadata (no table read → no RLS recursion)
create or replace function public.get_auth_role()
returns text as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student');
$$ language sql stable;

create or replace function public.is_parent_of(parent_uid uuid, child_uid uuid)
returns boolean as $$
declare is_parent boolean;
begin
  select exists (
    select 1 from public.profiles where id = child_uid and parent_id = parent_uid
  ) into is_parent;
  return is_parent;
end;
$$ language plpgsql security definer;

-- Auto-create profile on signup (final version: enrollment/teacher/class + parent link)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, enrollment_no, teacher_id, class_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'enrollment_no',
    new.raw_user_meta_data->>'teacher_id',
    case
      when new.raw_user_meta_data->>'class_id' is not null and new.raw_user_meta_data->>'class_id' <> ''
      then (new.raw_user_meta_data->>'class_id')::uuid else null end
  )
  on conflict (id) do nothing;

  if (new.raw_user_meta_data->>'role' = 'parent') and (new.raw_user_meta_data->>'child_enrollment_no' is not null) then
    update public.profiles set parent_id = new.id
    where enrollment_no = new.raw_user_meta_data->>'child_enrollment_no';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- XP + streaks
create or replace function public.increment_xp(uid uuid, amount int)
returns void as $$
  update public.profiles set xp_points = xp_points + amount, updated_at = now() where id = uid;
$$ language sql security definer;

create or replace function public.update_overdue_assignments()
returns void as $$
  update public.assignments set status = 'overdue' where status = 'pending' and due_date < now();
$$ language sql security definer;

-- Login by enrollment_no / teacher_id
create or replace function public.lookup_email_by_identifier(p_identifier text)
returns text as $$
declare v_email text;
begin
  select email into v_email from public.profiles
  where enrollment_no = p_identifier or teacher_id = p_identifier limit 1;
  return v_email;
end;
$$ language plpgsql security definer;

-- Parent / child linkage RPCs
create or replace function public.link_child_by_email(child_email text)
returns jsonb as $$
declare v_child_id uuid; v_child_name text; v_parent_role text;
begin
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student') into v_parent_role;
  if v_parent_role <> 'parent' then return jsonb_build_object('error', 'Only parents are authorized to link children.'); end if;
  select id, full_name into v_child_id, v_child_name from public.profiles
    where lower(email) = lower(child_email) and role = 'student' limit 1;
  if v_child_id is null then return jsonb_build_object('error', 'No student account found with this email.'); end if;
  update public.profiles set parent_id = auth.uid() where id = v_child_id;
  return jsonb_build_object('success', true, 'childId', v_child_id, 'childName', v_child_name);
end;
$$ language plpgsql security definer;

create or replace function public.unlink_child_by_id(child_uid uuid)
returns jsonb as $$
declare v_parent_role text;
begin
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student') into v_parent_role;
  if v_parent_role <> 'parent' then return jsonb_build_object('error', 'Unauthorized.'); end if;
  update public.profiles set parent_id = null where id = child_uid and parent_id = auth.uid();
  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

create or replace function public.link_parent_by_email(parent_email text)
returns jsonb as $$
declare v_parent_id uuid; v_parent_name text; v_student_role text;
begin
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student') into v_student_role;
  if v_student_role <> 'student' then return jsonb_build_object('error', 'Only students are authorized to link parents.'); end if;
  select id, full_name into v_parent_id, v_parent_name from public.profiles
    where lower(email) = lower(parent_email) and role = 'parent' limit 1;
  if v_parent_id is null then return jsonb_build_object('error', 'No parent account found with this email.'); end if;
  update public.profiles set parent_id = v_parent_id where id = auth.uid();
  return jsonb_build_object('success', true, 'parentName', v_parent_name);
end;
$$ language plpgsql security definer;

create or replace function public.unlink_parent()
returns jsonb as $$
declare v_student_role text;
begin
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student') into v_student_role;
  if v_student_role <> 'student' then return jsonb_build_object('error', 'Unauthorized.'); end if;
  update public.profiles set parent_id = null where id = auth.uid();
  return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

grant execute on function public.increment_xp(uuid, int) to authenticated;
grant execute on function public.lookup_email_by_identifier(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.teacher_classes enable row level security;
alter table public.subjects enable row level security;
alter table public.study_sessions enable row level security;
alter table public.assignments enable row level security;
alter table public.exams enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.performance_records enable row level security;
alter table public.achievements enable row level security;
alter table public.notifications enable row level security;
alter table public.notes enable row level security;
alter table public.student_logs enable row level security;

-- Drop every existing policy so this script is fully re-runnable
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- profiles (recursion-free) + admin read
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Parents can view child profiles" on public.profiles for select using (parent_id = auth.uid());
create policy "Teachers can view student profiles" on public.profiles for select using (get_auth_role() = 'teacher' and role = 'student');
create policy "Admins can view all profiles" on public.profiles for select using (get_auth_role() = 'admin');

-- generic own-data (all authenticated CRUD on their own rows)
create policy "Own data" on public.subjects for all using (auth.uid() = user_id);
create policy "Own data" on public.study_sessions for all using (auth.uid() = user_id);
create policy "Own data" on public.assignments for all using (auth.uid() = user_id);
create policy "Own data" on public.exams for all using (auth.uid() = user_id);
create policy "Own data" on public.quiz_sessions for all using (auth.uid() = user_id);
create policy "Own data" on public.focus_sessions for all using (auth.uid() = user_id);
create policy "Own data" on public.chat_messages for all using (auth.uid() = user_id);
create policy "Own data" on public.performance_records for all using (auth.uid() = user_id);
create policy "Own data" on public.achievements for all using (auth.uid() = user_id);
create policy "Own data" on public.notifications for all using (auth.uid() = user_id);

-- teacher manage / parent view / admin view helpers
create policy "Teachers can manage subjects" on public.subjects for select using (get_auth_role() = 'teacher');
create policy "Parents can view child subjects" on public.subjects for select using (is_parent_of(auth.uid(), user_id));
create policy "Admins view subjects" on public.subjects for select using (get_auth_role() = 'admin');

create policy "Teachers can view study sessions" on public.study_sessions for select using (get_auth_role() = 'teacher');
create policy "Parents can view child study sessions" on public.study_sessions for select using (is_parent_of(auth.uid(), user_id));
create policy "Admins view study sessions" on public.study_sessions for select using (get_auth_role() = 'admin');

create policy "Teachers can manage assignments" on public.assignments for all using (get_auth_role() = 'teacher');
create policy "Parents can view child assignments" on public.assignments for select using (is_parent_of(auth.uid(), user_id));
create policy "Admins view assignments" on public.assignments for select using (get_auth_role() = 'admin');

create policy "Teachers can manage exams" on public.exams for all using (get_auth_role() = 'teacher');
create policy "Parents can view child exams" on public.exams for select using (is_parent_of(auth.uid(), user_id));
create policy "Admins view exams" on public.exams for select using (get_auth_role() = 'admin');

create policy "Teachers can manage quiz sessions" on public.quiz_sessions for all using (get_auth_role() = 'teacher');
create policy "Parents can view child quiz sessions" on public.quiz_sessions for select using (is_parent_of(auth.uid(), user_id));
create policy "Admins view quiz sessions" on public.quiz_sessions for select using (get_auth_role() = 'admin');

create policy "Teachers can view focus sessions" on public.focus_sessions for select using (get_auth_role() = 'teacher');
create policy "Parents can view child focus sessions" on public.focus_sessions for select using (is_parent_of(auth.uid(), user_id));
create policy "Admins view focus sessions" on public.focus_sessions for select using (get_auth_role() = 'admin');

create policy "Teachers can manage performance records" on public.performance_records for all using (get_auth_role() = 'teacher');
create policy "Parents can view child performance records" on public.performance_records for select using (is_parent_of(auth.uid(), user_id));
create policy "Admins view performance records" on public.performance_records for select using (get_auth_role() = 'admin');

create policy "Teachers can manage notifications" on public.notifications for all using (get_auth_role() = 'teacher');
create policy "Admins view notifications" on public.notifications for select using (get_auth_role() = 'admin');

create policy "Admins view achievements" on public.achievements for select using (get_auth_role() = 'admin');

-- classes: public read; teachers/admin manage
create policy "Anyone can read classes" on public.classes for select using (true);
create policy "Admins manage classes" on public.classes for all using (get_auth_role() = 'admin');

-- teacher_classes
create policy "Teachers manage own class mappings" on public.teacher_classes for all using (teacher_id = auth.uid());
create policy "Authenticated read teacher classes" on public.teacher_classes for select to authenticated using (true);

-- notes
create policy "Teachers can manage notes" on public.notes for all using (get_auth_role() = 'teacher');
create policy "Students can view notes" on public.notes for select using (get_auth_role() = 'student');
create policy "Parents can view notes" on public.notes for select using (get_auth_role() = 'parent');
create policy "Admins can view notes" on public.notes for select using (get_auth_role() = 'admin');

-- student_logs
create policy "Teachers can manage student logs" on public.student_logs for all using (get_auth_role() = 'teacher');
create policy "Students can view own logs" on public.student_logs for select using (student_id = auth.uid());
create policy "Parents can view child logs" on public.student_logs for select using (is_parent_of(auth.uid(), student_id));
create policy "Admins can view student logs" on public.student_logs for select using (get_auth_role() = 'admin');

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------
create index if not exists idx_study_sessions_user_date on public.study_sessions(user_id, date);
create index if not exists idx_assignments_user on public.assignments(user_id, due_date, status);
create index if not exists idx_perf_user_subject on public.performance_records(user_id, subject_id);
create index if not exists idx_chat_user on public.chat_messages(user_id, created_at desc);
create index if not exists idx_notif_user on public.notifications(user_id, read, created_at desc);
create index if not exists idx_focus_user on public.focus_sessions(user_id, created_at desc);
create index if not exists idx_quiz_user on public.quiz_sessions(user_id, created_at desc);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_class on public.profiles(class_id);
create index if not exists idx_student_logs_student on public.student_logs(student_id, created_at desc);
create index if not exists idx_notes_teacher on public.notes(teacher_id, created_at desc);

-- -----------------------------------------------------------------------------
-- SEED: the two real classes from the source files (Air Force School Kalaikunda)
-- -----------------------------------------------------------------------------
insert into public.classes (name, school_id) values
  ('Class IX - Science', 'AFSK'),
  ('Class X - Science', 'AFSK')
on conflict (name, school_id) do nothing;
