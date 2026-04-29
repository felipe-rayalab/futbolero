-- El Futbolero - Challenge Auto-Resolution Trigger
-- Fires after scores are inserted/updated for a match.
-- Resolves any accepted challenges for that match by comparing both players' points.

create or replace function public.resolve_challenges_for_match()
returns trigger as $$
begin
  update public.challenges c
  set
    status = 'resolved',
    winner_id = case
      when s1.points > s2.points then c.challenger_id
      when s2.points > s1.points then c.challenged_id
      else null  -- empate: sin ganador
    end
  from
    public.scores s1,
    public.scores s2
  where
    c.match_id  = NEW.match_id
    and c.status    = 'accepted'
    and s1.match_id = NEW.match_id and s1.user_id = c.challenger_id
    and s2.match_id = NEW.match_id and s2.user_id = c.challenged_id;

  return NEW;
end;
$$ language plpgsql security definer;

-- Fires after each score row is written for a match
create trigger on_score_upserted
  after insert or update on public.scores
  for each row
  execute procedure public.resolve_challenges_for_match();
