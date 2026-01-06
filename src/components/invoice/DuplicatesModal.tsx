import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Invoice } from '@/types/invoice';
import { AlertTriangle, Check, Trash2, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DuplicatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onDeleteSelected: (ids: string[]) => void;
}

interface DuplicateGroup {
  key: string;
  invoices: Invoice[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('he-IL');

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString('he-IL')} ${date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
};

const DuplicatesModal = ({ isOpen, onClose, invoices, onDeleteSelected }: DuplicatesModalProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // מציאת כפילויות על בסיס מספר מסמך וסכום
  const duplicateGroups = useMemo(() => {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    invoices.forEach((inv, i) => {
      if (processed.has(inv.id)) return;

      const matches = invoices.filter((other, j) => {
        if (i === j || processed.has(other.id)) return false;
        
        // התאמה על בסיס מספר מסמך
        const sameDocNumber = inv.document_number && other.document_number && 
          inv.document_number === other.document_number && inv.document_number !== '';
        
        // התאמה על בסיס סכום (מעוגל) - רק אם שניהם קיימים
        const invAmount = inv.total_amount ?? 0;
        const otherAmount = other.total_amount ?? 0;
        const sameAmount = Math.round(invAmount) === Math.round(otherAmount);
        
        return sameDocNumber && sameAmount;
      });

      if (matches.length > 0) {
        const groupInvoices = [inv, ...matches];
        // מיון לפי תאריך קליטה - הישן ביותר ראשון (זה שישאר)
        groupInvoices.sort((a, b) => new Date(a.intake_date || '').getTime() - new Date(b.intake_date || '').getTime());
        groupInvoices.forEach(i => processed.add(i.id));
        groups.push({
          key: `${inv.document_number || 'unknown'}-${(inv.total_amount ?? 0).toFixed(0)}`,
          invoices: groupInvoices
        });
      }
    });

    return groups;
  }, [invoices]);

  const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.invoices.length - 1, 0);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAutoSelect = () => {
    // סימון אוטומטי של כל הכפילויות הישנות יותר (משאירים את הראשון בכל קבוצה)
    const duplicateIds = new Set<string>();
    duplicateGroups.forEach(group => {
      // דילוג על הראשון (הישן ביותר), סימון השאר
      group.invoices.slice(1).forEach(inv => duplicateIds.add(inv.id));
    });
    setSelectedIds(duplicateIds);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      onDeleteSelected(Array.from(selectedIds));
      setSelectedIds(new Set());
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col w-[95vw] sm:w-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            ניהול כפילויות
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            נמצאו {duplicateGroups.length} קבוצות של חשבוניות עם אותו מספר מסמך וסכום
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {duplicateGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Check className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-medium">לא נמצאו כפילויות</h3>
              <p className="text-muted-foreground mt-1">
                כל החשבוניות ייחודיות לפי מספר מסמך וסכום
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Action bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAutoSelect}
                    className="flex-row-reverse text-xs sm:text-sm"
                  >
                    <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                    סמן אוטומטי ({totalDuplicates})
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearSelection}
                    disabled={selectedIds.size === 0}
                    className="flex-row-reverse text-xs sm:text-sm"
                  >
                    <Square className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                    נקה בחירה
                  </Button>
                </div>
                <div className="sm:flex-1" />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {selectedIds.size} נבחרו למחיקה
                </span>
              </div>

              {/* Duplicate groups */}
              {duplicateGroups.map((group, groupIndex) => (
                <div key={group.key} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-3 sm:px-4 py-2 flex items-center justify-between flex-row-reverse">
                    <span className="font-medium text-xs sm:text-sm">
                      קבוצה {groupIndex + 1}: מסמך #{group.invoices[0].document_number}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {group.invoices.length} חשבוניות
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                  <Table className="text-xs sm:text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">בחר</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                        <TableHead className="text-right">ספק</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">מס' מסמך</TableHead>
                        <TableHead className="text-right">סכום</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">סטטוס</TableHead>
                        <TableHead className="text-right hidden md:table-cell">קטגוריה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.invoices.map((inv, idx) => {
                        const isOriginal = idx === 0;
                        const isSelected = selectedIds.has(inv.id);
                        
                        return (
                          <TableRow 
                            key={inv.id}
                            className={cn(
                              'cursor-pointer transition-colors',
                              isOriginal && 'bg-emerald-50 hover:bg-emerald-100',
                              !isOriginal && !isSelected && 'bg-amber-50 hover:bg-amber-100',
                              isSelected && 'bg-red-100 hover:bg-red-200'
                            )}
                            onClick={() => !isOriginal && toggleSelection(inv.id)}
                          >
                            <TableCell className="text-center p-2" onClick={(e) => e.stopPropagation()}>
                              {isOriginal ? (
                                <Badge variant="outline" className="text-[10px] sm:text-xs bg-emerald-100 text-emerald-700 border-emerald-300">
                                  מקור
                                </Badge>
                              ) : (
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelection(inv.id)}
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-right p-2 whitespace-nowrap">{formatDateTime(inv.intake_date || '')}</TableCell>
                            <TableCell className="text-right p-2 max-w-[100px] truncate">{inv.supplier_name}</TableCell>
                            <TableCell className="text-right p-2 hidden sm:table-cell">{inv.document_number}</TableCell>
                            <TableCell className="text-right p-2 whitespace-nowrap">{formatCurrency(inv.total_amount ?? 0)}</TableCell>
                            <TableCell className="text-right p-2 hidden sm:table-cell">
                              <Badge variant="outline" className="text-xs">{inv.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right p-2 hidden md:table-cell">{inv.category}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                  <div className="bg-muted/50 px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-muted-foreground flex flex-wrap items-center gap-2 sm:gap-4 justify-start">
                    <span className="inline-flex items-center gap-1">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-200 rounded border border-emerald-300" /> מקור
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-200 rounded border border-amber-300" /> כפילות
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-200 rounded border border-red-300" /> למחיקה
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            סגור
          </Button>
          {duplicateGroups.length > 0 && (
            <Button 
              onClick={handleDeleteSelected} 
              disabled={selectedIds.size === 0}
              variant="destructive"
              className="flex-row-reverse w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              מחק {selectedIds.size} חשבוניות
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicatesModal;
