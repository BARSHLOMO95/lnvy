-- Allow NULL for document_date as well (needed for empty incoming docs)
ALTER TABLE public.invoices ALTER COLUMN document_date DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN document_date SET DEFAULT NULL;