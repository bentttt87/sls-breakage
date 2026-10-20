-- Breakage v123 — management is a national, read-only monitoring role.
create or replace function public.breakage_my_access_v44()
returns jsonb
language plpgsql
stable security definer
set search_path to 'public','extensions'
as $function$
declare
  v_uid uuid:=auth.uid(); v_role text; v_rdc text; v_active boolean; v_username text; v_breakage_role text; v_national boolean;
begin
  perform public.breakage_require_member_v60();
  if v_uid is null then raise exception 'Unauthorized'; end if;
  select role,rdc_name,is_active into v_role,v_rdc,v_active from public.user_roles where user_id=v_uid;
  if v_role is null then raise exception 'Unauthorized: role tidak ditemukan'; end if;
  if v_active is distinct from true then raise exception 'Unauthorized: account inactive'; end if;
  v_username:=public.sls_current_canonical_user_id();
  v_national:=v_role in ('master','management') or (v_role='rdc_manager' and v_rdc is null);
  v_breakage_role:=case
    when v_role in ('operator','staff') then 'operator'
    when v_role='admin' then 'admin'
    when v_role='supervisor' then 'spv'
    when v_role='rdc_manager' and v_rdc is null then 'manager'
    when v_role='rdc_manager' then 'rdc_manager'
    when v_role='management' then 'management'
    when v_role='master' then 'master'
    else 'viewer' end;
  return jsonb_build_object(
    'user_id',v_uid,'username',v_username,'role',v_role,'breakage_role',v_breakage_role,'rdc_name',v_rdc,'active',v_active,
    'can_input',v_role in ('operator','admin','staff'),'can_submit',false,'can_approve',v_role='supervisor','can_submit_approve',v_role='supervisor',
    'can_review',v_role in ('rdc_manager','master'),'can_adjust',v_role='master','can_finalize',v_role='master',
    'can_view_monitoring',v_role in ('supervisor','rdc_manager','management','master'),
    'can_manage_logistics',v_role='supervisor','can_delete_logistics',v_role='master',
    'is_manager',v_role='rdc_manager' and v_rdc is null,'is_national',v_national,'is_master',v_role='master'
  );
end;
$function$;
