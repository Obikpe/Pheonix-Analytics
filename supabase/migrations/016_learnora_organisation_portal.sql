-- Learnora organisation prospect portal and explicit contract signature metadata.
-- Additive only: existing request, contract and user records remain intact.

alter table public.learnora_organisation_requests
  add column if not exists portal_user_id uuid references public.users(id) on delete set null,
  add column if not exists portal_created_at timestamptz;

create index if not exists learnora_organisation_requests_portal_user_idx
  on public.learnora_organisation_requests(portal_user_id, created_at desc);

alter table public.learnora_contracts
  add column if not exists sent_at timestamptz,
  add column if not exists signed_by_user_id uuid references public.users(id) on delete set null,
  add column if not exists signature_name text,
  add column if not exists signature_title text,
  add column if not exists signature_acknowledged_at timestamptz;

comment on column public.learnora_organisation_requests.portal_user_id
  is 'Verified prospect portal identity for this organisation request.';
comment on column public.learnora_contracts.signature_acknowledged_at
  is 'Timestamp when the named portal signer explicitly acknowledged the displayed contract terms.';
