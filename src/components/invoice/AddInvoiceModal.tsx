import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvoiceFormData, InvoiceStatus, BusinessType, EntryMethod } from '@/types/invoice';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InvoiceFormData) => void;
  existingCategories: string[];
}

const statusOptions: InvoiceStatus[] = ['חדש', 'בתהליך', 'טופל'];
const businessTypeOptions: BusinessType[] = ['עוסק מורשה', 'עוסק פטור', 'חברה בע"מ', 'ספק חו"ל'];
const entryMethodOptions: EntryMethod[] = ['ידני', 'דיגיטלי'];
const documentTypeOptions = ['חשבונית מס', 'חשבונית מס קבלה', 'קבלה', 'חשבון עסקה', 'תעודת משלוח'];

const defaultCategories = ['תקשורת', 'סופרים', 'משרד', 'שירותים', 'ציוד', 'אחר'];

const AddInvoiceModal = ({ isOpen, onClose, onSave, existingCategories }: AddInvoiceModalProps) => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    intake_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    document_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'חדש',
    supplier_name: '',
    document_number: '',
    document_type: 'חשבונית מס',
    category: '',
    amount_before_vat: 0,
    vat_amount: null,
    total_amount: 0,
    business_type: 'עוסק מורשה',
    entry_method: 'ידני',
    image_url: null,
  });

  const categories = [...new Set([...defaultCategories, ...existingCategories])];

  // VAT is now calculated by database trigger based on total_amount and business_type

  const handleSave = () => {
    if (!formData.supplier_name || !formData.document_number || !formData.category) {
      return;
    }
    onSave(formData);
    onClose();
    // Reset form
    setFormData({
      intake_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      document_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'חדש',
      supplier_name: '',
      document_number: '',
      document_type: 'חשבונית מס',
      category: '',
      amount_before_vat: 0,
      vat_amount: null,
      total_amount: 0,
      business_type: 'עוסק מורשה',
      entry_method: 'ידני',
      image_url: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">הוספת חשבונית חדשה</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className="space-y-2">
            <Label>תאריך ושעת קליטה</Label>
            <Input
              type="datetime-local"
              value={formData.intake_date}
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
            <Label>שם ספק *</Label>
            <Input
              value={formData.supplier_name}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
              placeholder="הזן שם ספק"
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
            <Label>קטגוריה *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר קטגוריה" />
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
              value={formData.document_date}
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
            <Label>מספר מסמך *</Label>
            <Input
              value={formData.document_number}
              onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
              placeholder="הזן מספר מסמך"
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

        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 ml-1" />
            ביטול
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.supplier_name || !formData.document_number || !formData.category}
          >
            <Plus className="h-4 w-4 ml-1" />
            הוסף חשבונית
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddInvoiceModal;
