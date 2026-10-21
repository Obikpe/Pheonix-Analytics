begin;

alter table public.cohorts drop constraint if exists cohorts_status_check;
alter table public.cohorts add constraint cohorts_status_check
check(status in ('draft','upcoming','active','ending','completed','expired','closed','archived'));

alter table public.organisation_members drop constraint if exists organisation_members_status_check;
alter table public.organisation_members add constraint organisation_members_status_check
check(status in ('active','invited','suspended'));

commit;