# EduAI — Setup for the demo (Air Force School Kalaikunda)

Four steps to a fully working, data-rich demo.

## 1. Create a new Supabase project & fill env
In `.env.local`, replace the three placeholders with values from your new project
(Supabase Dashboard → **Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role secret key>
```

Then in **Authentication → Providers → Email**, turn **OFF** "Confirm email"
(so the seeded/demo accounts can sign in immediately). Set **Site URL** to
`http://localhost:3000` (and your Vercel URL for production).

## 2. Apply the database schema
Open the Supabase **SQL Editor**, paste the entire contents of
[`supabase/schema.sql`](supabase/schema.sql), and **Run**. It creates every table
(including the previously-missing `notes` and `student_logs`), all RPCs, RLS
policies, the signup trigger, and the two real classes. Safe to re-run.

## 3. Seed the demo data (real names + syllabus)
```
npm install        # if you haven't
npm run seed
```
This creates 43 real students (Class IX + X), a science teacher, 3 parents linked
to their children, an admin, and full history (marks, quizzes, focus sessions,
teacher notes & observations) derived from the gradesheet and Class X syllabus.
It prints all demo logins at the end.

## 4. Run
```
npm run dev
```

### Demo logins (also shown on the login screen)
| Role | Login (School ID or email) | Password |
|------|----------------------------|----------|
| Admin   | `admin@afsk.edu`         | `AfskAdmin@2027` |
| Teacher | `AFSK-TCH-SCI`           | `Afsk@2027` |
| Student | `AFSK-X-01` … `AFSK-X-22`, `AFSK-IX-01` … | `Afsk@2027` |
| Parent  | `parent.raj@afsk.edu`    | `Afsk@2027` |

(Passwords are configurable via `SEED_*` vars in `.env.local`.)

## Showing the judges
Log in as **admin** → you land on the **Administrator Console** with school-wide
KPIs, class/subject charts, top performers, and at-risk students.
Go to **Role Preview** to see the Student, Teacher, and Parent dashboards live and
read-only, side by side. Click **Open full dashboard** on any card to walk the full
experience, then **Exit preview** to return. You can also **View as** any user from
the **Users** page.

## Notes / suggestions added
- Fixed the broken DB (missing `notes`/`student_logs` tables) that prevented any
  fresh Supabase project from working.
- Added the entire admin role experience (was defined in the schema but had no UI).
- Read-only preview is enforced server-side (admin-only) so the demo can't be
  accidentally mutated while presenting.
- The AI features (doubt solver, quiz, planner, career) use `NVIDIA_API_KEY`;
  the quiz has a local fallback if the key is missing.
