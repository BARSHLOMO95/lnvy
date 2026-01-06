import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceFormData, FilterState, KPIData, InvoiceStatus, BusinessType } from '@/types/invoice';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function useInvoices(userId: string | undefined) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    intakeMonths: [],
    documentMonths: [],
    statuses: [],
    suppliers: [],
    categories: [],
    businessTypes: [],
    amountMin: null,
    amountMax: null,
  });

  // Fetch invoices
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('intake_date', { ascending: false });

      if (error) {
        toast.error('שגיאה בטעינת החשבוניות');
        console.error(error);
      } else {
        setInvoices(data as Invoice[]);
      }
      setLoading(false);
    };

    fetchInvoices();
  }, [userId]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const intakeMonths = [...new Set(invoices.map(i => format(new Date(i.intake_date), 'MM/yy')))].sort();
    const documentMonths = [...new Set(invoices.map(i => format(new Date(i.document_date), 'MM/yy')))].sort();
    const suppliers = [...new Set(invoices.map(i => i.supplier_name))].sort();
    const categories = [...new Set(invoices.map(i => i.category))].sort();
    
    return {
      intakeMonths,
      documentMonths,
      statuses: ['חדש', 'בתהליך', 'טופל'] as InvoiceStatus[],
      suppliers,
      categories,
      businessTypes: ['עוסק מורשה', 'עוסק פטור', 'חברה בע"מ', 'ספק חו"ל'] as BusinessType[],
    };
  }, [invoices]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const intakeMonth = format(new Date(invoice.intake_date), 'MM/yy');
      const documentMonth = format(new Date(invoice.document_date), 'MM/yy');

      if (filters.intakeMonths.length > 0 && !filters.intakeMonths.includes(intakeMonth)) return false;
      if (filters.documentMonths.length > 0 && !filters.documentMonths.includes(documentMonth)) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(invoice.status)) return false;
      if (filters.suppliers.length > 0 && !filters.suppliers.includes(invoice.supplier_name)) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(invoice.category)) return false;
      if (filters.businessTypes.length > 0 && !filters.businessTypes.includes(invoice.business_type)) return false;
      
      // Amount filters
      if (filters.amountMin !== null && invoice.total_amount < filters.amountMin) return false;
      if (filters.amountMax !== null && invoice.total_amount > filters.amountMax) return false;

      return true;
    });
  }, [invoices, filters]);

  // Calculate KPIs
  const kpiData = useMemo((): KPIData => {
    const totalWithVat = filteredInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
    const totalBeforeVat = filteredInvoices.reduce((sum, i) => sum + Number(i.amount_before_vat), 0);
    const totalVat = filteredInvoices.reduce((sum, i) => sum + (i.vat_amount ? Number(i.vat_amount) : 0), 0);
    const uniqueSuppliers = new Set(filteredInvoices.map(i => i.supplier_name)).size;

    return { totalWithVat, totalBeforeVat, totalVat, uniqueSuppliers };
  }, [filteredInvoices]);

  // Create invoice
  const createInvoice = async (data: InvoiceFormData) => {
    if (!userId) return;

    // VAT is calculated by database trigger based on business_type
    const { data: newInvoice, error } = await supabase
      .from('invoices')
      .insert({
        ...data,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      toast.error('שגיאה ביצירת החשבונית');
      console.error(error);
    } else {
      setInvoices(prev => [newInvoice as Invoice, ...prev]);
      toast.success('החשבונית נוצרה בהצלחה');
    }
  };

  // Bulk create invoices (for Excel import)
  const bulkCreateInvoices = async (dataList: InvoiceFormData[]) => {
    if (!userId) return;

    // VAT is calculated by database trigger based on business_type
    const invoicesToInsert = dataList.map(data => ({
      ...data,
      user_id: userId,
    }));

    const { data: newInvoices, error } = await supabase
      .from('invoices')
      .insert(invoicesToInsert)
      .select();

    if (error) {
      toast.error('שגיאה בייבוא החשבוניות');
      console.error(error);
    } else {
      setInvoices(prev => [...(newInvoices as Invoice[]), ...prev]);
      toast.success(`${newInvoices?.length || 0} חשבוניות יובאו בהצלחה`);
    }
  };

  // Update invoice
  const updateInvoice = async (id: string, data: Partial<InvoiceFormData>) => {
    // VAT is calculated by database trigger based on business_type
    const { data: updatedInvoice, error } = await supabase
      .from('invoices')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('שגיאה בעדכון החשבונית');
      console.error(error);
    } else {
      setInvoices(prev => prev.map(i => i.id === id ? updatedInvoice as Invoice : i));
      toast.success('החשבונית עודכנה בהצלחה');
    }
  };

  // Bulk update invoices
  const bulkUpdateInvoices = async (ids: string[], data: Partial<InvoiceFormData>) => {
    const { data: updatedInvoices, error } = await supabase
      .from('invoices')
      .update(data)
      .in('id', ids)
      .select();

    if (error) {
      toast.error('שגיאה בעדכון החשבוניות');
      console.error(error);
    } else {
      setInvoices(prev => prev.map(i => {
        const updated = updatedInvoices?.find(u => u.id === i.id);
        return updated ? (updated as Invoice) : i;
      }));
      setSelectedIds([]);
      toast.success(`${ids.length} חשבוניות עודכנו בהצלחה`);
    }
  };

  // Delete invoices
  const deleteInvoices = async (ids: string[]) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .in('id', ids);

    if (error) {
      toast.error('שגיאה במחיקת החשבוניות');
      console.error(error);
    } else {
      setInvoices(prev => prev.filter(i => !ids.includes(i.id)));
      setSelectedIds([]);
      toast.success(`${ids.length} חשבוניות נמחקו בהצלחה`);
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map(i => i.id));
    }
  };

  const clearFilters = () => {
    setFilters({
      intakeMonths: [],
      documentMonths: [],
      statuses: [],
      suppliers: [],
      categories: [],
      businessTypes: [],
      amountMin: null,
      amountMax: null,
    });
  };

  return {
    invoices,
    filteredInvoices,
    loading,
    selectedIds,
    filters,
    filterOptions,
    kpiData,
    setFilters,
    createInvoice,
    bulkCreateInvoices,
    updateInvoice,
    bulkUpdateInvoices,
    deleteInvoices,
    toggleSelection,
    toggleSelectAll,
    clearFilters,
  };
}
