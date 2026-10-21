-- Make payout state transition and its ledger write one PostgreSQL transaction.
-- A failed ledger insert now rolls back the payout status change as well.
BEGIN;

CREATE OR REPLACE FUNCTION public.process_learnora_creator_payout(
  p_payout_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  payout_row public.learnora_creator_payouts%ROWTYPE;
  updated_row public.learnora_creator_payouts%ROWTYPE;
  event_time timestamptz := clock_timestamp();
BEGIN
  IF p_status NOT IN ('processing', 'paid', 'failed', 'cancelled') THEN
    RETURN jsonb_build_object('error', 'invalid_status');
  END IF;

  SELECT * INTO payout_row
  FROM public.learnora_creator_payouts
  WHERE id = p_payout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  IF payout_row.status = 'paid' THEN
    RETURN jsonb_build_object('error', 'already_paid');
  END IF;

  UPDATE public.learnora_creator_payouts
  SET status = p_status,
      processed_at = CASE
        WHEN p_status IN ('paid', 'failed', 'cancelled') THEN event_time
        ELSE NULL
      END
  WHERE id = p_payout_id
    AND status = payout_row.status
  RETURNING * INTO updated_row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'state_changed');
  END IF;

  IF p_status = 'paid' THEN
    INSERT INTO public.learnora_creator_ledger (
      creator_id,
      entry_type,
      amount_minor,
      currency,
      available_at,
      metadata
    ) VALUES (
      updated_row.creator_id,
      'payout',
      updated_row.amount_minor,
      updated_row.currency,
      event_time,
      jsonb_build_object('payout_id', p_payout_id)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'payout', to_jsonb(updated_row));
END;
$function$;

REVOKE ALL ON FUNCTION public.process_learnora_creator_payout(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_learnora_creator_payout(uuid, text) TO service_role;

INSERT INTO public.learnora_permissions (permission_key, name, description, category)
VALUES (
  'creator_payouts.process',
  'Process creator payouts',
  'Approve and transition creator payout statuses, including payment completion.',
  'creator_finance'
)
ON CONFLICT (permission_key) DO NOTHING;

COMMIT;
