-- Fix Round of 32 bracket — correct team assignments published via admin panel
-- IDs 154-163 had wrong teams (cascade of duplicates + shifts from M79 onwards)
-- No predictions existed on these matches at time of correction

UPDATE public.matches SET
  team1_id = (SELECT id FROM public.teams WHERE code = 'MEX'),
  team2_id = (SELECT id FROM public.teams WHERE code = 'ECU')
WHERE id = 154; -- M79: México vs Ecuador  (Jul 01 01:00Z)

UPDATE public.matches SET
  team1_id = (SELECT id FROM public.teams WHERE code = 'ENG'),
  team2_id = (SELECT id FROM public.teams WHERE code = 'COD')
WHERE id = 155; -- M80: Inglaterra vs RD Congo  (Jul 01 16:00Z)

UPDATE public.matches SET
  team1_id = (SELECT id FROM public.teams WHERE code = 'USA'),
  team2_id = (SELECT id FROM public.teams WHERE code = 'BIH'),
  match_date = '2026-07-02T00:00:00Z'
WHERE id = 156; -- M81: EEUU vs Bosnia  (date fixed: was Jul 01 19:00Z → Jul 02 00:00Z)

UPDATE public.matches SET
  team1_id = (SELECT id FROM public.teams WHERE code = 'BEL'),
  team2_id = (SELECT id FROM public.teams WHERE code = 'SEN')
WHERE id = 157; -- M82: Bélgica vs Senegal  (Jul 01 20:00Z)

UPDATE public.matches SET
  team1_id = (SELECT id FROM public.teams WHERE code = 'ESP'),
  team2_id = (SELECT id FROM public.teams WHERE code = 'AUT')
WHERE id = 158; -- M84: España vs Austria  (Jul 02 19:00Z)

UPDATE public.matches SET
  team1_id = (SELECT id FROM public.teams WHERE code = 'POR'),
  team2_id = (SELECT id FROM public.teams WHERE code = 'CRO')
WHERE id = 159; -- M83: Portugal vs Croacia  (Jul 02 23:00Z)

UPDATE public.matches SET
  team1_id = (SELECT id FROM public.teams WHERE code = 'SUI'),
  team2_id = (SELECT id FROM public.teams WHERE code = 'ALG')
WHERE id = 160; -- M85: Suiza vs Argelia  (Jul 03 03:00Z)

UPDATE public.matches SET
  team1_id = (SELECT id FROM public.teams WHERE code = 'AUS'),
  team2_id = (SELECT id FROM public.teams WHERE code = 'EGY')
WHERE id = 161; -- M88: Australia vs Egipto  (Jul 03 18:00Z)

UPDATE public.matches SET
  team1_id = (SELECT id FROM public.teams WHERE code = 'ARG'),
  team2_id = (SELECT id FROM public.teams WHERE code = 'CPV')
WHERE id = 162; -- M86: Argentina vs Cabo Verde  (Jul 03 22:00Z)

UPDATE public.matches SET
  team1_id = (SELECT id FROM public.teams WHERE code = 'COL'),
  team2_id = (SELECT id FROM public.teams WHERE code = 'GHA')
WHERE id = 163; -- M87: Colombia vs Ghana  (Jul 04 01:30Z)
