-- Seed a starter slice of Spain's retail hierarchy so the Retail Shop selectors
-- have data. Safe to re-run (ON CONFLICT DO NOTHING). Requires country ES to exist.
do $$
declare
  es uuid;
  prov_and uuid; prov_cat uuid;
  city_gr uuid; city_bcn uuid;
  town_ogi uuid; town_grc uuid; town_bcnc uuid; town_scv uuid;
begin
  select id into es from countries where iso_code = 'ES';
  if es is null then raise notice 'Spain (ES) not found — skipping geo seed'; return; end if;

  -- Provinces
  insert into provinces (country_id, name, slug) values (es, 'Andalusia', 'andalusia')
    on conflict (country_id, slug) do nothing;
  insert into provinces (country_id, name, slug) values (es, 'Catalonia', 'catalonia')
    on conflict (country_id, slug) do nothing;
  select id into prov_and from provinces where country_id = es and slug = 'andalusia';
  select id into prov_cat from provinces where country_id = es and slug = 'catalonia';

  -- Cities (may already exist — link them to the province either way)
  insert into cities (country_id, name, slug, province_id, retail_active)
    values (es, 'Granada', 'granada', prov_and, true)
    on conflict (country_id, slug) do nothing;
  insert into cities (country_id, name, slug, province_id, retail_active)
    values (es, 'Barcelona', 'barcelona', prov_cat, true)
    on conflict (country_id, slug) do nothing;
  update cities set province_id = prov_and, retail_active = true where country_id = es and slug = 'granada';
  update cities set province_id = prov_cat, retail_active = true where country_id = es and slug = 'barcelona';
  select id into city_gr  from cities where country_id = es and slug = 'granada';
  select id into city_bcn from cities where country_id = es and slug = 'barcelona';

  -- Towns
  insert into towns (city_id, name, slug) values
    (city_gr,  'Ogijares',               'ogijares'),
    (city_gr,  'Granada Centro',         'granada-centro'),
    (city_bcn, 'Barcelona City',         'barcelona-city'),
    (city_bcn, 'Sant Cugat del Vallès',  'sant-cugat-del-valles')
  on conflict (city_id, slug) do nothing;
  select id into town_ogi  from towns where city_id = city_gr  and slug = 'ogijares';
  select id into town_grc  from towns where city_id = city_gr  and slug = 'granada-centro';
  select id into town_bcnc from towns where city_id = city_bcn and slug = 'barcelona-city';
  select id into town_scv  from towns where city_id = city_bcn and slug = 'sant-cugat-del-valles';

  -- Neighborhoods
  insert into neighborhoods (town_id, name, slug) values
    (town_ogi,  'Centro',        'centro'),
    (town_ogi,  'Neighborhood A','neighborhood-a'),
    (town_grc,  'Albaicín',      'albaicin'),
    (town_grc,  'Realejo',       'realejo'),
    (town_bcnc, 'Eixample',      'eixample'),
    (town_bcnc, 'Gràcia',        'gracia'),
    (town_scv,  'Mira-sol',      'mira-sol')
  on conflict (town_id, slug) do nothing;
end $$;
