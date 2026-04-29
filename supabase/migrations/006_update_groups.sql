-- El Futbolero - Fixture oficial Mundial 2026
-- Reemplaza grupos y partidos con la asignación oficial FIFA.
-- Anfitriones: México (A), Canadá (B), Estados Unidos (D)

-- Limpiar partidos (cascade predictions/scores/challenges)
truncate public.matches cascade;

-- ============================================================
-- ELIMINAR equipos que no clasificaron
-- ============================================================
delete from public.teams where code in (
  'JAM','GUI','HON','SRB','CHI','DEN','VEN','CMR','POL','NGA','HUN','ITA','PER','BOL','ROU'
);

-- ============================================================
-- ACTUALIZAR grupos de equipos que cambiaron de grupo
-- ============================================================
update public.teams set group_letter = 'A' where code in ('MEX','RSA','KOR');
update public.teams set group_letter = 'B' where code in ('CAN','SUI');
update public.teams set group_letter = 'C' where code in ('BRA','MAR');
update public.teams set group_letter = 'D' where code in ('USA','AUS','TUR');
update public.teams set group_letter = 'E' where code in ('GER','CIV','ECU');
update public.teams set group_letter = 'F' where code in ('NED','JPN','TUN');
update public.teams set group_letter = 'G' where code in ('BEL','IRN','NZL');
update public.teams set group_letter = 'H' where code in ('ESP','KSA','URU');
update public.teams set group_letter = 'I' where code in ('FRA','SEN','IRQ');
update public.teams set group_letter = 'J' where code in ('ARG','ALG','AUT');
update public.teams set group_letter = 'K' where code in ('POR','COL');
update public.teams set group_letter = 'L' where code in ('ENG','CRO','PAN');

-- ============================================================
-- AGREGAR equipos nuevos
-- ============================================================
insert into public.teams (name, code, group_letter) values
  ('República Checa',    'CZE', 'A'),
  ('Bosnia Herzegovina', 'BIH', 'B'),
  ('Qatar',              'QAT', 'B'),
  ('Haití',              'HAI', 'C'),
  ('Escocia',            'SCO', 'C'),
  ('Paraguay',           'PAR', 'D'),
  ('Curazao',            'CUW', 'E'),
  ('Suecia',             'SWE', 'F'),
  ('Egipto',             'EGY', 'G'),
  ('Cabo Verde',         'CPV', 'H'),
  ('Noruega',            'NOR', 'I'),
  ('Jordania',           'JOR', 'J'),
  ('RD Congo',           'COD', 'K'),
  ('Uzbekistán',         'UZB', 'K'),
  ('Ghana',              'GHA', 'L')
on conflict (code) do update set
  name         = excluded.name,
  group_letter = excluded.group_letter;

-- ============================================================
-- VERIFICACIÓN (debe dar 48 equipos, 12 grupos de 4)
-- SELECT group_letter, count(*) FROM public.teams GROUP BY group_letter ORDER BY 1;
-- ============================================================

-- ============================================================
-- PARTIDOS — FASE DE GRUPOS (72 partidos, fixture oficial)
-- MD1: pos1-pos2 y pos3-pos4
-- MD2: pos1-pos3 y pos2-pos4
-- MD3: pos1-pos4 y pos2-pos3 (simultáneos)
-- Horarios UTC. Anfitriones abren jornada en sus grupos.
-- ============================================================

-- ---- GRUPO A: MEX / RSA / KOR / CZE ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-12 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='MEX' and t2.code='RSA';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-13 02:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='KOR' and t2.code='CZE';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='MEX' and t2.code='KOR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-19 02:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='RSA' and t2.code='CZE';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-27 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='MEX' and t2.code='CZE';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-27 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='RSA' and t2.code='KOR';

-- ---- GRUPO B: CAN / BIH / QAT / SUI ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-13 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='CAN' and t2.code='BIH';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-13 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='QAT' and t2.code='SUI';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='CAN' and t2.code='QAT';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='BIH' and t2.code='SUI';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-28 00:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='CAN' and t2.code='SUI';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-28 00:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='BIH' and t2.code='QAT';

