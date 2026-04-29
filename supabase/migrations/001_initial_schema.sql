-- El Futbolero - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Teams (selecciones)
create table public.teams (
  id serial primary key,
  name text not null,
  code char(3) not null unique,
  flag_url text,
  group_letter char(1)
);

-- Matches (partidos)
create table public.matches (
  id serial primary key,
  team1_id int references public.teams(id),
  team2_id int references public.teams(id),
  phase text not null check (phase in ('groups', 'round32', 'round16', 'quarters', 'semis', 'third', 'final')),
  match_date timestamptz not null,
  team1_score int,
  team2_score int,
  status text default 'scheduled' check (status in ('scheduled', 'live', 'finished')),
  week_number int not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.teams enable row level security;
alter table public.matches enable row level security;

-- Teams/Matches are readable by all
create policy "Teams viewable by everyone" on public.teams for select using (true);
create policy "Matches viewable by everyone" on public.matches for select using (true);

-- Predictions (pronósticos)
create table public.predictions (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  match_id int references public.matches(id) on delete cascade,
  team1_score int not null check (team1_score >= 0),
  team2_score int not null check (team2_score >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, match_id)
);

-- Enable RLS
alter table public.predictions enable row level security;

-- Prediction policies
create policy "Users can view all predictions after match starts" on public.predictions
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
      and m.match_date <= now()
    )
    or auth.uid() = user_id
  );

create policy "Users can insert own predictions" on public.predictions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own predictions before match" on public.predictions
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
      and m.match_date > now() + interval '5 minutes'
    )
  );

-- Scores (puntos calculados)
create table public.scores (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  match_id int references public.matches(id) on delete cascade,
  points int not null default 0,
  winner_points int not null default 0,
  team1_goal_points int not null default 0,
  team2_goal_points int not null default 0,
  is_pleno boolean default false,
  calculated_at timestamptz default now(),
  unique(user_id, match_id)
);

-- Enable RLS
alter table public.scores enable row level security;

create policy "Scores viewable by everyone" on public.scores for select using (true);

-- Leagues (ligas/sub-grupos)
create table public.leagues (
  id serial primary key,
  name text not null,
  code text unique not null,
  description text,
  owner_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.league_members (
  league_id int references public.leagues(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (league_id, user_id)
);

-- Enable RLS
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

create policy "Leagues viewable by members" on public.leagues
  for select using (
    exists (
      select 1 from public.league_members lm
      where lm.league_id = id and lm.user_id = auth.uid()
    )
    or owner_id = auth.uid()
  );

create policy "Users can create leagues" on public.leagues
  for insert with check (auth.uid() = owner_id);

create policy "League members viewable by league members" on public.league_members
  for select using (
    exists (
      select 1 from public.league_members lm2
      where lm2.league_id = league_id and lm2.user_id = auth.uid()
    )
  );

create policy "Users can join leagues" on public.league_members
  for insert with check (auth.uid() = user_id);

-- Challenges (desafíos 1v1)
create table public.challenges (
  id serial primary key,
  match_id int references public.matches(id) on delete cascade,
  challenger_id uuid references public.profiles(id) on delete cascade,
  challenged_id uuid references public.profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'resolved')),
  winner_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.challenges enable row level security;

create policy "Users can view their challenges" on public.challenges
  for select using (auth.uid() in (challenger_id, challenged_id));

create policy "Users can create challenges" on public.challenges
  for insert with check (auth.uid() = challenger_id);

create policy "Challenged user can update status" on public.challenges
  for update using (auth.uid() = challenged_id);

-- Prizes (premios)
create table public.prizes (
  id serial primary key,
  league_id int references public.leagues(id) on delete cascade,
  title text not null,
  description text,
  position int,
  image_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.prizes enable row level security;

create policy "Prizes viewable by league members" on public.prizes
  for select using (
    league_id is null
    or exists (
      select 1 from public.league_members lm
      where lm.league_id = prizes.league_id and lm.user_id = auth.uid()
    )
  );

-- Function to calculate points for a prediction
create or replace function calculate_match_points(
  p_team1_pred int,
  p_team2_pred int,
  p_team1_actual int,
  p_team2_actual int,
  p_phase text
) returns table (
  total_points int,
  winner_points int,
  team1_goal_points int,
  team2_goal_points int,
  is_pleno boolean
) as $$
declare
  v_winner_points int;
  v_phase_multiplier int;
  v_pred_winner int; -- 1 = team1, 0 = draw, -1 = team2
  v_actual_winner int;
  v_t1_goal_pts int;
  v_t2_goal_pts int;
begin
  -- Phase multiplier for winner/draw
  v_phase_multiplier := case p_phase
    when 'groups' then 2
    when 'round32' then 3
    when 'round16' then 3
    when 'quarters' then 5
    when 'semis' then 7
    when 'third' then 7
    when 'final' then 7
    else 2
  end;

  -- Determine winners
  v_pred_winner := sign(p_team1_pred - p_team2_pred);
  v_actual_winner := sign(p_team1_actual - p_team2_actual);

  -- Winner/draw points
  v_winner_points := case when v_pred_winner = v_actual_winner then v_phase_multiplier else 0 end;

  -- Goal points function
  v_t1_goal_pts := case
    when p_team1_pred = p_team1_actual then
      case
        when p_team1_actual <= 1 then 1
        when p_team1_actual = 2 then 2
        when p_team1_actual = 3 then 3
        when p_team1_actual = 4 then 4
        else 5
      end
    else 0
  end;

  v_t2_goal_pts := case
    when p_team2_pred = p_team2_actual then
      case
        when p_team2_actual <= 1 then 1
        when p_team2_actual = 2 then 2
        when p_team2_actual = 3 then 3
        when p_team2_actual = 4 then 4
        else 5
      end
    else 0
  end;

  return query select
    v_winner_points + v_t1_goal_pts + v_t2_goal_pts,
    v_winner_points,
    v_t1_goal_pts,
    v_t2_goal_pts,
    (p_team1_pred = p_team1_actual and p_team2_pred = p_team2_actual);
end;
$$ language plpgsql immutable;

-- View: General Leaderboard
create or replace view public.v_leaderboard_general as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  coalesce(sum(s.points), 0)::int as total_points,
  count(case when s.is_pleno then 1 end)::int as plenos,
  coalesce(max(s.points), 0)::int as max_match_points,
  count(s.id)::int as matches_played
from public.profiles p
left join public.scores s on p.id = s.user_id
group by p.id, p.username, p.display_name, p.avatar_url
order by total_points desc, plenos desc, max_match_points desc;

-- View: Weekly Leaderboard
create or replace view public.v_leaderboard_weekly as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  m.week_number,
  coalesce(sum(s.points), 0)::int as total_points,
  count(case when s.is_pleno then 1 end)::int as plenos
from public.profiles p
cross join (select distinct week_number from public.matches) m
left join public.scores s on p.id = s.user_id
left join public.matches mat on s.match_id = mat.id and mat.week_number = m.week_number
group by p.id, p.username, p.display_name, p.avatar_url, m.week_number
order by m.week_number, total_points desc, plenos desc;

-- Grant access to views
grant select on public.v_leaderboard_general to anon, authenticated;
grant select on public.v_leaderboard_weekly to anon, authenticated;
