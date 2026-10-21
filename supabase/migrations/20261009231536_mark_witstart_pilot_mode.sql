-- WitStart is the explicitly agreed free pilot; new customer organisations
-- must have contracted entitlements before capacity-limited creation is allowed.
update public.organisations
set settings = coalesce(settings, '{}'::jsonb) || '{"pilot_mode": true}'::jsonb
where slug = 'witstart' and lower(name) = 'witstart academy';
