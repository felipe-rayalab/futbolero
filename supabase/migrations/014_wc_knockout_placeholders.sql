-- WC 2026 — Partidos de fase eliminatoria (placeholders)
-- week_number = 99 = oculto hasta que se confirmen los clasificados
-- Actualizar team1_id / team2_id + week_number cuando se conozcan los equipos reales

insert into public.teams (name, code, flag_url, group_letter) values
  ('Por Definir', 'PD1', null, null),
  ('Por Definir', 'PD2', null, null)
on conflict (code) do nothing;

-- Round of 32 (matches 73-88 oficial FIFA)
insert into public.matches (team1_id, team2_id, phase, match_date, status, week_number) values
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-06-28T19:00:00Z', 'scheduled', 99), -- M73
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-06-29T17:00:00Z', 'scheduled', 99), -- M76
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-06-29T20:30:00Z', 'scheduled', 99), -- M74
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-06-30T01:00:00Z', 'scheduled', 99), -- M75
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-06-30T17:00:00Z', 'scheduled', 99), -- M78
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-06-30T21:00:00Z', 'scheduled', 99), -- M77
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-07-01T01:00:00Z', 'scheduled', 99), -- M79
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-07-01T16:00:00Z', 'scheduled', 99), -- M80
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-07-01T19:00:00Z', 'scheduled', 99), -- M81
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-07-01T20:00:00Z', 'scheduled', 99), -- M82
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-07-02T19:00:00Z', 'scheduled', 99), -- M84
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-07-02T23:00:00Z', 'scheduled', 99), -- M83
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-07-03T03:00:00Z', 'scheduled', 99), -- M85
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-07-03T18:00:00Z', 'scheduled', 99), -- M88
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-07-03T22:00:00Z', 'scheduled', 99), -- M86
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round32', '2026-07-04T01:30:00Z', 'scheduled', 99), -- M87

-- Round of 16 (matches 89-96)
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round16', '2026-07-04T17:00:00Z', 'scheduled', 99), -- M90
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round16', '2026-07-04T21:00:00Z', 'scheduled', 99), -- M89
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round16', '2026-07-05T20:00:00Z', 'scheduled', 99), -- M91
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round16', '2026-07-06T00:00:00Z', 'scheduled', 99), -- M92
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round16', '2026-07-06T19:00:00Z', 'scheduled', 99), -- M93
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round16', '2026-07-07T00:00:00Z', 'scheduled', 99), -- M94
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round16', '2026-07-07T16:00:00Z', 'scheduled', 99), -- M95
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'round16', '2026-07-07T20:00:00Z', 'scheduled', 99), -- M96

-- Quarterfinals (matches 97-100)
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'quarters', '2026-07-09T20:00:00Z', 'scheduled', 99), -- M97
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'quarters', '2026-07-10T19:00:00Z', 'scheduled', 99), -- M98
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'quarters', '2026-07-11T21:00:00Z', 'scheduled', 99), -- M99
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'quarters', '2026-07-12T01:00:00Z', 'scheduled', 99), -- M100

-- Semifinals (matches 101-102)
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'semis', '2026-07-14T19:00:00Z', 'scheduled', 99), -- M101
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'semis', '2026-07-15T19:00:00Z', 'scheduled', 99), -- M102

-- Third place (match 103)
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'third', '2026-07-18T21:00:00Z', 'scheduled', 99), -- M103

-- Final (match 104)
  ((select id from public.teams where code='PD1'), (select id from public.teams where code='PD2'), 'final', '2026-07-19T19:00:00Z', 'scheduled', 99); -- M104
