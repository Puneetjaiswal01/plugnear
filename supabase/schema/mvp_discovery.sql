create function public.get_nearby_chargers(p_lat double precision,p_lon double precision,p_radius_km double precision default 10,p_connector text default null,p_max_price numeric default 100,p_min_power numeric default 0,p_limit integer default 50)
returns table(id uuid,owner_id uuid,title text,address text,latitude double precision,longitude double precision,connector text,power_kw numeric,price_per_kwh numeric,status text,operational_status text,availability_revision bigint,distance_km double precision,availability_status text)
language plpgsql stable security invoker set search_path='' as $$
declare origin extensions.geography;
begin
 if not private.active_user() then raise exception 'Account unavailable'; end if;
 if p_lat is null or p_lon is null or p_radius_km is null or p_lat not between -90 and 90 or p_lon not between -180 and 180 or p_radius_km not between 1 and 100 or p_limit is null or p_limit not between 1 and 100 or p_max_price is null or p_max_price not between 0 and 100 or p_min_power is null or p_min_power not between 0 and 500 then raise exception 'Invalid nearby search'; end if;
 if p_connector is not null and p_connector not in ('Type 2','CCS2','Bharat AC','CHAdeMO') then raise exception 'Invalid connector'; end if;
 origin:=extensions.st_setsrid(extensions.st_makepoint(p_lon,p_lat),4326)::extensions.geography;
 return query select c.id,c.owner_id,c.title,c.address,c.latitude::double precision,c.longitude::double precision,c.connector,c.power_kw,c.price_per_kwh,c.status,c.operational_status,c.availability_revision,
 extensions.st_distance(c.location,origin)/1000,
 case when c.operational_status='offline' then 'offline' when private.charger_busy(c.id) then 'busy' when not exists(select 1 from public.availability a where a.charger_id=c.id and a.starts_at<=now()+interval '5 minutes' and a.ends_at>=now()+interval '65 minutes') then 'offline' else 'available' end
 from public.chargers c
 where c.status='approved' and private.host_ready(c.owner_id) and extensions.st_dwithin(c.location,origin,p_radius_km*1000)
 and (p_connector is null or c.connector=p_connector) and c.price_per_kwh<=p_max_price and c.power_kw>=p_min_power
 order by c.location OPERATOR(extensions.<->) origin,c.id limit p_limit;
end $$;
revoke all on function public.get_nearby_chargers(double precision,double precision,double precision,text,numeric,numeric,integer) from public,anon;
grant execute on function public.get_nearby_chargers(double precision,double precision,double precision,text,numeric,numeric,integer) to authenticated;
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='chargers') then alter publication supabase_realtime add table public.chargers; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='bookings') then alter publication supabase_realtime add table public.bookings; end if;
end $$;
