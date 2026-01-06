-- Make all invoice fields nullable (except system fields)
ALTER TABLE public.invoices ALTER COLUMN intake_date DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN status SET DEFAULT NULL;
ALTER TABLE public.invoices ALTER COLUMN amount_before_vat DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN total_amount DROP NOT NULL;