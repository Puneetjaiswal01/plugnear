# Micro-host and fleet implementation requirements

This is the next implementation contract. These fields and controls are **not yet deployed**. Preserve the dedicated PlugNear Supabase project and existing migration history; use additive, versioned schema changes after the pending baseline is reconciled.

## Site and vehicle compatibility

A charging point must describe the **site, independently reservable point and connected charging equipment** separately. Host categories include local shop/kirana, tea/food stop, parking operator, workplace and residential society. Ownership/permission evidence is reviewed privately.

Record parking dimensions/access restrictions for 2W/3W, opening hours and timezone, point count, rated supply voltage/current, protection/earthing/inspection evidence, site aggregate load, metering capability and tariff basis. A generic 16A socket label alone does not establish electrical suitability or vehicle compatibility.

Record supported vehicle/OEM-charger models and whether a compatible charger is host-provided or must be brought by the rider. Use an explicit reviewed compatibility relationship; do not infer suitability solely from the existing Type 2/CCS2/Bharat AC/CHAdeMO field. Avoid catch-all adapters or unsupported vehicle claims. Battery swapping is outside the initial scope.

## Workflow

Draft site → evidence submitted → independent/site review → equipment and compatibility review → admin approved → published availability → rider/fleet authorisation → reserved session → start/stop with verified readings → settlement/reconciliation → completion or dispute. Host declarations must never grant approved status. Revocation of approval must stop new reservations and acceptance.

Reservation exclusion must be per independently usable point, with site-load constraints as well as time overlap controls. Adding several sockets does not automatically add concurrent electrical capacity. Store UTC instants and display site-local time. Define cancellation, expired-hold and incident workflows explicitly.

## Fleet authorisation

Add organisations, staff memberships, driver/vehicle assignments, access policies and auditable session attribution. Organisation access must use server-controlled memberships and RLS; user metadata is not authority. Test that staff/drivers from another fleet cannot read sessions, routes, invoices or vehicle assignments, or invite themselves into a fleet.

Consolidated invoicing derives from immutable verified session lines and provider settlement records. Invoice adjustments, taxes, credits and refunds need an auditable ledger. Do not expose client writes to paid state, metered energy or invoice totals. Grant priority only through a declared reservation policy and genuine available capacity; do not promise it before implementation.

## Pilot planner limits

The public tool accepts 1–500 whole vehicles, 1–300 daily km/vehicle, 10–500 Wh/km, 0.1–22 kW per vehicle and 0.5–24 hours per point. These are tool bounds, not approved installation ratings.

Battery-side daily energy = vehicles × daily km × Wh/km ÷ 1000.

Modelled input energy = battery-side energy ÷ assumed charging efficiency (85%).

Modelled parallel points = ceil(input energy ÷ (per-vehicle kW × usable hours per point)).

The energy-only model ignores queues, taper, downtime, equipment compatibility, arrival distributions and site electrical capacity. All presets are illustrative. The downloaded brief stays local and is not a booking, quote, submission or infrastructure design.
