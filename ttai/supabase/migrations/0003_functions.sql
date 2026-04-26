-- ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Generates sequential invoice numbers: INV-YYYYMM-NNNNN
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  seq    INT;
BEGIN
  prefix := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
  SELECT COUNT(*) + 1 INTO seq
  FROM invoices
  WHERE invoice_number LIKE prefix || '%';
  RETURN prefix || LPAD(seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Checks if a broker is assigned to a supplier
CREATE OR REPLACE FUNCTION broker_assigned_to_supplier(p_broker_id UUID, p_supplier_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM broker_supplier_assignments
    WHERE broker_id = p_broker_id AND supplier_id = p_supplier_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns supplier id for a given owner user
CREATE OR REPLACE FUNCTION get_supplier_id_for_user(p_user_id UUID)
RETURNS UUID AS $$
  SELECT id FROM suppliers WHERE owner_id = p_user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns broker id for a given user
CREATE OR REPLACE FUNCTION get_broker_id_for_user(p_user_id UUID)
RETURNS UUID AS $$
  SELECT id FROM brokers WHERE user_id = p_user_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
