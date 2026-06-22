-- Fix registration role: create the profile with the role the user chose at
-- signup (stored in raw_user_meta_data->>'role'), instead of always 'buyer'.
-- The post-signup client update can be blocked when email confirmation is on
-- (no session yet / RLS), which left every account defaulting to buyer.
--
-- SECURITY: 'admin' is intentionally NOT derivable from metadata — it must never
-- be self-assignable via signup. Unknown/invalid values fall back to 'buyer'.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      CASE
        WHEN NEW.raw_user_meta_data->>'role' IN ('buyer', 'business_client', 'supplier', 'broker')
        THEN (NEW.raw_user_meta_data->>'role')::user_role
      END,
      'buyer'
    ),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
