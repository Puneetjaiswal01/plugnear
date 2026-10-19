create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles(id) select id from auth.users on conflict(id) do nothing;
create extension if not exists btree_gist;
alter table public.bookings add constraint no_overlapping_confirmed_bookings exclude using gist (charger_id with =, tstzrange(starts_at,ends_at,'[)') with &&) where (status='confirmed');
create or replace function public.respond_to_booking(p_booking_id uuid,p_accept boolean) returns public.bookings language plpgsql security definer set search_path='' as $$
declare b public.bookings;
begin
 select b0.* into b from public.bookings b0 join public.chargers c on c.id=b0.charger_id where b0.id=p_booking_id and c.owner_id=auth.uid() and b0.status='requested' for update of b0;
 if not found then raise exception 'Booking not found or not actionable'; end if;
 update public.bookings set status=case when p_accept then 'confirmed' else 'declined' end where id=p_booking_id returning * into b;
 return b;
end $$;
revoke all on function public.respond_to_booking(uuid,boolean) from public,anon;
grant execute on function public.respond_to_booking(uuid,boolean) to authenticated;
create or replace function public.cancel_my_booking(p_booking_id uuid) returns public.bookings language plpgsql security definer set search_path='' as $$
declare b public.bookings;
begin
 update public.bookings set status='cancelled' where id=p_booking_id and driver_id=auth.uid() and status in ('requested','confirmed') returning * into b;
 if not found then raise exception 'Booking not cancellable'; end if;
 return b;
end $$;
revoke all on function public.cancel_my_booking(uuid) from public,anon;
grant execute on function public.cancel_my_booking(uuid) to authenticated;
