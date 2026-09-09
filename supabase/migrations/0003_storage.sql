insert into storage.buckets (id, name, public)
values ('tenant-media', 'tenant-media', false)
on conflict (id) do nothing;

create policy tenant_media_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'tenant-media'
    and private.has_tenant_access((storage.foldername(name))[1]::uuid)
  );

create policy tenant_media_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'tenant-media'
    and private.has_tenant_role(
      (storage.foldername(name))[1]::uuid,
      array['owner', 'editor']
    )
  );

create policy tenant_media_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'tenant-media'
    and private.has_tenant_role(
      (storage.foldername(name))[1]::uuid,
      array['owner', 'editor']
    )
  )
  with check (
    bucket_id = 'tenant-media'
    and private.has_tenant_role(
      (storage.foldername(name))[1]::uuid,
      array['owner', 'editor']
    )
  );

create policy tenant_media_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'tenant-media'
    and private.has_tenant_role(
      (storage.foldername(name))[1]::uuid,
      array['owner']
    )
  );
