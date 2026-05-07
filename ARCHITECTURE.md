# El Futbolero — Arquitectura

## Stack
- **Frontend:** Next.js 14 (App Router)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Deploy:** Vercel
- **Styling:** Tailwind CSS + shadcn/ui

## Database Schema

### users (manejado por Supabase Auth)
```sql
-- Supabase auth.users + profile extra
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);
```

### teams
```sql
create table teams (
  id serial primary key,
  name text not null,
  code char(3) not null, -- ARG, BRA, etc
  flag_url text,
  group_letter char(1) -- A, B, C... (null para fase eliminatoria)
);
```

### matches
```sql
create table matches (
  id serial primary key,
  team1_id int references teams(id),
  team2_id int references teams(id),
  phase text not null, -- 'groups', 'round32', 'round16', 'quarters', 'semis', 'third', 'final'
  match_date timestamptz not null,
  team1_score int, -- null hasta que termine
  team2_score int,
  status text default 'scheduled', -- 'scheduled', 'live', 'finished'
  week_number int not null -- 1-4 para rankings semanales
);
```

### predictions
```sql
create table predictions (
  id serial primary key,
  user_id uuid references profiles(id),
  match_id int references matches(id),
  team1_score int not null,
  team2_score int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, match_id)
);
```

### scores (calculado después de cada partido)
```sql
create table scores (
  id serial primary key,
  user_id uuid references profiles(id),
  match_id int references matches(id),
  points int not null,
  winner_points int not null, -- puntos por ganador/empate
  team1_goal_points int not null,
  team2_goal_points int not null,
  is_pleno boolean default false,
  unique(user_id, match_id)
);
```

### leagues (ligas/sub-grupos)
```sql
create table leagues (
  id serial primary key,
  name text not null,
  code text unique not null, -- código para invitar
  owner_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table league_members (
  league_id int references leagues(id),
  user_id uuid references profiles(id),
  joined_at timestamptz default now(),
  primary key (league_id, user_id)
);
```

### challenges (desafíos 1v1)
```sql
create table challenges (
  id serial primary key,
  match_id int references matches(id),
  challenger_id uuid references profiles(id),
  challenged_id uuid references profiles(id),
  status text default 'pending', -- 'pending', 'accepted', 'declined'
  winner_id uuid references profiles(id), -- null hasta resolver
  created_at timestamptz default now()
);
```

### prizes
```sql
create table prizes (
  id serial primary key,
  league_id int references leagues(id), -- null = premio global
  title text not null,
  description text,
  position int, -- 1º, 2º, 3º lugar
  image_url text
);
```

## Views (para leaderboards)

### v_leaderboard_general
```sql
create view v_leaderboard_general as
select
  p.id,
  p.username,
  p.avatar_url,
  coalesce(sum(s.points), 0) as total_points,
  count(case when s.is_pleno then 1 end) as plenos,
  max(s.points) as max_match_points
from profiles p
left join scores s on p.id = s.user_id
group by p.id
order by total_points desc, plenos desc, max_match_points desc;
```

### v_leaderboard_weekly
```sql
create view v_leaderboard_weekly as
select
  p.id,
  p.username,
  m.week_number,
  coalesce(sum(s.points), 0) as total_points,
  count(case when s.is_pleno then 1 end) as plenos
from profiles p
left join scores s on p.id = s.user_id
left join matches m on s.match_id = m.id
group by p.id, m.week_number
order by total_points desc;
```

## Funciones Clave

### calculate_points(prediction, actual_result, phase)
Lógica de cálculo de puntos según fase y resultado.

### update_leaderboards()
Trigger que recalcula rankings después de cada actualización de score.

## Realtime
- Supabase Realtime para actualizar scores en vivo
- Subscripción a cambios en `matches` y `scores`

## Páginas

1. `/` — Home (próximos partidos, leaderboard preview)
2. `/play` — Ingresar pronósticos
3. `/leaderboard` — Rankings (general + semanal)
4. `/leagues` — Mis ligas
5. `/leagues/[id]` — Liga específica
6. `/challenges` — Mis desafíos
7. `/prizes` — Premios
8. `/profile` — Mi perfil

## MVP (Semana 1-2)
- [ ] Setup proyecto + Supabase
- [ ] Auth (email + Google)
- [ ] CRUD pronósticos
- [ ] Cálculo de puntos
- [ ] Leaderboard básico

## V1 (Semana 3-4)
- [ ] Ligas
- [ ] Rankings semanales
- [ ] Desafíos 1v1
- [ ] Premios
- [ ] UI polish
