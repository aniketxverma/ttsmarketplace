-- CRITICAL FIX for "Database error creating new user" (registration down).
--
-- 0080/0081 rewrote handle_new_user() to reference the `user_role` enum type
-- (DECLARE v_role user_role / ::user_role). The signup trigger runs as
-- `supabase_auth_admin`, whose search_path does NOT include `public`, so it
-- could not resolve the `user_role` type — failing with "type user_role does
-- not exist". That error is raised at the DECLARE stage, BEFORE any BEGIN/
-- EXCEPTION block, so the earlier "bullet-proof" version still failed and
-- rolled back the whole auth.users insert.
--
-- Fix: pin the function's search_path to `public` and schema-qualify the type
-- (public.user_role). `admin` is still never derivable from signup metadata.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role := 'buyer';
BEGIN
  IF NEW.raw_user_meta_data->>'role' IN ('buyer', 'business_client', 'supplier', 'broker') THEN
    v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, v_role, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
