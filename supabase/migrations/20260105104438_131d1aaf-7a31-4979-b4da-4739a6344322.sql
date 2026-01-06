-- Allow NULL values for all optional fields
ALTER TABLE public.invoices ALTER COLUMN category DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN category SET DEFAULT NULL;

ALTER TABLE public.invoices ALTER COLUMN document_number DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN document_number SET DEFAULT NULL;

ALTER TABLE public.invoices ALTER COLUMN document_type DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN document_type SET DEFAULT NULL;

ALTER TABLE public.invoices ALTER COLUMN supplier_name DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN supplier_name SET DEFAULT NULL;

-- Change business_type to text to allow empty values
ALTER TABLE public.invoices ALTER COLUMN business_type DROP DEFAULT;
ALTER TABLE public.invoices ALTER COLUMN business_type TYPE text USING business_type::text;
ALTER TABLE public.invoices ALTER COLUMN business_type DROP NOT NULL;

-- Change entry_method to allow NULL
ALTER TABLE public.invoices ALTER COLUMN entry_method DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN entry_method SET DEFAULT NULL;