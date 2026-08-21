-- Deleting a profile (self-service account deletion) must not fail just
-- because other people used their referral code — drop the referred_by FK
-- and recreate it with ON DELETE SET NULL instead of the default RESTRICT.
do $$
declare
  fk_name text;
begin
  select tc.constraint_name into fk_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
  where tc.table_name = 'profiles'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'referred_by'
  limit 1;

  if fk_name is not null then
    execute format('alter table profiles drop constraint %I', fk_name);
  end if;
end $$;

alter table profiles
  add constraint profiles_referred_by_fkey
  foreign key (referred_by) references profiles(referral_code) on delete set null;
