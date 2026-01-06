-- Create function to calculate VAT from total_amount
CREATE OR REPLACE FUNCTION public.calculate_vat_on_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only calculate if total_amount is provided
  IF NEW.total_amount IS NOT NULL AND NEW.total_amount > 0 THEN
    -- Calculate: before_vat = total / 1.18, vat = total - before_vat
    NEW.amount_before_vat := ROUND((NEW.total_amount / 1.18)::numeric, 2);
    NEW.vat_amount := ROUND((NEW.total_amount - NEW.amount_before_vat)::numeric, 2);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT
CREATE TRIGGER calculate_vat_on_insert
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.calculate_vat_on_invoice();

-- Create trigger for UPDATE (only when total_amount changes)
CREATE TRIGGER calculate_vat_on_update
BEFORE UPDATE ON public.invoices
FOR EACH ROW
WHEN (OLD.total_amount IS DISTINCT FROM NEW.total_amount)
EXECUTE FUNCTION public.calculate_vat_on_invoice();