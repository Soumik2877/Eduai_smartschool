-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles
create table profiles (
  id uuid references auth.users primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('student','teacher','parent','admin')) default 'student',
  avatar_url text,
  school_id text,
  parent_id uuid references profiles(id),
  xp_points int not null default 0,
  streak_days int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subjects
create table subjects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  color text not null default '#4F46E5',
  difficulty int not null default 3 check (difficulty between 1 and 5),
  created_at timestamptz not null default now()
);

-- Study Sessions (planner)
create table study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  duration_minutes int not null,
  session_type text not null default 'study' check (session_type in ('study','revision','practice','break')),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Assignments
create table assignments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete set null,
  title text not null,
  description text,
  due_date timestamptz not null,
  status text not null default 'pending' check (status in ('pending','completed','overdue')),
  priority int not null default 2 check (priority between 1 and 3),
  file_url text,
  created_at timestamptz not null default now()
);

-- Exams
create table exams (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete set null,
  title text not null,
  exam_date timestamptz not null,
  syllabus text,
  created_at timestamptz not null default now()
);

-- Quiz Sessions
create table quiz_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete set null,
  topic text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  score int,
  total_questions int not null default 10,
  completed boolean not null default false,
  questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Focus Sessions (Pomodoro)
create table focus_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete set null,
  duration_minutes int not null default 25,
  break_minutes int not null default 5,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Chat Messages
create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  subject text,
  created_at timestamptz not null default now()
);

-- Performance Records
create table performance_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete cascade not null,
  exam_id uuid references exams(id) on delete set null,
  score numeric not null,
  max_score numeric not null default 100,
  recorded_at timestamptz not null default now()
);

-- Achievements
create table achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_key)
);

-- Notifications
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table study_sessions enable row level security;
alter table assignments enable row level security;
alter table exams enable row level security;
alter table quiz_sessions enable row level security;
alter table focus_sessions enable row level security;
alter table chat_messages enable row level security;
alter table performance_records enable row level security;
alter table achievements enable row level security;
alter table notifications enable row level security;

-- Profile policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Generic own-data policies
create policy "Own data" on subjects for all using (auth.uid() = user_id);
create policy "Own data" on study_sessions for all using (auth.uid() = user_id);
create policy "Own data" on assignments for all using (auth.uid() = user_id);
create policy "Own data" on exams for all using (auth.uid() = user_id);
create policy "Own data" on quiz_sessions for all using (auth.uid() = user_id);
create policy "Own data" on focus_sessions for all using (auth.uid() = user_id);
create policy "Own data" on chat_messages for all using (auth.uid() = user_id);
create policy "Own data" on performance_records for all using (auth.uid() = user_id);
create policy "Own data" on achievements for all using (auth.uid() = user_id);
create policy "Own data" on notifications for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), coalesce(new.raw_user_meta_data->>'role', 'student'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update overdue assignments
create or replace function update_overdue_assignments()
returns void as $$
  update assignments set status = 'overdue'
  where status = 'pending' and due_date < now();
$$ language sql security definer;

-- Indexes
create index on study_sessions(user_id, date);
create index on assignments(user_id, due_date, status);
create index on performance_records(user_id, subject_id);
create index on chat_messages(user_id, created_at desc);
create index on notifications(user_id, read, created_at desc);
