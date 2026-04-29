-- Fix: leagues y league_members les faltan políticas de SELECT e INSERT

-- Leagues: add missing SELECT and INSERT policies
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

-- League members: add missing INSERT policy (SELECT already exists)
create policy "Users can join leagues" on public.league_members
  for insert with check (auth.uid() = user_id);
