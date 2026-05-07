-- El Futbolero - Scoring Trigger & League Leaderboard
--
-- Scoring lifecycle:
--   1. Match goes 'live'     → scores calculated for all predictions (0-0 baseline)
--   2. Score updates (live)  → scores recalculated in real-time
--   3. Match 'finished'      → final calculation; is_final = true locks the row
--   After is_final = true, no further updates are applied for that match.

-- ============================================================
-- 1. Add is_final flag to scores
-- ============================================================

alter table public.scores add column if not exists is_final boolean not null default false;

-- ============================================================
-- 2. Trigger function
-- ============================================================

create or replace function public.calculate_scores_for_match()
returns trigger as $$
declare
  v_team1_actual int;
  v_team2_actual int;
  v_is_final     boolean;
begin
  -- Fire when:
  --   a) status just changed to 'live' or 'finished'
  --   b) either score changed while the match is already live or finished
  if not (
    NEW.status in ('live', 'finished')
    and (
      OLD.status        is distinct from NEW.status
      or OLD.team1_score is distinct from NEW.team1_score
      or OLD.team2_score is distinct from NEW.team2_score
    )
  ) then
    return NEW;
  end if;

  -- Treat null scores as 0 (match just kicked off, 0-0)
  v_team1_actual := coalesce(NEW.team1_score, 0);
  v_team2_actual := coalesce(NEW.team2_score, 0);
  v_is_final     := (NEW.status = 'finished');

  insert into public.scores (
    user_id, match_id,
    points, winner_points, team1_goal_points, team2_goal_points,
    is_pleno, is_final, calculated_at
  )
  select
    p.user_id,
    p.match_id,
    pts.total_points,
    pts.winner_points,
    pts.team1_goal_points,
    pts.team2_goal_points,
    pts.is_pleno,
    v_is_final,
    now()
  from public.predictions p
  cross join lateral public.calculate_match_points(
    p.team1_score, p.team2_score,
    v_team1_actual, v_team2_actual,
    NEW.phase
  ) pts
  where p.match_id = NEW.id
  on conflict (user_id, match_id) do update set
    points            = excluded.points,
    winner_points     = excluded.winner_points,
    team1_goal_points = excluded.team1_goal_points,
    team2_goal_points = excluded.team2_goal_points,
    is_pleno          = excluded.is_pleno,
    is_final          = excluded.is_final,
    calculated_at     = excluded.calculated_at
  -- Never overwrite a finalised score (match already finished)
  where scores.is_final = false;

  return NEW;
end;
$$ language plpgsql security definer;

-- Drop previous version if it exists, then recreate
drop trigger if exists on_match_finished on public.matches;

create trigger on_match_score_change
  after update on public.matches
  for each row execute procedure public.calculate_scores_for_match();

-- ============================================================
-- 3. League leaderboard view
--    Filtered version of v_leaderboard_general scoped to a league.
--    Usage: select * from v_leaderboard_league where league_id = X;
-- ============================================================

create or replace view public.v_leaderboard_league as
select
  lm.league_id,
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  coalesce(sum(s.points), 0)::int  as total_points,
  count(case when s.is_pleno then 1 end)::int as plenos,
  coalesce(max(s.points), 0)::int  as max_match_points,
  count(s.id)::int                 as matches_played
from public.league_members lm
join public.profiles p on p.id = lm.user_id
left join public.scores s on s.user_id = lm.user_id
group by lm.league_id, p.id, p.username, p.display_name, p.avatar_url
order by lm.league_id, total_points desc, plenos desc, max_match_points desc;

grant select on public.v_leaderboard_league to anon, authenticated;
