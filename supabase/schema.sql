-- ============================================================
-- Navkar Auction — Simplified Public Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. TABLES ────────────────────────────────────────────────

-- ~300 auction items
create table if not exists items (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  category         text,
  starting_price   numeric(12,2) not null,
  min_increment    numeric(12,2) not null default 100,
  image_urls       text[] default '{}',
  current_top_bid  numeric(12,2),        -- denormalized for fast list view
  current_top_anon text,                 -- e.g. "Bidder #7"
  status           text not null default 'open' check (status in ('open','closed')),
  created_at       timestamptz not null default now()
);

-- Stable anon handles per contact
create table if not exists bidder_handles (
  id          uuid primary key default gen_random_uuid(),
  phone       text unique,
  email       text unique,
  anon_handle text unique not null,
  check (phone is not null or email is not null)
);
create sequence if not exists bidder_seq start 1;

-- Append-only bid log
create table if not exists bids (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references items(id),
  phone         text,                          -- E.164 e.g. +919876543210
  email         text,                          -- Added email column
  shop_name     text not null,
  amount        numeric(12,2) not null,
  anon_handle   text not null,
  created_at    timestamptz not null default now(),
  check (phone is not null or email is not null) -- Require at least one
);
create index if not exists bids_item_amount on bids (item_id, amount desc);
create index if not exists bids_phone       on bids (phone);
create index if not exists bids_email       on bids (email);

-- Single-row global config
create table if not exists auction_config (
  id             int primary key default 1,
  auction_end_at timestamptz,
  is_live        boolean not null default false,
  check (id = 1)
);
insert into auction_config (id) values (1) on conflict do nothing;


-- ── 2. ATOMIC BID FUNCTION ───────────────────────────────────

create or replace function place_bid(
  p_item_id   uuid,
  p_shop_name text,
  p_phone     text,
  p_email     text,
  p_amount    numeric
) returns table (ok boolean, message text) security definer as $$
declare
  v_top    numeric;
  v_inc    numeric;
  v_status text;
  v_end    timestamptz;
  v_live   boolean;
  v_handle text;
begin
  -- Check auction is live
  select is_live, auction_end_at into v_live, v_end from auction_config where id = 1;
  if not v_live then
    return query select false, 'Auction is not live yet';
    return;
  end if;
  if v_end is not null and now() > v_end then
    return query select false, 'Auction has ended';
    return;
  end if;

  -- Lock item row
  select current_top_bid, min_increment, status
    into v_top, v_inc, v_status
    from items where id = p_item_id for update;

  if not found then
    return query select false, 'Item not found';
    return;
  end if;
  if v_status <> 'open' then
    return query select false, 'Item is closed';
    return;
  end if;

  -- Validate amount
  if p_amount < coalesce(v_top, 0) + v_inc then
    return query select false,
      format('Minimum bid is ₹%s', (coalesce(v_top, 0) + v_inc)::text);
    return;
  end if;

  -- Get or assign anonymous handle
  if p_email is not null then
    select anon_handle into v_handle from bidder_handles where email = p_email;
  elsif p_phone is not null then
    select anon_handle into v_handle from bidder_handles where phone = p_phone;
  end if;
  
  if not found then
    v_handle := 'Bidder #' || nextval('bidder_seq')::text;
    insert into bidder_handles (phone, email, anon_handle) values (p_phone, p_email, v_handle);
  end if;

  -- Insert bid
  insert into bids (item_id, shop_name, phone, email, amount, anon_handle)
    values (p_item_id, p_shop_name, p_phone, p_email, p_amount, v_handle);

  -- Update denormalized top bid on item
  update items
    set current_top_bid  = p_amount,
        current_top_anon = v_handle
    where id = p_item_id;

  return query select true, 'Bid placed';
end;
$$ language plpgsql;


-- ── 3. PUBLIC BIDS VIEW (hides shop/phone/email) ─────────────

create or replace view public_bids as
  select id, item_id, amount, created_at, anon_handle
  from bids;

grant select on public_bids to anon, authenticated;


-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────────

alter table items          enable row level security;
alter table bids           enable row level security;
alter table bidder_handles enable row level security;
alter table auction_config enable row level security;

-- Items: public read, service-role write
drop policy if exists "items_public_read"   on items;
drop policy if exists "items_service_write" on items;
create policy "items_public_read"   on items for select using (true);
create policy "items_service_write" on items for all   using (auth.role() = 'service_role');

-- Bids: service role only (public reads via view)
drop policy if exists "bids_service_only"   on bids;
create policy "bids_service_only"   on bids for all    using (auth.role() = 'service_role');

-- Bidder handles: service role only
drop policy if exists "handles_service_only" on bidder_handles;
create policy "handles_service_only" on bidder_handles for all using (auth.role() = 'service_role');

-- Auction config: public read, service write
drop policy if exists "config_public_read"  on auction_config;
drop policy if exists "config_service_write" on auction_config;
create policy "config_public_read"  on auction_config for select using (true);
create policy "config_service_write" on auction_config for all   using (auth.role() = 'service_role');


-- ── 5. REALTIME ───────────────────────────────────────────────
-- Enable realtime on `items` in Dashboard → Database → Replication
