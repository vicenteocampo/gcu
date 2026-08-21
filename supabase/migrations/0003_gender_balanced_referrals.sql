-- Activation now requires one Male and one Female referral, not just any 2
-- (gender is only known once a referred profile finishes the questionnaire,
-- so this can't be decided at signup time anymore) — see
-- lib/referral-activation.ts. referral_count still increments at signup for
-- progress display; the trigger no longer sets `activated` itself.

alter table profiles add column if not exists gender text;

create or replace function bump_referrer_count()
returns trigger as $$
begin
  if new.referred_by is not null then
    update profiles
      set referral_count = referral_count + 1
      where referral_code = new.referred_by;
  end if;
  return new;
end;
$$ language plpgsql security definer;
