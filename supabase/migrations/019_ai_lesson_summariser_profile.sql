insert into public.learnora_ai_profiles (
  profile_key, display_name, description, provider_key, model,
  fallback_provider_key, fallback_model, temperature, max_output_tokens,
  enabled, config, updated_at
) values (
  'summarise',
  'Lesson Summariser',
  'Grounded lesson summaries and revision notes from learner-supplied material.',
  'openrouter',
  'openrouter/free',
  'openrouter',
  'openrouter/free',
  0.2,
  1200,
  true,
  '{"feature":"summarise","grounded_in_supplied_material":true}'::jsonb,
  now()
)
on conflict (profile_key) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  provider_key = excluded.provider_key,
  model = excluded.model,
  fallback_provider_key = excluded.fallback_provider_key,
  fallback_model = excluded.fallback_model,
  temperature = excluded.temperature,
  max_output_tokens = excluded.max_output_tokens,
  enabled = true,
  config = excluded.config,
  updated_at = now();
