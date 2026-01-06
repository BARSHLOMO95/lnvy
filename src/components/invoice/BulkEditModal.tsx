import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvoiceStatus, BusinessType, EntryMethod } from '@/types/invoice';
import { Save, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BulkEditData) => void;
  selectedCount: number;
  categories: string[];
}

export interface BulkEditData {
  status?: InvoiceStatus;
  category?: string;
  business_type?: BusinessType;
  entry_method?: EntryMethod;
}

const statusOptions: InvoiceStatus[] = ['חדש', 'בתהליך', 'טופל'];
const businessTypeOptions: BusinessType[] = ['עוסק מורשה', 'עוסק פטור', 'חברה בע"מ', 'ספק חו"ל'];
const entryMethodOptions: EntryMethod[] = ['ידני', 'דיגיטלי'];

const BulkEditModal = ({ isOpen, onClose, onSave, selectedCount, categories }: BulkEditModalProps) => {
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>({
    status: false,
    category: false,
    business_type: false,
    entry_method: false,
  });

  const [formData, setFormData] = useState<BulkEditData>({});

  const toggleField = (field: string) => {
    setEnabledFields(prev => ({ ...prev, [field]: !prev[field] }));
    if (enabledFields[field]) {
      // If disabling, remove the value
      setFormData(prev => {
        const newData = { ...prev };
        delete newData[field as keyof BulkEditData];
        return newData;
      });
    }
  };

  const handleSave = () => {
    // Only include enabled fields
    const dataToSave: BulkEditData = {};
    if (enabledFields.status && formData.status) dataToSave.status = formData.status;
    if (enabledFields.category && formData.category) dataToSave.category = formData.category;
    if (enabledFields.business_type && formData.business_type) dataToSave.business_type = formData.business_type;
    if (enabledFields.entry_method && formData.entry_method) dataToSave.entry_method = formData.entry_method;

    if (Object.keys(dataToSave).length === 0) {
      return;
    }

    onSave(dataToSave);
    handleClose();
  };

  const handleClose = () => {
    setEnabledFields({
      status: false,
      category: false,
      business_type: false,
      entry_method: false,
    });
    setFormData({});
    onClose();
  };

  const hasSelectedFields = Object.values(enabledFields).some(v => v);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">עריכה מרובה</DialogTitle>
          <DialogDescription>
            עדכון {selectedCount} חשבוניות נבחרות. סמן את השדות שברצונך לשנות.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Status */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="enable-status"
              checked={enabledFields.status}
              onCheckedChange={() => toggleField('status')}
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="enable-status" className="cursor-pointer">סטטוס</Label>
              <Select
                disabled={!enabledFields.status}
                value={formData.status}
                onValueChange={(value: InvoiceStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className={!enabledFields.status ? 'opacity-50' : ''}>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="enable-category"
              checked={enabledFields.category}
              onCheckedChange={() => toggleField('category')}
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="enable-category" className="cursor-pointer">קטגוריה</Label>
              <Select
                disabled={!enabledFields.category}
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className={!enabledFields.category ? 'opacity-50' : ''}>
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Business Type */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="enable-business-type"
              checked={enabledFields.business_type}
              onCheckedChange={() => toggleField('business_type')}
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="enable-business-type" className="cursor-pointer">סוג עוסק</Label>
              <Select
                disabled={!enabledFields.business_type}
                value={formData.business_type}
                onValueChange={(value: BusinessType) => setFormData(prev => ({ ...prev, business_type: value }))}
              >
                <SelectTrigger className={!enabledFields.business_type ? 'opacity-50' : ''}>
                  <SelectValue placeholder="בחר סוג עוסק" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypeOptions.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entry Method */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="enable-entry-method"
              checked={enabledFields.entry_method}
              onCheckedChange={() => toggleField('entry_method')}
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="enable-entry-method" className="cursor-pointer">שיטת הזנה</Label>
              <Select
                disabled={!enabledFields.entry_method}
                value={formData.entry_method}
                onValueChange={(value: EntryMethod) => setFormData(prev => ({ ...prev, entry_method: value }))}
              >
                <SelectTrigger className={!enabledFields.entry_method ? 'opacity-50' : ''}>
                  <SelectValue placeholder="בחר שיטה" />
                </SelectTrigger>
                <SelectContent>
                  {entryMethodOptions.map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 ml-1" />
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={!hasSelectedFields}>
            <Save className="h-4 w-4 ml-1" />
            עדכן {selectedCount} חשבוניות
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditModal;
