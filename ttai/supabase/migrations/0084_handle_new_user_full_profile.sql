-- Capture the FULL registration profile at signup. The post-signup client
-- profile update is blocked when email confirmation is on (no session/RLS), so
-- previously only role + full_name landed on the profile. Copy every detail the
-- registration form stores in user metadata so Admin → Users shows it reliably.
-- (admin is still never derivable from metadata; search_path pinned per 0082.)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role := 'buyer';
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  IF m->>'role' IN ('buyer', 'business_client', 'supplier', 'broker') THEN
    v_role := (m->>'role')::public.user_role;
  END IF;

  INSERT INTO public.profiles (
    id, role, full_name, phone, username,
    company_name, business_type, continent, country_name, city, category,
    annual_turnover, website_url, bio, products_offered
  ) VALUES (
    NEW.id, v_role,
    NULLIF(m->>'full_name', ''), NULLIF(m->>'phone', ''), NULLIF(m->>'username', ''),
    NULLIF(m->>'company_name', ''), NULLIF(m->>'business_type', ''), NULLIF(m->>'continent', ''),
    NULLIF(m->>'country_name', ''), NULLIF(m->>'city', ''), NULLIF(m->>'category', ''),
    NULLIF(m->>'annual_turnover', ''), NULLIF(m->>'website_url', ''),
    NULLIF(m->>'bio', ''), NULLIF(m->>'products_offered', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
