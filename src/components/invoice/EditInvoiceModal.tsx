import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Invoice, InvoiceFormData, InvoiceStatus, BusinessType, EntryMethod } from '@/types/invoice';
import { Save, X } from 'lucide-react';

interface EditInvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<InvoiceFormData>) => void;
  categories: string[];
}

const statusOptions: InvoiceStatus[] = ['חדש', 'בתהליך', 'טופל'];
const businessTypeOptions: BusinessType[] = ['עוסק מורשה', 'עוסק פטור', 'חברה בע"מ', 'ספק חו"ל'];
const entryMethodOptions: EntryMethod[] = ['ידני', 'דיגיטלי'];
const documentTypeOptions = ['חשבונית מס', 'חשבונית מס קבלה', 'קבלה', 'חשבון עסקה', 'תעודת משלוח'];

const EditInvoiceModal = ({ invoice, isOpen, onClose, onSave, categories }: EditInvoiceModalProps) => {
  const [formData, setFormData] = useState<Partial<InvoiceFormData>>({});
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);

  useEffect(() => {
    if (invoice) {
      setFormData({
        intake_date: invoice.intake_date,
        document_date: invoice.document_date,
        status: invoice.status,
        supplier_name: invoice.supplier_name,
        document_number: invoice.document_number,
        document_type: invoice.document_type,
        category: invoice.category,
        amount_before_vat: Number(invoice.amount_before_vat),
        vat_amount: invoice.vat_amount ? Number(invoice.vat_amount) : null,
        total_amount: Number(invoice.total_amount),
        business_type: invoice.business_type,
        entry_method: invoice.entry_method,
        image_url: invoice.image_url,
      });
    }
  }, [invoice]);

  // VAT is now calculated by database trigger based on total_amount and business_type

  const handleSave = () => {
    if (invoice) {
      onSave(invoice.id, formData);
      onClose();
    }
  };

  if (!invoice) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">עריכת חשבונית</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 mt-4">
            {/* Form on the right side */}
            <div className={`${invoice.image_url ? 'md:w-1/2' : 'w-full'} grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4`}>
              <div className="space-y-2">
                <Label>תאריך ושעת קליטה</Label>
                <Input
                  type="datetime-local"
                  value={formData.intake_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, intake_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>סטטוס</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: InvoiceStatus) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>שם ספק</Label>
                <Input
                  value={formData.supplier_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>סוג עוסק</Label>
                <Select
                  value={formData.business_type}
                  onValueChange={(value: BusinessType) => setFormData(prev => ({ ...prev, business_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypeOptions.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>קטגוריה</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>תאריך מסמך</Label>
                <Input
                  type="date"
                  value={formData.document_date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>סוג מסמך</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypeOptions.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>מספר מסמך</Label>
                <Input
                  value={formData.document_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>לפני מע"מ</Label>
                <Input
                  type="number"
                  value={formData.amount_before_vat || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount_before_vat: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>מע"מ (18%)</Label>
                <Input
                  type="number"
                  value={formData.vat_amount || ''}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>סה"כ כולל מע"מ</Label>
                <Input
                  type="number"
                  value={formData.total_amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_amount: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>ידני / דיגיטלי</Label>
                <Select
                  value={formData.entry_method}
                  onValueChange={(value: EntryMethod) => setFormData(prev => ({ ...prev, entry_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {entryMethodOptions.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image on the left side */}
            {invoice.image_url && (
              <div className="md:w-1/2 bg-muted rounded-lg p-4 flex flex-col">
                <Label className="block mb-2">תמונת חשבונית (לחץ להגדלה)</Label>
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                  <img 
                    src={invoice.image_url} 
                    alt="תמונת חשבונית" 
                    className="max-w-full max-h-[600px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsImageEnlarged(true)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 ml-1" />
              ביטול
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 ml-1" />
              שמור
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enlarged image modal */}
      <Dialog open={isImageEnlarged} onOpenChange={setIsImageEnlarged}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
          <div className="flex items-center justify-center w-full h-full">
            <img 
              src={invoice.image_url || ''} 
              alt="תמונת חשבונית מוגדלת" 
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditInvoiceModal;
