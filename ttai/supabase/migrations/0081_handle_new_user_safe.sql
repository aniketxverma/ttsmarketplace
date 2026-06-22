-- Registration was failing with "Database error creating new user": the
-- handle_new_user() trigger that creates a profile on auth.users insert was
-- erroring (and a trigger error rolls back the whole user creation).
--
-- This makes the trigger bullet-proof: it derives the role safely, never throws,
-- and therefore can never block account creation again.
--   • role comes from signup metadata (buyer/business_client/supplier/broker)
--   • 'admin' is NEVER self-assignable via metadata (security)
--   • any unexpected error is swallowed so the auth user is still created

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'buyer';
BEGIN
  BEGIN
    IF NEW.raw_user_meta_data->>'role' IN ('buyer', 'business_client', 'supplier', 'broker') THEN
      v_role := (NEW.raw_user_meta_data->>'role')::user_role;
    END IF;
  EXCEPTION WHEN others THEN
    v_role := 'buyer';
  END;

  BEGIN
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (NEW.id, v_role, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'handle_new_user: profile insert failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
