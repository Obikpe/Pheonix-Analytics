-- Permit cohort-only accounts while preserving tenant, lifecycle, and track integrity.
drop trigger if exists learnora_validate_cohort_member_tenant on public.cohort_members;

create or replace function public.validate_cohort_member_identity_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    cohort_org uuid;
    cohort_status text;
    org_active boolean;
    account_cohort uuid;
    account_org uuid;
    account_status text;
    member_role text;
    member_status text;
    track_enabled boolean;
begin
    if new.status <> 'active' then
        return new;
    end if;

    select c.organisation_id, c.status
      into cohort_org, cohort_status
      from public.cohorts c
     where c.id = new.cohort_id;
    if cohort_org is null then
        raise exception 'Cohort does not exist' using errcode = '23503';
    end if;
    if cohort_status not in ('draft','upcoming','active') then
        raise exception 'Closed cohorts cannot accept active members' using errcode = '23514';
    end if;

    select o.is_active into org_active
      from public.organisations o
     where o.id = cohort_org;
    if coalesce(org_active, false) = false then
        raise exception 'Inactive organisations cannot accept active cohort members' using errcode = '23514';
    end if;

    if new.cohort_account_id is not null then
        select ca.cohort_id, ca.organisation_id, ca.status
          into account_cohort, account_org, account_status
          from public.cohort_accounts ca
         where ca.id = new.cohort_account_id;
        if account_cohort is null then
            raise exception 'Cohort account does not exist' using errcode = '23503';
        end if;
        if account_cohort <> new.cohort_id or account_org <> cohort_org then
            raise exception 'Cohort account must belong to the same cohort and organisation' using errcode = '23514';
        end if;
        if account_status = 'inactive' then
            raise exception 'Inactive cohort accounts cannot have active memberships' using errcode = '23514';
        end if;
        select (cto.status = 'active') into track_enabled
          from public.cohort_track_options cto
         where cto.cohort_id = new.cohort_id
           and cto.track_id = new.track_id;
        if track_enabled is distinct from true then
            raise exception 'Learner track must be enabled for the cohort' using errcode = '23514';
        end if;
    else
        select om.role, om.status
          into member_role, member_status
          from public.organisation_members om
         where om.organisation_id = cohort_org
           and om.user_id = new.user_id
         limit 1;
        if not found or member_status <> 'active' or member_role <> 'learner' then
            raise exception 'Legacy cohort members must be active learners in the same organisation' using errcode = '23514';
        end if;
    end if;
    return new;
end;
$$;

create trigger learnora_validate_cohort_member_tenant
before insert or update on public.cohort_members
for each row execute function public.validate_cohort_member_identity_scope();
