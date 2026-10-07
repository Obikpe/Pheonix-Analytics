begin;

-- Platform admins may hold more than one internal platform role.
alter table public.learnora_platform_admins drop constraint if exists learnora_platform_admins_admin_id_key;
create unique index if not exists uq_learnora_platform_admin_role on public.learnora_platform_admins(admin_id,platform_role);

-- Staff roles use the same granular permission catalogue as the rest of Learnora.
create table if not exists public.learnora_staff_role_permissions (
 id uuid primary key default gen_random_uuid(),
 role_id uuid not null references public.learnora_staff_roles(id) on delete cascade,
 permission_id uuid not null references public.learnora_permissions(id) on delete cascade,
 created_at timestamptz not null default now(),
 unique(role_id,permission_id)
);

insert into public.learnora_staff_role_permissions(role_id,permission_id)
select r.id,p.id from public.learnora_staff_roles r cross join public.learnora_permissions p
where r.slug='super_admin'
on conflict(role_id,permission_id) do nothing;

insert into public.learnora_staff_role_permissions(role_id,permission_id)
select r.id,p.id from public.learnora_staff_roles r join public.learnora_permissions p on p.permission_key in ('staff.view','staff.teams','staff.departments','system.audit')
where r.slug='executive'
on conflict(role_id,permission_id) do nothing;

insert into public.learnora_staff_role_permissions(role_id,permission_id)
select r.id,p.id from public.learnora_staff_roles r join public.learnora_permissions p on p.permission_key in ('staff.view','staff.teams','staff.departments')
where r.slug='operations'
on conflict(role_id,permission_id) do nothing;

insert into public.learnora_staff_role_permissions(role_id,permission_id)
select r.id,p.id from public.learnora_staff_roles r join public.learnora_permissions p on p.permission_key='staff.view'
where r.slug in ('product','engineering','data_analytics','learning_curriculum','customer_success','sales_partnerships','finance','support','ai_research')
on conflict(role_id,permission_id) do nothing;

-- Creator courses are a distinct ownership context.
alter table public.learnora_courses drop constraint if exists learnora_courses_ownership_check;
alter table public.learnora_courses add constraint learnora_courses_ownership_check check (ownership in ('learnora','organisation','creator'));

-- Creator sales need a durable idempotency key where available.
create unique index if not exists uq_creator_sales_provider_reference
on public.learnora_creator_sales(provider_reference)
where provider_reference is not null;

-- Protect against negative creator ledger entries being accidentally represented
-- as balances; negative entries are permitted only for fees/refunds/adjustments.
alter table public.learnora_creator_ledger drop constraint if exists creator_ledger_amount_direction_check;
alter table public.learnora_creator_ledger add constraint creator_ledger_amount_direction_check
check (
  (entry_type in ('sale','adjustment') and amount_minor >= 0)
  or (entry_type in ('platform_fee','refund','payout') and amount_minor >= 0)
);

-- Every organisation has an explicit lifecycle record.
insert into public.learnora_organisation_lifecycle(organisation_id,status)
select o.id,'active' from public.organisations o
where not exists(select 1 from public.learnora_organisation_lifecycle l where l.organisation_id=o.id);

-- Add explicit access scope to creator courses.
alter table public.learnora_course_purchases add column if not exists access_entitlement_id uuid references public.learnora_access_entitlements(id) on delete set null;

-- Common timestamps.
create index if not exists idx_org_lifecycle_status on public.learnora_organisation_lifecycle(status);
create index if not exists idx_contracts_org_status on public.learnora_contracts(organisation_id,status);
create index if not exists idx_entitlements_scope on public.learnora_access_entitlements(user_id,organisation_id,course_id,status);

commit;
