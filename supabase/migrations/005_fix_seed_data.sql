-- El Futbolero - Fix Seed Data
-- Limpia el fixture anterior (fixture de prueba con placeholders) y re-siembra con los 48 equipos reales.

-- Limpiar en orden por FK
truncate public.scores    cascade;
truncate public.predictions cascade;
truncate public.challenges  cascade;
truncate public.matches     cascade;
truncate public.teams       cascade;

-- Reset sequences
alter sequence public.teams_id_seq   restart with 1;
alter sequence public.matches_id_seq restart with 1;

-- ============================================================
-- EQUIPOS (48 clasificados)
-- ============================================================
insert into public.teams (name, code, group_letter) values
  -- Grupo A  (USA host)
  ('Estados Unidos',   'USA', 'A'),
  ('Panamá',           'PAN', 'A'),
  ('Marruecos',        'MAR', 'A'),
  ('Uruguay',          'URU', 'A'),

  -- Grupo B  (México host)
  ('México',           'MEX', 'B'),
  ('Jamaica',          'JAM', 'B'),
  ('Nueva Zelanda',    'NZL', 'B'),
  ('Guinea',           'GUI', 'B'),

  -- Grupo C  (Canadá host)
  ('Canadá',           'CAN', 'C'),
  ('Honduras',         'HON', 'C'),
  ('Argelia',          'ALG', 'C'),
  ('Serbia',           'SRB', 'C'),

  -- Grupo D
  ('Brasil',           'BRA', 'D'),
  ('Alemania',         'GER', 'D'),
  ('Suiza',            'SUI', 'D'),
  ('Sudáfrica',        'RSA', 'D'),

  -- Grupo E
  ('Japón',            'JPN', 'E'),
  ('Países Bajos',     'NED', 'E'),
  ('Corea del Sur',    'KOR', 'E'),
  ('Costa de Marfil',  'CIV', 'E'),

  -- Grupo F
  ('Argentina',        'ARG', 'F'),
  ('Chile',            'CHI', 'F'),
  ('Arabia Saudita',   'KSA', 'F'),
  ('Dinamarca',        'DEN', 'F'),

  -- Grupo G
  ('Francia',          'FRA', 'G'),
  ('Venezuela',        'VEN', 'G'),
  ('Bélgica',          'BEL', 'G'),
  ('Camerún',          'CMR', 'G'),

  -- Grupo H
  ('Portugal',         'POR', 'H'),
  ('Australia',        'AUS', 'H'),
  ('Polonia',          'POL', 'H'),
  ('Nigeria',          'NGA', 'H'),

  -- Grupo I
  ('España',           'ESP', 'I'),
  ('Ecuador',          'ECU', 'I'),
  ('Hungría',          'HUN', 'I'),
  ('Senegal',          'SEN', 'I'),

  -- Grupo J
  ('Inglaterra',       'ENG', 'J'),
  ('Turquía',          'TUR', 'J'),
  ('Colombia',         'COL', 'J'),
  ('Túnez',            'TUN', 'J'),

  -- Grupo K
  ('Italia',           'ITA', 'K'),
  ('Perú',             'PER', 'K'),
  ('Irán',             'IRN', 'K'),
  ('Austria',          'AUT', 'K'),

  -- Grupo L
  ('Croacia',          'CRO', 'L'),
  ('Bolivia',          'BOL', 'L'),
  ('Irak',             'IRQ', 'L'),
  ('Rumanía',          'ROU', 'L');

-- ============================================================
-- PARTIDOS — FASE DE GRUPOS (72 partidos)
-- Jornada 1: pos.1 vs pos.2 y pos.3 vs pos.4
-- Jornada 2: pos.1 vs pos.3 y pos.2 vs pos.4
-- Jornada 3: pos.1 vs pos.4 y pos.2 vs pos.3 (simultáneos)
-- Todos los horarios en UTC
-- ============================================================

