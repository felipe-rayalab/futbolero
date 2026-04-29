-- Guarda el ID del partido en football-data.org para sincronizar resultados
alter table public.matches add column if not exists external_id int;
create index if not exists idx_matches_external_id on public.matches(external_id);
