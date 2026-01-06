-- Change intake_date from date to timestamptz to include time
ALTER TABLE invoices 
ALTER COLUMN intake_date TYPE timestamptz 
USING intake_date::timestamptz;

-- Update default to now() which includes time
ALTER TABLE invoices 
ALTER COLUMN intake_date SET DEFAULT now();