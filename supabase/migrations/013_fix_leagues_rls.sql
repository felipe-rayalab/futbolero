-- Allow any authenticated user to read leagues (needed to join by code)
create policy "Leagues are viewable by authenticated users"
  on public.leagues for select
  to authenticated
  using (true);
