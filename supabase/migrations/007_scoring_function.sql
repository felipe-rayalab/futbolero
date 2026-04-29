-- El Futbolero - Scoring Function
-- Calcula y persiste los puntos de todos los usuarios que predijeron un partido.
-- Se llama después de marcar un partido como 'finished'.

create or replace function public.calculate_and_save_scores(p_match_id int)
returns int
language plpgsql
security definer
as $$
declare
  v_match  public.matches%rowtype;
  v_pred   public.predictions%rowtype;
  v_pts    record;
  v_count  int := 0;
begin
  select * into v_match from public.matches where id = p_match_id;

  if not found then
    raise exception 'Partido % no existe', p_match_id;
  end if;

  if v_match.team1_score is null or v_match.team2_score is null then
    raise exception 'El partido % no tiene resultado cargado', p_match_id;
  end if;

  for v_pred in
    select * from public.predictions where match_id = p_match_id
  loop
    select * into v_pts from public.calculate_match_points(
      v_pred.team1_score,
      v_pred.team2_score,
      v_match.team1_score,
      v_match.team2_score,
      v_match.phase
    );

    insert into public.scores (
      user_id, match_id,
      points, winner_points, team1_goal_points, team2_goal_points,
      is_pleno, calculated_at
    ) values (
      v_pred.user_id, p_match_id,
      v_pts.total_points, v_pts.winner_points,
      v_pts.team1_goal_points, v_pts.team2_goal_points,
      v_pts.is_pleno, now()
    )
    on conflict (user_id, match_id) do update set
      points             = excluded.points,
      winner_points      = excluded.winner_points,
      team1_goal_points  = excluded.team1_goal_points,
      team2_goal_points  = excluded.team2_goal_points,
      is_pleno           = excluded.is_pleno,
      calculated_at      = excluded.calculated_at;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
