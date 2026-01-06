export type InvoiceStatus = 'חדש' | 'בתהליך' | 'טופל';
export type BusinessType = 'עוסק מורשה' | 'עוסק פטור' | 'חברה בע"מ' | 'ספק חו"ל';
export type EntryMethod = 'ידני' | 'דיגיטלי';

export interface Invoice {
  id: string;
  user_id: string;
  intake_date: string;
  document_date: string;
  status: InvoiceStatus;
  supplier_name: string;
  document_number: string;
  document_type: string;
  category: string;
  amount_before_vat: number;
  vat_amount: number | null;
  total_amount: number;
  business_type: BusinessType;
  entry_method: EntryMethod;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceFormData {
  intake_date: string;
  document_date: string;
  status: InvoiceStatus;
  supplier_name: string;
  document_number: string;
  document_type: string;
  category: string;
  amount_before_vat: number;
  vat_amount: number | null;
  total_amount: number;
  business_type: BusinessType;
  entry_method: EntryMethod;
  image_url: string | null;
}

export interface FilterState {
  intakeMonths: string[];
  documentMonths: string[];
  statuses: InvoiceStatus[];
  suppliers: string[];
  categories: string[];
  businessTypes: BusinessType[];
  amountMin: number | null;
  amountMax: number | null;
}

export type DuplicatesFilterMode = 'all' | 'duplicates_only' | 'no_duplicates';

export interface KPIData {
  totalWithVat: number;
  totalBeforeVat: number;
  totalVat: number;
  uniqueSuppliers: number;
}
