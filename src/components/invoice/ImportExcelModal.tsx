import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { InvoiceFormData, BusinessType, InvoiceStatus, EntryMethod } from '@/types/invoice';

const VALID_ENTRY_METHODS: EntryMethod[] = ['ידני', 'דיגיטלי'];

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (invoices: InvoiceFormData[]) => void;
}

const COLUMN_MAPPING: Record<string, keyof InvoiceFormData> = {
  'תאריך קליטה': 'intake_date',
  'תאריך מסמך': 'document_date',
  'סטטוס': 'status',
  'שם ספק': 'supplier_name',
  'שם הספק': 'supplier_name',
  'מספר מסמך': 'document_number',
  'סוג מסמך': 'document_type',
  'קטגוריה': 'category',
  'לפני מע"מ': 'amount_before_vat',
  'סכום לפני מע"מ': 'amount_before_vat',
  'סכום לפני מעמ': 'amount_before_vat',
  'מעמ': 'vat_amount',
  'מע"מ': 'vat_amount',
  'סה"כ': 'total_amount',
  'סכום כולל': 'total_amount',
  'סכום כולל מע"מ': 'total_amount',
  'סכום כולל מעמ': 'total_amount',
  'סוג עוסק': 'business_type',
  'ידני / דיגיטלי': 'entry_method',
  'ידני/דיגטלי': 'entry_method',
  'ידני/דיגיטלי': 'entry_method',
  'תמונה': 'image_url',
  'קישור תמונה מהדרייב': 'image_url',
};

const VALID_STATUSES: InvoiceStatus[] = ['חדש', 'בתהליך', 'טופל'];
const STATUS_MAPPING: Record<string, InvoiceStatus> = {
  'חדש': 'חדש',
  'בתהליך': 'בתהליך',
  'טופל': 'טופל',
  'ממתין': 'חדש',
};
const VALID_BUSINESS_TYPES: BusinessType[] = ['עוסק מורשה', 'עוסק פטור', 'חברה בע"מ', 'ספק חו"ל'];
const BUSINESS_TYPE_MAPPING: Record<string, BusinessType> = {
  'עוסק מורשה': 'עוסק מורשה',
  'עוסק פטור': 'עוסק פטור',
  'חברה בע"מ': 'חברה בע"מ',
  'ספק חו"ל': 'ספק חו"ל',
  "ספק חו'ל": 'ספק חו"ל',
};

const ImportExcelModal = ({ isOpen, onClose, onImport }: ImportExcelModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<InvoiceFormData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseExcelDate = (value: unknown): string => {
    if (!value) return new Date().toISOString().split('T')[0];
    
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    
    if (typeof value === 'string') {
      const parts = value.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setErrors([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const parsedInvoices: InvoiceFormData[] = [];
      const parseErrors: string[] = [];

      jsonData.forEach((row: unknown, index: number) => {
        const typedRow = row as Record<string, unknown>;
        try {
          const invoice: Partial<InvoiceFormData> = {};

          Object.entries(typedRow).forEach(([key, value]) => {
            const mappedKey = COLUMN_MAPPING[key.trim()];
            if (mappedKey) {
              if (mappedKey === 'intake_date' || mappedKey === 'document_date') {
                invoice[mappedKey] = parseExcelDate(value);
              } else if (mappedKey === 'amount_before_vat' || mappedKey === 'total_amount') {
                invoice[mappedKey] = parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;
              } else if (mappedKey === 'status') {
                const statusStr = String(value).trim();
                invoice[mappedKey] = STATUS_MAPPING[statusStr] || 'חדש';
              } else if (mappedKey === 'business_type') {
                const businessStr = String(value).trim();
                invoice[mappedKey] = BUSINESS_TYPE_MAPPING[businessStr] || 'עוסק מורשה';
              } else if (mappedKey === 'entry_method') {
                const entryMethod = String(value).trim() as EntryMethod;
                invoice[mappedKey] = VALID_ENTRY_METHODS.includes(entryMethod) ? entryMethod : 'ידני';
              } else if (mappedKey === 'vat_amount') {
                invoice[mappedKey] = parseFloat(String(value).replace(/[^\d.-]/g, '')) || null;
              } else {
                (invoice as Record<string, unknown>)[mappedKey] = String(value);
              }
            }
          });

          // Use defaults for missing fields instead of rejecting
          const supplierName = invoice.supplier_name || 'ספק לא ידוע';
          const documentNumber = invoice.document_number || `AUTO-${Date.now()}-${index}`;
          const documentDate = invoice.document_date || new Date().toISOString().split('T')[0];
          const amountBeforeVat = invoice.amount_before_vat || 0;
          const businessType = invoice.business_type || 'עוסק מורשה';

          // VAT is calculated by database trigger based on total_amount and business_type
          // If total_amount is not provided, calculate it from amount_before_vat as a fallback
          const totalAmount = invoice.total_amount || amountBeforeVat;

          parsedInvoices.push({
            intake_date: invoice.intake_date || new Date().toISOString().split('T')[0],
            document_date: documentDate,
            status: invoice.status || 'חדש',
            supplier_name: supplierName,
            document_number: documentNumber,
            document_type: invoice.document_type || 'חשבונית מס',
            category: invoice.category || 'כללי',
            total_amount: totalAmount,
            business_type: businessType,
            entry_method: invoice.entry_method || 'דיגיטלי',
            image_url: invoice.image_url || null,
            // amount_before_vat and vat_amount will be calculated by database trigger
          });
        } catch (err) {
          parseErrors.push(`שורה ${index + 2}: שגיאה בקריאה`);
        }
      });

      setPreview(parsedInvoices);
      setErrors(parseErrors);
    } catch (err) {
      toast.error('שגיאה בקריאת הקובץ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (preview.length === 0) {
      toast.error('אין נתונים לייבוא');
      return;
    }

    onImport(preview);
    toast.success(`${preview.length} חשבוניות יובאו בהצלחה`);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            ייבוא חשבוניות מ-Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p>קורא קובץ...</p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-10 w-10 text-primary" />
                <p className="font-medium">{file.name}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-10 w-10" />
                <p>לחץ כאן לבחירת קובץ Excel</p>
                <p className="text-sm">תומך ב: xlsx, xls, csv</p>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">שגיאות ({errors.length})</span>
              </div>
              <ul className="text-sm text-destructive space-y-1 max-h-24 overflow-y-auto">
                {errors.slice(0, 5).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {errors.length > 5 && <li>...ועוד {errors.length - 5} שגיאות</li>}
              </ul>
            </div>
          )}

          {preview.length > 0 && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">נמצאו {preview.length} חשבוניות תקינות</span>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">עמודות נתמכות:</p>
            <p>תאריך קליטה, תאריך מסמך, סטטוס, שם ספק, מספר מסמך, קטגוריה, לפני מע"מ, סה"כ, סוג עוסק</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleImport} disabled={preview.length === 0 || loading}>
              ייבא {preview.length} חשבוניות
            </Button>
            <Button variant="outline" onClick={handleClose}>
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExcelModal;
