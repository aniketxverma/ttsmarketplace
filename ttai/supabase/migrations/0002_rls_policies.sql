-- ─── ENABLE RLS ON ALL TABLES ────────────────────────────────────────────────

ALTER TABLE countries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_state_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_supplier_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images       ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_promotions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_ledger   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log      ENABLE ROW LEVEL SECURITY;

-- ─── HELPER FUNCTIONS (must come before policies that reference them) ─────────

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION broker_id_check(product_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM broker_supplier_assignments bsa
    JOIN brokers b ON b.id = bsa.broker_id
    JOIN products p ON p.supplier_id = bsa.supplier_id
    WHERE p.id = product_id AND b.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── COUNTRIES ───────────────────────────────────────────────────────────────

CREATE POLICY "countries_public_select" ON countries
  FOR SELECT USING (true);

CREATE POLICY "countries_admin_all" ON countries
  FOR ALL USING (current_user_role() = 'admin');

-- ─── CITIES ──────────────────────────────────────────────────────────────────

CREATE POLICY "cities_public_select" ON cities
  FOR SELECT USING (true);

CREATE POLICY "cities_admin_all" ON cities
  FOR ALL USING (current_user_role() = 'admin');

-- ─── PROFILES ────────────────────────────────────────────────────────────────

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR current_user_role() = 'admin');

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ─── SUPPLIERS ───────────────────────────────────────────────────────────────

CREATE POLICY "suppliers_public_select_active" ON suppliers
  FOR SELECT USING (status = 'ACTIVE' OR owner_id = auth.uid() OR current_user_role() = 'admin');

CREATE POLICY "suppliers_owner_insert" ON suppliers
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "suppliers_owner_update" ON suppliers
  FOR UPDATE USING (
    owner_id = auth.uid() AND status IN ('PENDING', 'UNDER_REVIEW')
  );

CREATE POLICY "suppliers_admin_all" ON suppliers
  FOR ALL USING (current_user_role() = 'admin');

-- ─── SUPPLIER DOCUMENTS ──────────────────────────────────────────────────────

CREATE POLICY "supplier_docs_owner_all" ON supplier_documents
  FOR ALL USING (
    supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
  );

CREATE POLICY "supplier_docs_admin_select" ON supplier_documents
  FOR SELECT USING (current_user_role() = 'admin');

-- ─── SUPPLIER STATE AUDIT ────────────────────────────────────────────────────

CREATE POLICY "supplier_audit_admin_select" ON supplier_state_audit
  FOR SELECT USING (current_user_role() = 'admin');

CREATE POLICY "supplier_audit_system_insert" ON supplier_state_audit
  FOR INSERT WITH CHECK (current_user_role() = 'admin');

-- ─── BROKERS ─────────────────────────────────────────────────────────────────

CREATE POLICY "brokers_owner_select" ON brokers
  FOR SELECT USING (user_id = auth.uid() OR current_user_role() = 'admin');

CREATE POLICY "brokers_owner_insert" ON brokers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "brokers_owner_update" ON brokers
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "brokers_admin_all" ON brokers
  FOR ALL USING (current_user_role() = 'admin');

-- ─── BROKER SUPPLIER ASSIGNMENTS ─────────────────────────────────────────────

CREATE POLICY "bsa_admin_all" ON broker_supplier_assignments
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "bsa_broker_select" ON broker_supplier_assignments
  FOR SELECT USING (
    broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())
  );

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────

CREATE POLICY "categories_public_select" ON categories
  FOR SELECT USING (true);

CREATE POLICY "categories_admin_all" ON categories
  FOR ALL USING (current_user_role() = 'admin');

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────

CREATE POLICY "products_public_select_published" ON products
  FOR SELECT USING (
    (is_published = true AND supplier_id IN (SELECT id FROM suppliers WHERE status = 'ACTIVE'))
    OR supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
    OR broker_id_check(id)
    OR current_user_role() = 'admin'
  );

CREATE POLICY "products_supplier_all" ON products
  FOR ALL USING (
    supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_admin_all" ON products
  FOR ALL USING (current_user_role() = 'admin');

-- ─── PRODUCT IMAGES ──────────────────────────────────────────────────────────

CREATE POLICY "product_images_public_select" ON product_images
  FOR SELECT USING (true);

CREATE POLICY "product_images_supplier_all" ON product_images
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products
      WHERE supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
    )
  );

-- ─── BROKER PROMOTIONS ───────────────────────────────────────────────────────

CREATE POLICY "promotions_public_select_active" ON broker_promotions
  FOR SELECT USING (is_active = true AND ends_at > now());

CREATE POLICY "promotions_broker_all" ON broker_promotions
  FOR ALL USING (
    broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())
  );

CREATE POLICY "promotions_admin_all" ON broker_promotions
  FOR ALL USING (current_user_role() = 'admin');

-- ─── ORDERS ──────────────────────────────────────────────────────────────────

CREATE POLICY "orders_buyer_select" ON orders
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "orders_supplier_select" ON orders
  FOR SELECT USING (
    supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
  );

CREATE POLICY "orders_broker_select" ON orders
  FOR SELECT USING (
    broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())
  );

CREATE POLICY "orders_insert" ON orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "orders_admin_all" ON orders
  FOR ALL USING (current_user_role() = 'admin');

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────

CREATE POLICY "order_items_participants_select" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE buyer_id = auth.uid()
         OR supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
         OR broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())
    )
    OR current_user_role() = 'admin'
  );

CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid())
    OR current_user_role() = 'admin'
  );

-- ─── INVOICES ────────────────────────────────────────────────────────────────

CREATE POLICY "invoices_participant_select" ON invoices
  FOR SELECT USING (
    broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())
    OR order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid())
    OR current_user_role() = 'admin'
  );

CREATE POLICY "invoices_admin_all" ON invoices
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── TRANSACTION LEDGER ──────────────────────────────────────────────────────

CREATE POLICY "ledger_participant_select" ON transaction_ledger
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid())
         OR supplier_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid())
    )
    OR current_user_role() = 'admin'
  );

CREATE POLICY "ledger_insert" ON transaction_ledger
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── PAYOUTS ─────────────────────────────────────────────────────────────────

CREATE POLICY "payouts_recipient_select" ON payouts
  FOR SELECT USING (
    (recipient_type = 'broker'   AND recipient_id IN (SELECT id FROM brokers   WHERE user_id  = auth.uid()))
    OR (recipient_type = 'supplier' AND recipient_id IN (SELECT id FROM suppliers WHERE owner_id = auth.uid()))
    OR current_user_role() = 'admin'
  );

CREATE POLICY "payouts_insert" ON payouts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "payouts_admin_all" ON payouts
  FOR ALL USING (current_user_role() = 'admin');

-- ─── ADMIN AUDIT LOG ─────────────────────────────────────────────────────────

CREATE POLICY "audit_log_admin_select" ON admin_audit_log
  FOR SELECT USING (current_user_role() = 'admin');

CREATE POLICY "audit_log_insert" ON admin_audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
