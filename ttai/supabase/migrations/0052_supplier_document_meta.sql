-- Supplier documents become public-facing catalogs / price lists / brochures.
-- Add display metadata and a per-file "public" flag, plus a public read policy so
-- the downloadable files show on the supplier's brand page to every visitor.

alter table supplier_documents add column if not exists title           text;
alter table supplier_documents add column if not exists file_name       text;
alter table supplier_documents add column if not exists file_size_bytes bigint;
alter table supplier_documents add column if not exists is_public       boolean not null default false;
alter table supplier_documents add column if not exists sort_order      integer not null default 0;

-- Anyone can read the files a supplier has explicitly marked public (catalogs,
-- price lists). Verification documents (is_public = false) remain owner/admin-only
-- via the existing policies.
drop policy if exists "supplier_docs_public_select" on supplier_documents;
create policy "supplier_docs_public_select" on supplier_documents
  for select using (is_public = true);

create index if not exists idx_supplier_documents_public
  on supplier_documents(supplier_id, sort_order)
  where is_public = true;
