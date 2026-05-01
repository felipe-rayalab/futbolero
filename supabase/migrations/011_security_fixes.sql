-- El Futbolero - Security Fixes

-- 1. Revocar acceso público a RPCs que solo debe llamar el servidor
revoke execute on function public.calculate_and_save_scores(int) from anon, authenticated;
revoke execute on function public.calculate_match_points(int, int, int, int, text) from anon;

-- 2. Impedir que un usuario se desafíe a sí mismo
alter table public.challenges
  add constraint challenges_no_self_challenge
  check (challenger_id <> challenged_id);

-- 3. Limitar display_name server-side
alter table public.profiles
  add constraint profiles_display_name_length
  check (display_name is null or char_length(display_name) <= 40);

-- 4. Limitar scores a valores razonables (0-20)
alter table public.predictions
  add constraint predictions_score_range
  check (team1_score >= 0 and team1_score <= 20 and team2_score >= 0 and team2_score <= 20);

-- 5. Sanitizar display_name en el trigger de creación de perfil
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data->>'full_name', new.email)), 40),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;
