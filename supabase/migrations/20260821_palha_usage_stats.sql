create or replace function public.palha_usage_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, storage, pg_catalog
as $$
declare
  db_bytes bigint;
  storage_bytes bigint;
begin
  select pg_database_size(current_database()) into db_bytes;
  select coalesce(sum((metadata->>'size')::bigint), 0) from storage.objects into storage_bytes;
  return jsonb_build_object(
    'databaseBytes', db_bytes,
    'storageBytes', storage_bytes
  );
end;
$$;

revoke all on function public.palha_usage_stats() from public;
revoke all on function public.palha_usage_stats() from anon;
revoke all on function public.palha_usage_stats() from authenticated;
grant execute on function public.palha_usage_stats() to service_role;
