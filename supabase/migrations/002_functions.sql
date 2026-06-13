-- XP increment function
create or replace function increment_xp(uid uuid, amount int)
returns void as $$
  update profiles set xp_points = xp_points + amount, updated_at = now()
  where id = uid;
$$ language sql security definer;

-- Streak update function (call daily via cron)
create or replace function update_streaks()
returns void as $$
declare
  rec record;
begin
  for rec in select id from profiles loop
    -- Check if user had a focus/study session yesterday
    if exists (
      select 1 from focus_sessions
      where user_id = rec.id
      and completed = true
      and date(created_at) = current_date - interval '1 day'
    ) then
      update profiles set streak_days = streak_days + 1, updated_at = now() where id = rec.id;
    elsif not exists (
      select 1 from focus_sessions
      where user_id = rec.id
      and completed = true
      and date(created_at) = current_date
    ) then
      update profiles set streak_days = 0, updated_at = now() where id = rec.id;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- Grant execute
grant execute on function increment_xp(uuid, int) to authenticated;
