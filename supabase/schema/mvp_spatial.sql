create extension if not exists postgis with schema extensions;
alter table public.chargers add column location extensions.geography(Point,4326) generated always as
 (extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography) stored;
create index chargers_location_gist on public.chargers using gist(location);
