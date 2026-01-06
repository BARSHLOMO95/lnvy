import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Invoice, InvoiceStatus, BusinessType, EntryMethod } from '@/types/invoice';
import { format } from 'date-fns';
import { ArrowUpDown, ArrowUp, ArrowDown, FileImage, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface InvoiceTableProps {
  invoices: Invoice[];
  selectedIds: string[];
  duplicateIds?: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onRowClick: (invoice: Invoice) => void;
  onSupplierClick: (supplierName: string) => void;
  onImageClick: (imageUrl: string) => void;
}

type SortField = 'intake_date' | 'document_date' | 'status' | 'supplier_name' | 'document_number' | 'document_type' | 'category' | 'amount_before_vat' | 'vat_amount' | 'total_amount' | 'business_type' | 'entry_method';
type SortDirection = 'asc' | 'desc';

interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  minWidth: number;
}

const defaultColumnWidths: Record<string, number> = {
  checkbox: 40,
  intake_date: 100,
  status: 70,
  supplier_name: 120,
  business_type: 90,
  category: 80,
  document_date: 90,
  document_type: 80,
  document_number: 80,
  amount_before_vat: 85,
  vat_amount: 70,
  total_amount: 90,
  entry_method: 70,
  image: 45,
};

const statusColors: Record<InvoiceStatus, string> = {
  'חדש': 'bg-amber-100 text-amber-700 border-amber-200',
  'בתהליך': 'bg-blue-100 text-blue-700 border-blue-200',
  'טופל': 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const businessTypeColors: Record<BusinessType, string> = {
  'עוסק מורשה': 'bg-violet-100 text-violet-700 border-violet-200',
  'עוסק פטור': 'bg-pink-100 text-pink-700 border-pink-200',
  'חברה בע"מ': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'ספק חו"ל': 'bg-orange-100 text-orange-700 border-orange-200',
};

const entryMethodColors: Record<EntryMethod, string> = {
  'ידני': 'bg-rose-100 text-rose-700 border-rose-200',
  'דיגיטלי': 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const categoryColors: Record<string, string> = {
  'חשמל': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'מים': 'bg-sky-100 text-sky-700 border-sky-200',
  'גז': 'bg-orange-100 text-orange-700 border-orange-200',
  'טלפון': 'bg-purple-100 text-purple-700 border-purple-200',
  'אינטרנט': 'bg-blue-100 text-blue-700 border-blue-200',
  'ביטוח': 'bg-teal-100 text-teal-700 border-teal-200',
  'שכירות': 'bg-amber-100 text-amber-700 border-amber-200',
  'משרדי': 'bg-slate-100 text-slate-700 border-slate-200',
  'רכב': 'bg-red-100 text-red-700 border-red-200',
  'דלק': 'bg-lime-100 text-lime-700 border-lime-200',
  'אחר': 'bg-gray-100 text-gray-700 border-gray-200',
};

const getCategoryColor = (category: string): string => {
  return categoryColors[category] || 'bg-slate-100 text-slate-600 border-slate-200';
};

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return '-';
  return `₪${amount.toLocaleString('he-IL')}`;
};

const InvoiceTable = ({
  invoices,
  selectedIds,
  duplicateIds,
  onToggleSelection,
  onToggleSelectAll,
  onRowClick,
  onSupplierClick,
  onImageClick,
}: InvoiceTableProps) => {
  const [sortField, setSortField] = useState<SortField>('intake_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (aVal === null || aVal === undefined) aVal = '' as any;
    if (bVal === null || bVal === undefined) bVal = '' as any;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortDirection === 'asc' 
      ? aStr.localeCompare(bStr, 'he')
      : bStr.localeCompare(aStr, 'he');
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40 shrink-0" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 shrink-0" />
      : <ArrowDown className="h-3 w-3 shrink-0" />;
  };

  const isAllSelected = invoices.length > 0 && selectedIds.length === invoices.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < invoices.length;

  const updateColumnWidth = (key: string, value: number) => {
    setColumnWidths(prev => ({ ...prev, [key]: value }));
  };

  const columnSettings = [
    { key: 'supplier_name', label: 'שם ספק', min: 80, max: 200 },
    { key: 'category', label: 'קטגוריה', min: 60, max: 150 },
    { key: 'document_number', label: 'מספר מסמך', min: 60, max: 120 },
    { key: 'amount_before_vat', label: 'לפני מע"מ', min: 70, max: 120 },
    { key: 'total_amount', label: 'סה"כ', min: 70, max: 120 },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" dir="rtl">
      {/* Column Settings */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex-row-reverse">
        <span className="text-sm text-muted-foreground">
          {invoices.length} רשומות
        </span>
        <Popover open={showColumnSettings} onOpenChange={setShowColumnSettings}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="flex-row-reverse">
              <Settings2 className="h-4 w-4 ml-2" />
              רוחב עמודות
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 bg-popover" dir="rtl">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-right">התאמת רוחב עמודות</h4>
              {columnSettings.map(col => (
                <div key={col.key} className="space-y-2">
                  <div className="flex justify-between text-sm flex-row-reverse">
                    <Label>{col.label}</Label>
                    <span className="text-muted-foreground">{columnWidths[col.key]}px</span>
                  </div>
                  <Slider
                    value={[columnWidths[col.key]]}
                    min={col.min}
                    max={col.max}
                    step={5}
                    onValueChange={([val]) => updateColumnWidth(col.key, val)}
                  />
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setColumnWidths(defaultColumnWidths)}
              >
                איפוס לברירת מחדל
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-200">
              <TableHead style={{ width: columnWidths.checkbox }} className="text-center py-3 px-2">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = isPartiallySelected;
                    }
                  }}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.intake_date }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('intake_date')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>ת. קליטה</span>
                  <SortIcon field="intake_date" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.status }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>סטטוס</span>
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.supplier_name }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('supplier_name')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>שם הספק</span>
                  <SortIcon field="supplier_name" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.business_type }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('business_type')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>עוסק</span>
                  <SortIcon field="business_type" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.category }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>קטגוריה</span>
                  <SortIcon field="category" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.document_date }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('document_date')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>ת. מסמך</span>
                  <SortIcon field="document_date" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.document_type }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('document_type')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>אסמכתא</span>
                  <SortIcon field="document_type" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.document_number }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('document_number')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>מס' מסמך</span>
                  <SortIcon field="document_number" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.amount_before_vat }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('amount_before_vat')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>לפני מע"מ</span>
                  <SortIcon field="amount_before_vat" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.vat_amount }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('vat_amount')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>מע"מ</span>
                  <SortIcon field="vat_amount" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.total_amount }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('total_amount')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>סה"כ</span>
                  <SortIcon field="total_amount" />
                </div>
              </TableHead>
              <TableHead 
                style={{ width: columnWidths.entry_method }}
                className="cursor-pointer hover:bg-slate-100 transition-colors py-3 px-2 whitespace-nowrap text-right text-slate-600 font-medium text-xs"
                onClick={() => handleSort('entry_method')}
              >
                <div className="flex items-center gap-1 flex-row-reverse justify-end">
                  <span>שיטה</span>
                  <SortIcon field="entry_method" />
                </div>
              </TableHead>
              <TableHead style={{ width: columnWidths.image }} className="text-center py-3 px-2 text-slate-600 font-medium text-xs">תמונה</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-12 text-slate-400">
                  לא נמצאו חשבוניות
                </TableCell>
              </TableRow>
            ) : (
              sortedInvoices.map((invoice, index) => (
                <TableRow
                  key={invoice.id}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-100',
                    selectedIds.includes(invoice.id) && 'bg-blue-50/50',
                    duplicateIds?.has(invoice.id) && 'bg-amber-50/50 border-r-4 border-r-amber-400'
                  )}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (
                      target.closest('[data-checkbox]') ||
                      target.closest('[data-supplier]') ||
                      target.closest('[data-image]')
                    ) {
                      return;
                    }
                    onRowClick(invoice);
                  }}
                >
                  <TableCell data-checkbox className="py-4 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(invoice.id)}
                      onCheckedChange={() => onToggleSelection(invoice.id)}
                      className="border-slate-300"
                    />
                  </TableCell>
                  <TableCell className="py-4 px-2 whitespace-nowrap text-right">
                    {invoice.intake_date ? (
                      <>
                        <div className="text-slate-700 text-sm">{format(new Date(invoice.intake_date), 'dd/MM/yyyy')}</div>
                        <div className="text-slate-400 text-xs">{format(new Date(invoice.intake_date), 'HH:mm')}</div>
                      </>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-right">
                    {invoice.status ? (
                      <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', statusColors[invoice.status])}>
                        {invoice.status === 'בתהליך' ? 'ממתין' : invoice.status}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-right">
                    {invoice.supplier_name ? (
                      <span
                        data-supplier
                        className="text-slate-800 hover:text-blue-600 hover:underline cursor-pointer text-sm block text-right leading-relaxed"
                        style={{ maxWidth: columnWidths.supplier_name }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSupplierClick(invoice.supplier_name!);
                        }}
                        title={invoice.supplier_name}
                      >
                        {invoice.supplier_name}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-right">
                    {invoice.business_type ? (
                      <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', businessTypeColors[invoice.business_type as BusinessType])}>
                        {invoice.business_type}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-right">
                    {invoice.category ? (
                      <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', getCategoryColor(invoice.category))} title={invoice.category}>
                        {invoice.category}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-2 whitespace-nowrap text-sm text-slate-600 text-right">
                    {invoice.document_date ? format(new Date(invoice.document_date), 'dd/MM/yy') : <span className="text-slate-400">-</span>}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-sm text-slate-600 text-right" title={invoice.document_type || ''}>
                    {invoice.document_type ? (invoice.document_type === 'חשבונית מס' ? 'חשבונית מס' : invoice.document_type.substring(0, 10)) : <span className="text-slate-400">-</span>}
                  </TableCell>
                  <TableCell className="py-4 px-2 font-mono text-sm text-slate-600 text-right">{invoice.document_number || <span className="text-slate-400">-</span>}</TableCell>
                  <TableCell className="py-4 px-2 text-right text-sm text-slate-700 whitespace-nowrap">
                    {invoice.amount_before_vat != null ? `₪${Number(invoice.amount_before_vat).toLocaleString('he-IL')}` : <span className="text-slate-400">-</span>}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-right text-sm whitespace-nowrap">
                    {invoice.vat_amount ? (
                      <span className="text-slate-700">
                        ₪{Number(invoice.vat_amount).toLocaleString('he-IL')}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-right whitespace-nowrap">
                    {invoice.total_amount != null ? (
                      <span className={cn(
                        'text-sm font-semibold px-2 py-1 rounded',
                        Number(invoice.total_amount) >= 1000 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : 'text-slate-800'
                      )}>
                        ₪{Number(invoice.total_amount).toLocaleString('he-IL')}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-right">
                    {invoice.entry_method ? (
                      <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', entryMethodColors[invoice.entry_method as EntryMethod])}>
                        {invoice.entry_method}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-2 text-center">
                    {invoice.image_url ? (
                      <button
                        data-image
                        className="text-blue-500 hover:text-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageClick(invoice.image_url!);
                        }}
                      >
                        <FileImage className="h-5 w-5" />
                      </button>
                    ) : (
                      <FileImage className="h-5 w-5 text-slate-300" />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InvoiceTable;
