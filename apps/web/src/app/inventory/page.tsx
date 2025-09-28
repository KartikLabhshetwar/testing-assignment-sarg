'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { AdvancedDataTable } from '@/components/data-table/advanced-data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { CreateModal } from '@/components/ui/create-modal';
import { inventoryCreateSchema, inventoryFields } from '@/lib/validation-schemas';

interface InventoryData {
  id: number;
  product_id: string;
  product_name: string;
  product_sku: string;
  category: string;
  sub_category: string;
  stock_quantity: number;
  reserved_quantity: number;
  reorder_level: number;
  unit_cost: number;
  selling_price: number;
  supplier_name: string;
  supplier_contact: string;
  last_restocked: string;
  expiry_date: string;
}

export default function InventoryPage() {
  const [data, setData] = useState<InventoryData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const columns: ColumnDef<InventoryData>[] = useMemo(
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
        accessorKey: 'product_id',
        header: 'Product ID',
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'product_name',
        header: 'Product',
        size: 200,
        cell: ({ row }) => (
          <div>
            <div className="font-medium flex items-center">
              <Package className="h-4 w-4 mr-2" />
              {row.original.product_name}
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              {row.original.product_sku}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        size: 120,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.category}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.sub_category}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'stock_quantity',
        header: 'Stock',
        size: 100,
        cell: ({ row }) => {
          const stock = row.original.stock_quantity;
          const reorderLevel = row.original.reorder_level;
          const isLowStock = stock <= reorderLevel;
          
          return (
            <div className="flex items-center">
              {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />}
              <span className={isLowStock ? 'text-red-600 font-medium' : 'font-medium'}>
                {stock}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'reserved_quantity',
        header: 'Reserved',
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-orange-600 font-medium">{getValue() as number}</span>
        ),
      },
      {
        accessorKey: 'reorder_level',
        header: 'Reorder Level',
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() as number}</span>
        ),
      },
      {
        accessorKey: 'unit_cost',
        header: 'Cost',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            ${Number(getValue()).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'selling_price',
        header: 'Price',
        size: 100,
        cell: ({ getValue }) => (
          <span className="font-mono font-medium">
            ${Number(getValue()).toFixed(2)}
          </span>
        ),
      },
      {
        id: 'margin',
        header: 'Margin',
        size: 80,
        cell: ({ row }) => {
          const cost = Number(row.original.unit_cost);
          const price = Number(row.original.selling_price);
          const margin = ((price - cost) / price * 100);
          
          return (
            <Badge variant={margin > 50 ? 'default' : margin > 25 ? 'secondary' : 'outline'}>
              {margin.toFixed(0)}%
            </Badge>
          );
        },
      },
      {
        accessorKey: 'supplier_name',
        header: 'Supplier',
        size: 150,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.supplier_name}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.supplier_contact}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'last_restocked',
        header: 'Last Restocked',
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-sm">
            {format(new Date(getValue() as string), 'MMM dd, yyyy')}
          </span>
        ),
      },
      {
        accessorKey: 'expiry_date',
        header: 'Expires',
        size: 120,
        cell: ({ getValue }) => {
          const expiryDate = new Date(getValue() as string);
          const today = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
          const isExpired = daysUntilExpiry <= 0;
          
          return (
            <div className="flex items-center">
              {(isExpiringSoon || isExpired) && (
                <AlertTriangle className={`h-4 w-4 mr-1 ${isExpired ? 'text-red-500' : 'text-yellow-500'}`} />
              )}
              <span className={`text-sm ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : ''}`}>
                {format(expiryDate, 'MMM dd, yyyy')}
              </span>
            </div>
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

      const response = await fetch(`/api/inventory?${params}`);
      const result = await response.json();

      setData(result.data);
      setTotalCount(result.pagination.total);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
      toast.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleDelete = async (ids: string[]) => {
    try {
      console.log('Deleting inventory records with IDs:', ids);
      
      const response = await fetch('/api/inventory/bulk', {
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
      console.log('Creating inventory item:', formData);
      
      // Generate product ID and set defaults
      const productId = `PROD-${Date.now()}`;
      const inventoryData = {
        ...formData,
        product_id: productId,
        reserved_quantity: formData.reserved_quantity || 0,
        reorder_level: formData.reorder_level || 10,
      };
      
      console.log('Processed inventory data:', inventoryData);
      
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryData),
      });

      console.log('Create response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create error response:', errorData);
        throw new Error(`Failed to create record: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Create success:', result);
      
      toast.success('Inventory item created successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Create error:', error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, searchTerm, sorting, filters]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalValue = data.reduce((sum, item) => sum + (item.stock_quantity * item.unit_cost), 0);
    const lowStockCount = data.filter(item => item.stock_quantity <= item.reorder_level).length;
    const expiringSoonCount = data.filter(item => {
      const daysUntilExpiry = Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    return { totalValue, lowStockCount, expiringSoonCount };
  }, [data]);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">
          Monitor stock levels, track suppliers, and manage your inventory efficiently.
        </p>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Total Inventory Value</div>
            <div className="text-2xl font-bold">${summaryStats.totalValue.toFixed(2)}</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Low Stock Items</div>
            <div className="text-2xl font-bold text-red-600">{summaryStats.lowStockCount}</div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Expiring Soon</div>
            <div className="text-2xl font-bold text-yellow-600">{summaryStats.expiringSoonCount}</div>
          </div>
        </div>
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
        tableId="inventory-table"
        onRefresh={fetchData}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onCreate={handleCreate}
        apiEndpoint="/api/inventory"
      />

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        title="Create New Inventory Item"
        schema={inventoryCreateSchema}
        fields={inventoryFields}
      />
    </div>
  );
}
