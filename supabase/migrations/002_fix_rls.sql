-- El Futbolero - RLS Security Fixes
-- Addresses vulnerabilities found in the initial schema (both 001 and manual changes)

-- ============================================================
-- FIX 1 (CRÍTICO): predictions INSERT debe respetar el corte de tiempo.
-- Un usuario podía insertar predicciones para partidos ya iniciados.
-- ============================================================
drop policy if exists "Users can insert own predictions" on public.predictions;

create policy "Users can insert own predictions before match" on public.predictions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
      and m.match_date > now() + interval '5 minutes'
    )
  );

-- ============================================================
-- FIX 2 (CRÍTICO): "Leagues full access" permite a cualquier usuario
-- (incluso anónimo) crear, editar y eliminar cualquier liga.
-- Se reemplaza por políticas granulares correctas.
-- ============================================================
drop policy if exists "Leagues full access" on public.leagues;

-- SELECT ya existe: "Leagues viewable by members" — se mantiene
-- INSERT ya existe: "Users can create leagues" — se mantiene
-- UPDATE y DELETE eran inexistentes, se agregan:
create policy "Owner can update their league" on public.leagues
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owner can delete their league" on public.leagues
  for delete using (auth.uid() = owner_id);

-- ============================================================
-- FIX 3 (CRÍTICO): "League members full access" permite a cualquier usuario
-- manipular membresías de cualquier liga.
-- Se reemplaza por políticas granulares correctas.
-- ============================================================
drop policy if exists "League members full access" on public.league_members;

-- SELECT ya existe: "League members viewable by league members" — se mantiene
-- INSERT ya existe: "Users can join leagues" — se mantiene
-- DELETE faltaba, se agrega (permite abandonar una liga, excepto al owner):
create policy "Users can leave leagues" on public.league_members
  for delete using (
    auth.uid() = user_id
    and not exists (
      select 1 from public.leagues l
      where l.id = league_id and l.owner_id = auth.uid()
    )
  );

-- ============================================================
-- FIX 4 (CRÍTICO): challenges UPDATE sin with check permite al challenged
-- auto-adjudicarse victorias modificando winner_id.
-- ============================================================
drop policy if exists "Challenged user can update status" on public.challenges;

create policy "Challenged user can accept or decline" on public.challenges
  for update
  using (
    auth.uid() = challenged_id
    and status = 'pending'
  )
  with check (
    challenged_id = auth.uid()
    and status in ('accepted', 'declined')
    and winner_id is null
  );

-- ============================================================
-- FIX 5 (MODERADO): predictions SELECT visible para usuarios anónimos.
-- Una vez iniciado el partido, cualquier persona sin cuenta podía leer
-- las predicciones de todos los jugadores.
-- ============================================================
drop policy if exists "Users can view all predictions after match starts" on public.predictions;

create policy "Authenticated users can view predictions after match starts" on public.predictions
  for select using (
    auth.uid() is not null
    and (
      auth.uid() = user_id
      or exists (
        select 1 from public.matches m
        where m.id = match_id
        and m.match_date <= now()
      )
    )
  );

-- ============================================================
-- FIX 6 (MODERADO): profiles UPDATE sin with check.
-- ============================================================
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
