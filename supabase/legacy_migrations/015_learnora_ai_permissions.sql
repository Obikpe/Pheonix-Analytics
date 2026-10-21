begin;

insert into public.learnora_organisation_role_permissions(organisation_role,permission_id)
select 'learner',id from public.learnora_permissions where permission_key='ai.view'
on conflict(organisation_role,permission_id) do nothing;

insert into public.learnora_organisation_role_permissions(organisation_role,permission_id)
select 'instructor',id from public.learnora_permissions where permission_key='ai.view'
on conflict(organisation_role,permission_id) do nothing;

insert into public.learnora_organisation_role_permissions(organisation_role,permission_id)
select 'owner',id from public.learnora_permissions where permission_key='ai.manage'
on conflict(organisation_role,permission_id) do nothing;

insert into public.learnora_ai_limits(scope_type,scope_id,feature,requests_per_day,max_input_chars,max_output_tokens)
values ('global','*','*',20,12000,1200)
on conflict do nothing;

commit;