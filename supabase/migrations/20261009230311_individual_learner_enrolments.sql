-- Individual learners can enrol in explicitly free Learnora-owned courses.
-- Organisation-scoped enrolments continue to carry an organisation_id.
alter table public.learnora_enrolments
  alter column organisation_id drop not null;

comment on column public.learnora_enrolments.organisation_id
  is 'Owning customer organisation for organisation-scoped enrolments; NULL for an individual learner enrolment.';
