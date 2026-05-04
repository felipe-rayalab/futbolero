-- Test data: UEFA Champions League 2025-26 semi-finals (second legs)
-- Used to test the prediction platform before the World Cup 2026 starts.
-- week_number = 0 marks these as pre-tournament test matches (outside WC weeks 1-4).

insert into public.teams (name, code, flag_url, group_letter) values
  ('Arsenal',               'ARS', null, null),
  ('Atlético Madrid',       'ATM', null, null),
  ('Bayern München',        'BAY', null, null),
  ('Paris Saint-Germain',   'PSG', null, null)
on conflict (code) do nothing;

insert into public.matches (team1_id, team2_id, phase, match_date, status, week_number) values
  (
    (select id from public.teams where code = 'ARS'),
    (select id from public.teams where code = 'ATM'),
    'semis',
    '2026-05-05 19:00:00+00',  -- 21:00 CEST (UTC+2)
    'scheduled',
    0
  ),
  (
    (select id from public.teams where code = 'BAY'),
    (select id from public.teams where code = 'PSG'),
    'semis',
    '2026-05-06 19:00:00+00',  -- 21:00 CEST (UTC+2)
    'scheduled',
    0
  ),
  (
    -- Placeholder finalists (ARS vs BAY) — update team1_id/team2_id once semi-final results are known
    (select id from public.teams where code = 'ARS'),
    (select id from public.teams where code = 'BAY'),
    'final',
    '2026-05-30 19:00:00+00',  -- 21:00 CEST (UTC+2), Puskás Aréna, Budapest
    'scheduled',
    0
  );
