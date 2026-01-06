-- Create enum for invoice status
CREATE TYPE public.invoice_status AS ENUM ('חדש', 'בתהליך', 'טופל');

-- Create enum for business type
CREATE TYPE public.business_type AS ENUM ('עוסק מורשה', 'עוסק פטור', 'חברה בע"מ', 'ספק חו"ל');

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intake_date DATE NOT NULL DEFAULT CURRENT_DATE,
    document_date DATE NOT NULL,
    status invoice_status NOT NULL DEFAULT 'חדש',
    supplier_name TEXT NOT NULL,
    document_number TEXT NOT NULL,
    category TEXT NOT NULL,
    amount_before_vat DECIMAL(12,2) NOT NULL,
    vat_amount DECIMAL(12,2),
    total_amount DECIMAL(12,2) NOT NULL,
    business_type business_type NOT NULL DEFAULT 'עוסק מורשה',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - only the owner can access their invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.invoices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public.invoices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_intake_date ON public.invoices(intake_date);
CREATE INDEX idx_invoices_supplier_name ON public.invoices(supplier_name);
CREATE INDEX idx_invoices_status ON public.invoices(status);