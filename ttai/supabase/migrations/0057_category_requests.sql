-- Supplier-driven category requests. A supplier can request a new MAIN category
-- when theirs doesn't exist; it's created as 'pending' and only becomes visible
-- everywhere (marketplace, shops, filters, search) once an admin approves it.
alter table categories add column if not exists status       text not null default 'active'; -- active | pending | rejected
alter table categories add column if not exists requested_by uuid references suppliers(id) on delete set null;
alter table categories add column if not exists icon         text;
alter table categories add column if not exists image_url    text;

-- Existing categories are already live.
update categories set status = 'active' where status is null;

create index if not exists idx_categories_status on categories(status);
