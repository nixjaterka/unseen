-- Push notification subscriptions: one row per browser/device per user.
-- A user can have multiple devices (phone + laptop etc.).

create table if not exists push_subscriptions (
  id         bigserial primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  endpoint   text        not null,
  p256dh     text        not null,
  auth       text        not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;

-- Users can only manage their own subscriptions
create policy "own subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id);
