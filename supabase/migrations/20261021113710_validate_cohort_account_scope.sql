-- Ensure cohort accounts cannot cross tenant/cohort boundaries or activate in closed workspaces.
create or replace function public.validate_cohort_account_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    cohort_org uuid;
    cohort_status text;
    org_active boolean;
begin
    if tg_op = 'UPDATE' and
       (new.cohort_id is distinct from old.cohort_id or
        new.organisation_id is distinct from old.organisation_id) then
        raise exception 'A cohort account cannot be moved to another cohort or organisation'
            using errcode = '23514';
    end if;

    select c.organisation_id, c.status
      into cohort_org, cohort_status
      from public.cohorts c
     where c.id = new.cohort_id;
    if cohort_org is null then
        raise exception 'Cohort does not exist' using errcode = '23503';
    end if;
    if cohort_org <> new.organisation_id then
        raise exception 'Cohort account organisation must match the cohort organisation'
            using errcode = '23514';
    end if;

    if new.status in ('pending_activation','active') and cohort_status not in ('draft','upcoming','active') then
        raise exception 'Closed cohorts cannot create or activate learner accounts'
            using errcode = '23514';
    end if;

    select o.is_active into org_active
      from public.organisations o
     where o.id = new.organisation_id;
    if new.status in ('pending_activation','active') and coalesce(org_active, false) = false then
        raise exception 'Inactive organisations cannot create or activate cohort accounts'
            using errcode = '23514';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_validate_cohort_account_scope on public.cohort_accounts;
create trigger trg_validate_cohort_account_scope
before insert or update of cohort_id, organisation_id, status
on public.cohort_accounts
for each row execute function public.validate_cohort_account_scope();
