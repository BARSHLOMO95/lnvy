-- Drop existing VAT triggers and function
DROP TRIGGER IF EXISTS calculate_vat_on_insert ON public.invoices;
DROP TRIGGER IF EXISTS calculate_vat_on_update ON public.invoices;
DROP FUNCTION IF EXISTS public.calculate_vat_on_invoice();

-- Create improved function to calculate VAT with business_type awareness
CREATE OR REPLACE FUNCTION public.calculate_vat_with_business_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Normalize business_type variants for foreign supplier
  -- Handle different quotation marks: " and ״
  IF NEW.business_type IN ('ספק חול', 'ספק חו"ל', 'ספק חו״ל') THEN
    NEW.business_type := 'ספק חו"ל';
  END IF;

  -- Calculate VAT based on business_type
  IF NEW.total_amount IS NOT NULL AND NEW.total_amount > 0 THEN
    -- Check if business_type is VAT-exempt
    IF NEW.business_type IN ('ספק חו"ל', 'עוסק פטור') THEN
      -- No VAT for foreign suppliers or VAT-exempt businesses
      NEW.vat_amount := 0;
      NEW.amount_before_vat := NEW.total_amount;
    ELSE
      -- Calculate 18% VAT for other business types
      -- Formula: before_vat = total / 1.18, vat = total - before_vat
      NEW.amount_before_vat := ROUND((NEW.total_amount / 1.18)::numeric, 2);
      NEW.vat_amount := ROUND((NEW.total_amount - NEW.amount_before_vat)::numeric, 2);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for INSERT
CREATE TRIGGER calculate_vat_on_insert
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.calculate_vat_with_business_type();

-- Create trigger for UPDATE
-- Trigger when total_amount, business_type, or document_type changes
CREATE TRIGGER calculate_vat_on_update
BEFORE UPDATE ON public.invoices
FOR EACH ROW
WHEN (
  OLD.total_amount IS DISTINCT FROM NEW.total_amount OR
  OLD.business_type IS DISTINCT FROM NEW.business_type OR
  OLD.document_type IS DISTINCT FROM NEW.document_type
)
EXECUTE FUNCTION public.calculate_vat_with_business_type();
