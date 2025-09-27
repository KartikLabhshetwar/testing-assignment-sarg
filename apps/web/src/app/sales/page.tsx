'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { AdvancedDataTable } from '@/components/data-table/advanced-data-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CreateModal } from '@/components/ui/create-modal';
import { salesCreateSchema, salesFields } from '@/lib/validation-schemas';

interface SalesData {
  id: number;
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_amount: number;
  payment_method: string;
  order_date: string;
  delivery_date: string;
  region: string;
}

export default function SalesPage() {
  const [data, setData] = useState<SalesData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const columns: ColumnDef<SalesData>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      },
      {
        accessorKey: 'order_id',
        header: 'Order ID',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: 'Customer',
        size: 150,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.customer_name}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.customer_email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'product_name',
        header: 'Product',
        size: 200,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.product_name}</div>
            <div className="text-sm text-muted-foreground font-mono">
              {row.original.product_sku}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as number}</span>
        ),
      },
      {
        accessorKey: 'unit_price',
        header: 'Unit Price',
        size: 100,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="font-mono">
              ${Number(value).toFixed(2)}
            </span>
          );
        },
      },
      {
        accessorKey: 'discount_percentage',
        header: 'Discount',
        size: 100,
        cell: ({ getValue }) => {
          const value = getValue();
          const discount = Number(value);
          return (
            <Badge variant={discount > 0 ? 'secondary' : 'outline'}>
              {discount}%
            </Badge>
          );
        },
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="font-mono font-medium">
              ${Number(value).toFixed(2)}
            </span>
          );
        },
      },
      {
        accessorKey: 'payment_method',
        header: 'Payment',
        size: 100,
        cell: ({ getValue }) => {
          const method = getValue() as string;
          const variant = method === 'Cash' ? 'default' : 
                        method === 'Card' ? 'secondary' : 'outline';
          return <Badge variant={variant}>{method}</Badge>;
        },
      },
      {
        accessorKey: 'order_date',
        header: 'Order Date',
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm">
            {format(new Date(getValue() as string), 'MMM dd, yyyy')}
          </span>
        ),
      },
      {
        accessorKey: 'delivery_date',
        header: 'Delivery',
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm">
            {format(new Date(getValue() as string), 'MMM dd, yyyy')}
          </span>
        ),
      },
      {
        accessorKey: 'region',
        header: 'Region',
        size: 100,
        cell: ({ getValue }) => {
          const region = getValue() as string;
          const colors = {
            North: 'bg-blue-100 text-blue-800',
            South: 'bg-green-100 text-green-800',
            East: 'bg-yellow-100 text-yellow-800',
            West: 'bg-purple-100 text-purple-800',
          };
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[region as keyof typeof colors]}`}>
              {region}
            </span>
          );
        },
      },
    ],
    []
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (sorting.length > 0) {
        const sortParam = `${sorting[0].id}.${sorting[0].desc ? 'desc' : 'asc'}`;
        params.append('sort', sortParam);
      }

      // Convert filters to the expected format
      const filterObj: Record<string, any> = {};
      filters.forEach(filter => {
        filterObj[filter.id] = filter.value;
      });
      if (Object.keys(filterObj).length > 0) {
        params.append('filter', JSON.stringify(filterObj));
      }

      const response = await fetch(`http://localhost:3000/api/sales?${params}`);
      const result = await response.json();

      setData(result.data);
      setTotalCount(result.pagination.total);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      toast.error('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleDelete = async (ids: string[]) => {
    try {
      console.log('Deleting records with IDs:', ids);
      
      const response = await fetch('http://localhost:3000/api/sales/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          ids: ids.map(id => parseInt(id))
        }),
      });

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error response:', errorData);
        throw new Error(`Failed to delete records: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Delete success:', result);
      
      toast.success(`Successfully deleted ${result.count || ids.length} record(s)`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (id: string) => {
    toast.info(`Edit functionality for record ${id} - Coming soon!`);
    // TODO: Implement edit modal or navigation
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (formData: any) => {
    try {
      console.log('Creating sales record:', formData);
      
      // Calculate total amount and generate order ID
      const totalAmount = (formData.quantity * formData.unit_price) * (1 - formData.discount_percentage / 100);
      const orderId = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      
      const salesData = {
        ...formData,
        order_id: orderId,
        total_amount: Number(totalAmount.toFixed(2))
      };
      
      console.log('Processed sales data:', salesData);
      
      const response = await fetch('http://localhost:3000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salesData),
      });

      console.log('Create response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create error response:', errorData);
        throw new Error(`Failed to create record: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Create success:', result);
      
      toast.success('Sales record created successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Create error:', error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, searchTerm, sorting, filters]);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sales Data</h1>
        <p className="text-muted-foreground">
          Manage and analyze your sales transactions with advanced filtering and sorting.
        </p>
      </div>

      <AdvancedDataTable
        data={data}
        columns={columns}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onSearch={setSearchTerm}
        onSort={setSorting}
        onFilter={setFilters}
        loading={loading}
        tableId="sales-table"
        onRefresh={fetchData}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onCreate={handleCreate}
        apiEndpoint="http://localhost:3000/api/sales"
      />

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        title="Create New Sales Record"
        schema={salesCreateSchema}
        fields={salesFields}
      />
    </div>
  );
}
