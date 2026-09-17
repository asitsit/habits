-- Efface toutes les entrées (et donc les scores, via cascade) du premier
-- utilisateur. À lancer avant la livraison au client pour repartir d'une
-- base vierge, une fois les tests terminés.

delete from entries
where user_id = (select id from auth.users order by created_at limit 1);
