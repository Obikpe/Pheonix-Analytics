-- Validate cohort-account identity, organisation scope, and enabled track on membership writes.
create or replace function public.validate_cohort_member_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    account_cohort uuid;
    account_org uuid;
    cohort_org uuid;
    option_is_active boolean;
begin
    if new.cohort_account_id is null then
        return new;
    end if;

    select ca.cohort_id, ca.organisation_id
      into account_cohort, account_org
      from public.cohort_accounts ca
     where ca.id = new.cohort_account_id;

    if account_cohort is null then
        raise exception 'Cohort account does not exist';
    end if;
    if account_cohort <> new.cohort_id then
        raise exception 'Cohort account and membership must belong to the same cohort';
    end if;

    select c.organisation_id into cohort_org
      from public.cohorts c where c.id = new.cohort_id;
    if cohort_org is null or cohort_org <> account_org then
        raise exception 'Cohort account and cohort must belong to the same organisation';
    end if;

    select (cto.status = 'active') into option_is_active
      from public.cohort_track_options cto
     where cto.cohort_id = new.cohort_id
       and cto.track_id = new.track_id;

    if option_is_active is distinct from true then
        raise exception 'Learner track must be enabled for the cohort';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_validate_cohort_member_assignment on public.cohort_members;
create trigger trg_validate_cohort_member_assignment
before insert or update of cohort_id, cohort_account_id, track_id
on public.cohort_members
for each row execute function public.validate_cohort_member_assignment();
