begin;
do $$
declare h uuid:=gen_random_uuid();d uuid:=gen_random_uuid();c uuid:=gen_random_uuid();b uuid;start_at timestamptz:=now()+interval '5 minutes';finish_at timestamptz:=now()+interval '65 minutes';checkout jsonb;found_state text;
begin
 insert into auth.users(id,email_confirmed_at,is_anonymous) values(h,now(),false),(d,now(),false);
 insert into public.host_verifications(user_id,legal_name,evidence_note,status) values(h,'Rollback pilot host','Rollback-only verified fixture evidence','verified');
 insert into public.chargers(id,owner_id,title,address,latitude,longitude,connector,power_kw,price_per_kwh,status) values(c,h,'Rollback MVP charger','Rollback-only test location, Mumbai',19.07,72.87,'Type 2',7.4,15,'approved');
 insert into public.availability(charger_id,starts_at,ends_at) values(c,now(),now()+interval '4 hours');
 perform set_config('request.jwt.claim.sub',h::text,true);execute 'set local role authenticated';
 perform public.save_host_upi('rollbackfixture@testbank','Rollback Host');execute 'reset role';
 perform set_config('request.jwt.claim.sub',d::text,true);execute 'set local role authenticated';
 select availability_status into found_state from public.get_nearby_chargers(19.07,72.87,1,null,100,0,50) where id=c;
 if found_state is distinct from 'available' then raise exception 'Spatial available state failed: %',found_state;end if;
 select id into b from public.reserve_charger(c,start_at,finish_at,5,gen_random_uuid());
 select availability_status into found_state from public.get_nearby_chargers(19.07,72.87,1,null,100,0,50) where id=c;
 if found_state is distinct from 'busy' then raise exception 'Busy propagation failed';end if;execute 'reset role';
 perform set_config('request.jwt.claim.sub',h::text,true);execute 'set local role authenticated';perform public.respond_to_booking(b,true);execute 'reset role';
 perform set_config('request.jwt.claim.sub',d::text,true);execute 'set local role authenticated';checkout:=public.get_booking_checkout(b);
 if (checkout->>'amount_paise')::integer<>7500 or (checkout->>'bank_verified')::boolean<>false then raise exception 'Checkout authority failed';end if;
 perform public.report_upi_payment(b,'ROLLBACK123456');
 begin perform public.confirm_upi_receipt(b);raise exception 'Driver confirmed own payment';exception when raise_exception then if sqlerrm not like '%Payment action not allowed%' then raise;end if;end;execute 'reset role';
 perform set_config('request.jwt.claim.sub',h::text,true);execute 'set local role authenticated';perform public.confirm_upi_receipt(b);perform public.start_charging(b);perform public.complete_charging(b);execute 'reset role';
 if (select payment_status from public.bookings where id=b)<>'host_confirmed' or (select status from public.bookings where id=b)<>'completed' then raise exception 'Manual session lifecycle failed';end if;
end $$;
rollback;
select 'PostGIS nearby, available/busy, reservation, checkout snapshot, driver report, host receipt and charge lifecycle passed; fixtures rolled back; no UPI transfer sent' as verification;