-- ---- GRUPO C: BRA / MAR / HAI / SCO ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-14 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='BRA' and t2.code='MAR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-14 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='HAI' and t2.code='SCO';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-19 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='BRA' and t2.code='HAI';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-19 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='MAR' and t2.code='SCO';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-28 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='BRA' and t2.code='SCO';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-28 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='MAR' and t2.code='HAI';

-- ---- GRUPO D: USA / PAR / AUS / TUR ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-15 00:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='USA' and t2.code='PAR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-15 03:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='AUS' and t2.code='TUR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-20 00:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='USA' and t2.code='AUS';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-20 03:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='PAR' and t2.code='TUR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-29 00:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='USA' and t2.code='TUR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-29 00:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='PAR' and t2.code='AUS';

-- ---- GRUPO E: GER / CUW / CIV / ECU ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-15 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='GER' and t2.code='CUW';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-15 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='CIV' and t2.code='ECU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-20 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='GER' and t2.code='CIV';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-20 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='CUW' and t2.code='ECU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-29 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='GER' and t2.code='ECU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-29 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='CUW' and t2.code='CIV';

-- ---- GRUPO F: NED / JPN / SWE / TUN ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-15 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='NED' and t2.code='JPN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-16 02:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='SWE' and t2.code='TUN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-20 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='NED' and t2.code='SWE';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-21 02:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='JPN' and t2.code='TUN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-29 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='NED' and t2.code='TUN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-29 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='JPN' and t2.code='SWE';

-- ---- GRUPO G: BEL / EGY / IRN / NZL ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-16 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='BEL' and t2.code='EGY';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-16 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='IRN' and t2.code='NZL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-21 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='BEL' and t2.code='IRN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-21 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='EGY' and t2.code='NZL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-30 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='BEL' and t2.code='NZL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-30 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='EGY' and t2.code='IRN';

-- ---- GRUPO H: ESP / CPV / KSA / URU ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-16 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='ESP' and t2.code='CPV';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-17 02:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='KSA' and t2.code='URU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-21 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='ESP' and t2.code='KSA';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-22 02:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='CPV' and t2.code='URU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-30 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='ESP' and t2.code='URU';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-30 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='CPV' and t2.code='KSA';

-- ---- GRUPO I: FRA / SEN / IRQ / NOR ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-17 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='FRA' and t2.code='SEN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-17 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='IRQ' and t2.code='NOR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-22 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='FRA' and t2.code='IRQ';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-22 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='SEN' and t2.code='NOR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-01 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='FRA' and t2.code='NOR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-01 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='SEN' and t2.code='IRQ';

-- ---- GRUPO J: ARG / ALG / AUT / JOR ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-17 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='ARG' and t2.code='ALG';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 02:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='AUT' and t2.code='JOR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-22 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='ARG' and t2.code='AUT';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-23 02:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='ALG' and t2.code='JOR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-01 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='ARG' and t2.code='JOR';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-01 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='ALG' and t2.code='AUT';

-- ---- GRUPO K: POR / COD / UZB / COL ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 17:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='POR' and t2.code='COD';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 20:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='UZB' and t2.code='COL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-23 17:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='POR' and t2.code='UZB';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-23 20:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='COD' and t2.code='COL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-02 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='POR' and t2.code='COL';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-02 17:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='COD' and t2.code='UZB';

-- ---- GRUPO L: ENG / CRO / GHA / PAN ------------------------
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-18 23:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='ENG' and t2.code='CRO';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-19 02:00:00+00', 1 from public.teams t1, public.teams t2 where t1.code='GHA' and t2.code='PAN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-23 23:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='ENG' and t2.code='GHA';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-06-24 02:00:00+00', 2 from public.teams t1, public.teams t2 where t1.code='CRO' and t2.code='PAN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-02 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='ENG' and t2.code='PAN';
insert into public.matches (team1_id, team2_id, phase, match_date, week_number)
select t1.id, t2.id, 'groups', '2026-07-02 20:00:00+00', 3 from public.teams t1, public.teams t2 where t1.code='CRO' and t2.code='GHA';
