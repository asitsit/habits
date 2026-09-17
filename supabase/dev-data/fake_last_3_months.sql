-- Données factices pour tester Calendrier/Stats : ~85% des 90 derniers jours
-- remplis, avec des notes 1-5 aléatoires, des booléens aléatoires, et une note
-- texte sur ~30% des jours. À lancer une fois sur la base de test, puis
-- effacer avec reset_test_data.sql avant la livraison au client.

do $$
declare
  v_user_id uuid;
  d date;
  dim record;
  v_entry_id uuid;
begin
  select id into v_user_id from auth.users order by created_at limit 1;

  if v_user_id is null then
    raise exception 'Aucun utilisateur dans auth.users.';
  end if;

  for d in select generate_series(current_date - interval '89 days', current_date, interval '1 day')::date loop
    if random() < 0.85 then
      insert into entries (user_id, date, note_text)
      values (
        v_user_id,
        d,
        case when random() < 0.3 then 'Journée test générée automatiquement.' else null end
      )
      on conflict (user_id, date) do update set note_text = excluded.note_text
      returning id into v_entry_id;

      for dim in select id, type from dimensions where user_id = v_user_id loop
        if dim.type = 'scale' then
          insert into entry_scores (entry_id, dimension_id, value_int)
          values (v_entry_id, dim.id, (1 + floor(random() * 5))::int)
          on conflict (entry_id, dimension_id)
          do update set value_int = excluded.value_int, value_bool = null;
        else
          insert into entry_scores (entry_id, dimension_id, value_bool)
          values (v_entry_id, dim.id, random() < 0.5)
          on conflict (entry_id, dimension_id)
          do update set value_bool = excluded.value_bool, value_int = null;
        end if;
      end loop;
    end if;
  end loop;
end $$;
