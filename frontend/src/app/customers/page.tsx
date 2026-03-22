'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Customer } from '@/types/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppDialogs } from '@/components/ui/AppDialogs';
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
  type DataTableGroupAction,
  type DataTableFilter,
  type FilterToken,
} from '@/components/ui/DataTable';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
import { buildCustomerListParamsFromTokens } from '@/lib/filterTokens';

const customerFilterDefinitions: DataTableFilter[] = [
  {
    key: 'status',
    label: 'وضعیت',
    type: 'select',
    options: [
      { value: 'LEAD', label: 'سرنخ' },
      { value: 'OPPORTUNITY', label: 'فرصت' },
      { value: 'CUSTOMER', label: 'مشتری' },
      { value: 'LOST', label: 'از دست رفته' },
    ],
  },
  {
    key: 'customerType',
    label: 'نوع',
    type: 'select',
    options: [
      { value: 'NATURAL', label: 'حقیقی' },
      { value: 'LEGAL', label: 'حقوقی' },
    ],
  },
  {
    key: 'relationshipType',
    label: 'نوع رابطه',
    type: 'select',
    options: [
      { value: 'CUSTOMER', label: 'مشتری' },
      { value: 'SUPPLIER', label: 'تأمین‌کننده' },
      { value: 'AGENT', label: 'نماینده' },
      { value: 'COMPETITOR', label: 'رقیب' },
      { value: 'INTERNAL_STAFF', label: 'کارمند داخلی' },
    ],
  },
  {
    key: 'isActive',
    label: 'فعال',
    type: 'select',
    options: [
      { value: 'true', label: 'بله' },
      { value: 'false', label: 'خیر' },
    ],
  },
  { key: 'createdAt', label: 'تاریخ ایجاد', type: 'date' },
];

export default function CustomersPage() {
  const router = useRouter();
  const dialogs = useAppDialogs();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<number | undefined>();
  const [savedTick, setSavedTick] = useState(0);

  const fetchCustomers = useCallback(
    async (params: {
      page: number;
      limit: number;
      search: string;
      filters?: FilterToken[];
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const fromTokens = buildCustomerListParamsFromTokens(params.filters);
      const res = await api.customers.list({
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        ...fromTokens,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });
      if (res.success && res.data) {
        return { rows: res.data.customers, pagination: res.data.pagination };
      }
      return {
        rows: [],
        pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0 },
      };
    },
    [savedTick],
  );

  const openCreateModal = () => {
    setEditCustomerId(undefined);
    setModalOpen(true);
  };

  const openEditModal = (id: number) => {
    setEditCustomerId(id);
    setModalOpen(true);
  };

  const statusVariant = (s: string) =>
    s === 'CUSTOMER' ? 'success' : s === 'OPPORTUNITY' ? 'warning' : s === 'LOST' ? 'danger' : 'default';

  const statusLabel = (s: string) => {
    switch (s) {
      case 'LEAD':
        return 'سرنخ';
      case 'OPPORTUNITY':
        return 'فرصت';
      case 'CUSTOMER':
        return 'مشتری';
      case 'LOST':
        return 'از دست رفته';
      default:
        return s;
    }
  };

  const typeLabel = (t: string) => (t === 'NATURAL' ? 'حقیقی' : 'حقوقی');

  const getDisplayName = (c: Customer) => {
    if (c.customerType === 'LEGAL') {
      return c.companyName || c.brandName || '-';
    }
    return [c.firstName, c.lastName].filter(Boolean).join(' ') || '-';
  };

  const getDefaultPhone = (c: Customer) => {
    if (!c.phones || c.phones.length === 0) return '-';
    const defaultPhone = c.phones.find((p) => p.isDefault) || c.phones[0];
    return defaultPhone.phoneNumber;
  };

  const handleDelete = async (c: Customer) => {
    const ok = await dialogs.confirm('آیا از حذف این مشتری مطمئنید؟');
    if (!ok) return;
    const res = await api.customers.delete(c.id);
    if (res.success) setSavedTick((k) => k + 1);
  };

  const handleBulkDelete = async (selected: Customer[]) => {
    if (selected.length === 0) return;
    const ok = await dialogs.confirm('آیا از حذف مشتریان انتخاب شده مطمئنید؟', {
      danger: true,
      confirmText: 'حذف',
    });
    if (!ok) return;
    const results = await Promise.all(selected.map((c) => api.customers.delete(c.id)));
    const failed = results.find((r) => !r.success);
    if (failed) {
      await dialogs.alert(failed.error?.message ?? 'خطا در حذف گروهی');
      return;
    }
    setSavedTick((k) => k + 1);
  };

  const columns: DataTableColumn<Customer>[] = [
    {
      key: 'customerCode',
      title: 'کد',
      sortable: true,
      sortField: 'customerCode',
      render: (row) => <span className="font-mono text-xs">{row.customerCode}</span>,
    },
    {
      key: 'customerType',
      title: 'نوع',
      sortable: true,
      render: (row) => (
        <Badge variant={row.customerType === 'LEGAL' ? 'info' : 'default'}>{typeLabel(row.customerType)}</Badge>
      ),
    },
    {
      key: 'displayName',
      title: 'نام',
      sticky: true,
      sortable: true,
      sortField: 'lastName',
      render: (row) => getDisplayName(row),
    },
    {
      key: 'phone',
      title: 'تلفن',
      render: (row) => getDefaultPhone(row),
    },
    {
      key: 'status',
      title: 'وضعیت',
      sortable: true,
      render: (row) => <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>,
    },
    {
      key: 'level',
      title: 'سطح',
      render: (row) => row.customerLevel?.levelName ?? '-',
    },
  ];

  const actions: DataTableAction<Customer>[] = [
    {
      label: 'مشاهده',
      variant: 'ghost',
      onClick: (row) => {
        router.push(`/customers/${row.id}`);
      },
    },
    {
      label: 'ویرایش',
      variant: 'primary',
      onClick: (row) => openEditModal(row.id),
      triggerOnRowDoubleClick: true,
    },
    {
      label: 'حذف',
      variant: 'danger',
      onClick: (row) => void handleDelete(row),
    },
  ];

  const groupActions: DataTableGroupAction<Customer>[] = [
    {
      label: 'حذف انتخاب شده',
      variant: 'danger',
      onClick: handleBulkDelete,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">مشتریان</h1>
        <Button onClick={openCreateModal}>ثبت مشتری جدید</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>لیست مشتریان</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<Customer>
            columns={columns}
            actions={actions}
            groupActions={groupActions}
            selectableRows
            isRowSelectable={(row) => row.isActive}
            fetchData={fetchCustomers}
            rowKey={(row) => row.id}
            filters={customerFilterDefinitions}
            searchPlaceholder="متن آزاد یا فیلترها را اضافه کنید، سپس جستجو را بزنید..."
            pageSize={20}
            emptyMessage="مشتریی یافت نشد."
          />
        </CardContent>
      </Card>

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customerId={editCustomerId}
        onSaved={() => setSavedTick((k) => k + 1)}
      />
    </div>
  );
}