-- ---- GRUPO A -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-12 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='USA' and t2.code='PAN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-12 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='MAR' and t2.code='URU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-17 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='USA' and t2.code='MAR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-17 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='PAN' and t2.code='URU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-26 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='USA' and t2.code='URU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-26 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='PAN' and t2.code='MAR';

-- ---- GRUPO B -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-13 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='MEX' and t2.code='JAM';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-13 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='NZL' and t2.code='GUI';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='MEX' and t2.code='NZL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='JAM' and t2.code='GUI';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-27 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='MEX' and t2.code='GUI';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-27 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='JAM' and t2.code='NZL';

-- ---- GRUPO C -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-13 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='CAN' and t2.code='HON';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-14 02:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='ALG' and t2.code='SRB';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='CAN' and t2.code='ALG';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-19 02:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='HON' and t2.code='SRB';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-27 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='CAN' and t2.code='SRB';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-27 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='HON' and t2.code='ALG';

-- ---- GRUPO D -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-14 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='BRA' and t2.code='GER';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-14 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='SUI' and t2.code='RSA';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-19 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='BRA' and t2.code='SUI';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-19 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='GER' and t2.code='RSA';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-28 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='BRA' and t2.code='RSA';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-28 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='GER' and t2.code='SUI';

-- ---- GRUPO E -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-14 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='JPN' and t2.code='NED';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-15 02:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='KOR' and t2.code='CIV';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-19 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='JPN' and t2.code='KOR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-20 02:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='NED' and t2.code='CIV';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-28 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='JPN' and t2.code='CIV';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-28 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='NED' and t2.code='KOR';

-- ---- GRUPO F -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-15 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='ARG' and t2.code='CHI';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-15 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='KSA' and t2.code='DEN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-20 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='ARG' and t2.code='KSA';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-20 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='CHI' and t2.code='DEN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-29 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='ARG' and t2.code='DEN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-29 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='CHI' and t2.code='KSA';

-- ---- GRUPO G -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-15 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='FRA' and t2.code='VEN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-16 02:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='BEL' and t2.code='CMR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-20 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='FRA' and t2.code='BEL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-21 02:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='VEN' and t2.code='CMR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-29 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='FRA' and t2.code='CMR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-29 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='VEN' and t2.code='BEL';

-- ---- GRUPO H -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-16 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='POR' and t2.code='AUS';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-16 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='POL' and t2.code='NGA';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-21 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='POR' and t2.code='POL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-21 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='AUS' and t2.code='NGA';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-30 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='POR' and t2.code='NGA';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-30 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='AUS' and t2.code='POL';

-- ---- GRUPO I -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-16 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='ESP' and t2.code='ECU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-17 02:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='HUN' and t2.code='SEN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-21 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='ESP' and t2.code='HUN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-22 02:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='ECU' and t2.code='SEN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-30 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='ESP' and t2.code='SEN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-30 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='ECU' and t2.code='HUN';

-- ---- GRUPO J -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-17 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='ENG' and t2.code='TUR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-17 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='COL' and t2.code='TUN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-22 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='ENG' and t2.code='COL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-22 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='TUR' and t2.code='TUN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-01 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='ENG' and t2.code='TUN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-01 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='TUR' and t2.code='COL';

-- ---- GRUPO K -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-17 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='ITA' and t2.code='PER';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 02:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='IRN' and t2.code='AUT';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-22 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='ITA' and t2.code='IRN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-23 02:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='PER' and t2.code='AUT';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-01 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='ITA' and t2.code='AUT';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-01 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='PER' and t2.code='IRN';

-- ---- GRUPO L -----------------------------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='CRO' and t2.code='BOL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='IRQ' and t2.code='ROU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-23 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='CRO' and t2.code='IRQ';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-23 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='BOL' and t2.code='ROU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-02 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='CRO' and t2.code='ROU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-02 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='BOL' and t2.code='IRQ';
