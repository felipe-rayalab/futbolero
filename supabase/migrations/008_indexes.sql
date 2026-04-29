-- El Futbolero - Performance Indexes

create index if not exists idx_predictions_user_id   on public.predictions(user_id);
create index if not exists idx_predictions_match_id  on public.predictions(match_id);
create index if not exists idx_scores_user_id        on public.scores(user_id);
create index if not exists idx_scores_match_id       on public.scores(match_id);
create index if not exists idx_league_members_user   on public.league_members(user_id);
create index if not exists idx_league_members_league on public.league_members(league_id);
create index if not exists idx_challenges_challenger on public.challenges(challenger_id);
create index if not exists idx_challenges_challenged on public.challenges(challenged_id);
create index if not exists idx_matches_date          on public.matches(match_date);
create index if not exists idx_matches_status        on public.matches(status);
