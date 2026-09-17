-- Données de départ : thèmes et dimensions (section 2.1 du cadrage).
-- Seedé pour le premier utilisateur créé dans auth.users (app mono-utilisateur
-- au lancement). Idempotent grâce aux contraintes unique(user_id, name).
--
-- Les icônes Lucide ne sont pas encore choisies (à faire ensemble, cf. cadrage
-- section 5) : laissées à null pour l'instant, à compléter dans une future migration.

do $$
declare
  v_user_id uuid;
  v_tete_id uuid;
  v_coeur_id uuid;
  v_corps_id uuid;
begin
  select id into v_user_id from auth.users order by created_at limit 1;

  if v_user_id is null then
    raise exception 'Aucun utilisateur dans auth.users : crée le compte avant de lancer ce seed.';
  end if;

  insert into themes (user_id, name, color, sort_order) values
    (v_user_id, 'Tête', '#6366F1', 1),
    (v_user_id, 'Cœur', '#F43F5E', 2),
    (v_user_id, 'Corps', '#10B981', 3)
  on conflict (user_id, name) do nothing;

  select id into v_tete_id from themes where user_id = v_user_id and name = 'Tête';
  select id into v_coeur_id from themes where user_id = v_user_id and name = 'Cœur';
  select id into v_corps_id from themes where user_id = v_user_id and name = 'Corps';

  insert into dimensions (user_id, theme_id, name, type, group_label, sort_order) values
    (v_user_id, v_tete_id, 'Social', 'scale', null, 1),
    (v_user_id, v_tete_id, 'Réflexion', 'scale', null, 2),

    (v_user_id, v_coeur_id, 'Plaisir', 'scale', null, 1),
    (v_user_id, v_coeur_id, 'Émotion', 'scale', null, 2),
    (v_user_id, v_coeur_id, 'Couple', 'scale', null, 3),

    (v_user_id, v_corps_id, 'Sommeil', 'scale', null, 1),
    (v_user_id, v_corps_id, 'Nutrition', 'scale', null, 2),
    (v_user_id, v_corps_id, 'Sport - Flex', 'boolean', 'Sport', 3),
    (v_user_id, v_corps_id, 'Sport - Cardio', 'boolean', 'Sport', 4),
    (v_user_id, v_corps_id, 'Sport - Force', 'boolean', 'Sport', 5),
    (v_user_id, v_corps_id, 'Énergie', 'scale', null, 6),

    (v_user_id, null, 'Never before', 'boolean', null, 1)
  on conflict (user_id, name) do nothing;
end $$;
