create unique index direct_upi_host_reference_unique on private.direct_upi_payments(confirmed_by,lower(reported_reference)) where confirmed_at is not null;
create or replace function private.booking_checkout(p_booking uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.bookings; c public.chargers; p private.direct_upi_payments; h private.host_payment_details;
begin
 if not private.active_user() then raise exception 'Account unavailable'; end if;
 select * into c from public.chargers where id=(select charger_id from public.bookings where id=p_booking) for update;
 select * into b from public.bookings where id=p_booking for update;
 if b.id is null or (b.driver_id<>auth.uid() and c.owner_id<>auth.uid()) then raise exception 'Booking unavailable'; end if;
 if b.status not in ('confirmed','charging','completed') then raise exception 'Host must accept the request before checkout'; end if;
 if c.status<>'approved' or not private.host_ready(c.owner_id) or (b.payment_status='unpaid' and b.ends_at<=now()) then raise exception 'Checkout unavailable'; end if;
 select * into p from private.direct_upi_payments where booking_id=b.id;
 if p.booking_id is null then
  if b.driver_id<>auth.uid() or b.payment_status<>'unpaid' or b.amount_paise<=0 or b.ends_at<=now() or c.status<>'approved' or not private.host_ready(c.owner_id) then raise exception 'Checkout unavailable'; end if;
  select * into h from private.host_payment_details where user_id=c.owner_id;
  if h.user_id is null then raise exception 'Host has not configured a UPI address'; end if;
  insert into private.direct_upi_payments(booking_id,upi_vpa,payee_name,amount_paise) values(b.id,h.upi_vpa,h.payee_name,b.amount_paise) returning * into p;
 end if;
 return jsonb_build_object('booking_id',b.id,'upi_vpa',p.upi_vpa,'payee_name',p.payee_name,'amount_paise',p.amount_paise,'currency','INR','payment_status',b.payment_status,'reference',b.id::text,'reported_reference',p.reported_reference,'host_confirmed_at',p.confirmed_at,'bank_verified',false);
end $$;
