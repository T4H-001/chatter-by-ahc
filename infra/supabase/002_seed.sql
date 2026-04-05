insert into chat_tenant (tenant_key, display_name, brand_name, brand_line, primary_domain)
values ('ahc-chatter', 'Chatter by AHC', 'Chatter by AHC', 'Say it once. Chatter prepares the people, the systems, and the next move.', 'augmentedhumanity.coach')
on conflict (tenant_key) do nothing;

insert into chat_library (tenant_id, library_key, display_name, category, description, is_global)
select t.id, x.library_key, x.display_name, x.category, x.description, true
from chat_tenant t
cross join (values
  ('founder','Founder / Operator','business','Founder and operating change library'),
  ('architecture','Architecture / Delivery','delivery','Code, release, validation, deployment library'),
  ('support','Support / Service Ops','operations','Issue to closure pack library'),
  ('government','Government','policy','Policy and implementation library')
) x(library_key, display_name, category, description)
where t.tenant_key = 'ahc-chatter'
on conflict do nothing;
