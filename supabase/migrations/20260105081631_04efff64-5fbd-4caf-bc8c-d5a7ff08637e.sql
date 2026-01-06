-- Add new columns for document type and entry method
ALTER TABLE public.invoices 
ADD COLUMN document_type text NOT NULL DEFAULT 'חשבונית מס',
ADD COLUMN entry_method text NOT NULL DEFAULT 'ידני';

-- Add check constraint for entry_method
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_entry_method_check CHECK (entry_method IN ('ידני', 'דיגיטלי'));