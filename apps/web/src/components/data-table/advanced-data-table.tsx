'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ColumnSizingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  GripVertical,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdvancedDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearch: (search: string) => void;
  onSort: (sorting: SortingState) => void;
  onFilter: (filters: ColumnFiltersState) => void;
  loading?: boolean;
  tableId: string;
  onRefresh?: () => void;
  onDelete?: (ids: string[]) => Promise<void>;
  onEdit?: (id: string) => void;
  onCreate?: () => void;
  apiEndpoint?: string;
}

export function AdvancedDataTable<T>({
  data,
  columns,
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onSort,
  onFilter,
  loading = false,
  tableId,
  onRefresh,
  onDelete,
  onEdit,
  onCreate,
  apiEndpoint,
}: AdvancedDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // CRUD Operations
  const handleDelete = async (ids: string[]) => {
    if (!onDelete) return;
    
    try {
      await onDelete(ids);
      toast.success(`Successfully deleted ${ids.length} record(s)`);
      setRowSelection({});
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('Failed to delete records');
      console.error('Delete error:', error);
    }
  };

  const handleBulkDelete = () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) {
      toast.error('No records selected');
      return;
    }
    
    // Direct delete without confirmation dialog
    handleDelete(selectedIds);
  };

  const handleEdit = (id: string) => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleCreate = () => {
    if (onCreate) {
      onCreate();
    }
  };

  // Export functionality
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        search: globalFilter,
      });

      // Add current filters
      if (columnFilters.length > 0) {
        const filterObj: Record<string, any> = {};
        columnFilters.forEach(filter => {
          filterObj[filter.id] = filter.value;
        });
        if (Object.keys(filterObj).length > 0) {
          params.append('filter', JSON.stringify(filterObj));
        }
      }

      const response = await fetch(`${apiEndpoint}/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableId}-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Import functionality
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        toast.info('Import functionality coming soon!');
        // TODO: Implement import functionality
        console.log('Import file:', file);
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import data');
      }
    };
    input.click();
  };

  // Column visibility toggle
  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  // Debounced search
  const [searchValue, setSearchValue] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, onSearch]);

  // Load preferences from localStorage and API
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Try to load from localStorage first (faster)
        const localPrefs = localStorage.getItem(`table-prefs-default-${tableId}`);
        if (localPrefs) {
          const prefs = JSON.parse(localPrefs);
          if (prefs.columnWidths) setColumnSizing(prefs.columnWidths);
          if (prefs.hiddenColumns) {
            const visibility: VisibilityState = {};
            prefs.hiddenColumns.forEach((col: string) => {
              visibility[col] = false;
            });
            setColumnVisibility(visibility);
          }
          if (prefs.columnOrder) setColumnOrder(prefs.columnOrder);
          if (prefs.sorting) setSorting(prefs.sorting);
        }

        // Also try to load from API
        const response = await fetch(`/api/user/preferences/table?tableId=${tableId}`);
        if (response.ok) {
          const apiPrefs = await response.json();
          if (apiPrefs.columnWidths) setColumnSizing(apiPrefs.columnWidths);
          if (apiPrefs.hiddenColumns) {
            const visibility: VisibilityState = {};
            apiPrefs.hiddenColumns.forEach((col: string) => {
              visibility[col] = false;
            });
            setColumnVisibility(visibility);
          }
          if (apiPrefs.columnOrder) setColumnOrder(apiPrefs.columnOrder);
          if (apiPrefs.sorting) setSorting(apiPrefs.sorting);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };

    loadPreferences();
  }, [tableId]);

  // Save preferences
  const savePreferences = useCallback(async () => {
    const prefs = {
      columnWidths: columnSizing,
      hiddenColumns: Object.keys(columnVisibility).filter(key => !columnVisibility[key]),
      columnOrder,
      sorting,
    };

    // Save to localStorage immediately
    localStorage.setItem(`table-prefs-default-${tableId}`, JSON.stringify(prefs));

    // Also save to API
    try {
      await fetch('/api/user/preferences/table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, prefs }),
      });
    } catch (error) {
      console.error('Failed to save preferences to API:', error);
    }
  }, [columnSizing, columnVisibility, columnOrder, sorting, tableId]);

  // Auto-save preferences when they change
  useEffect(() => {
    const timer = setTimeout(savePreferences, 1000);
    return () => clearTimeout(timer);
  }, [savePreferences]);

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnMenu && !(event.target as Element).closest('.column-menu-container')) {
        setShowColumnMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnMenu]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => (row as any).id.toString(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnSizing,
      columnOrder,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      onSort(newSorting);
    },
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
      setColumnFilters(newFilters);
      onFilter(newFilters);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'f':
            event.preventDefault();
            document.getElementById('global-search')?.focus();
            break;
          case 'a':
            event.preventDefault();
            // Select all rows on current page
            const allRowIds = rows.reduce((acc, row) => {
              acc[row.id] = true;
              return acc;
            }, {} as Record<string, boolean>);
            setRowSelection(allRowIds);
            break;
        }
      }
      
      if (event.key === 'Delete' && Object.keys(rowSelection).length > 0) {
        if (confirm(`Delete ${Object.keys(rowSelection).length} selected rows?`)) {
          // Handle bulk delete
          console.log('Delete selected rows:', Object.keys(rowSelection));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rowSelection, rows]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="p-6 bg-white border-4 border-black">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
              <Input
                id="global-search"
                placeholder="Search all columns..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-12 w-80"
              />
            </div>
            
            {Object.keys(rowSelection).length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-base font-bold text-black">
                  {Object.keys(rowSelection).length} selected
                </span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                  className="whitespace-nowrap"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onCreate && (
              <Button variant="default" size="sm" onClick={handleCreate}>
                <Plus className="h-5 w-5 mr-2" />
                Create
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-5 w-5 mr-2" />
              Import
            </Button>
            <div className="relative group">
              <Button variant="outline" size="sm">
                <Download className="h-5 w-5 mr-2" />
                Export
              </Button>
              <div className="absolute right-0 top-full mt-2 w-40 bg-white border-4 border-black z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  className="w-full px-4 py-3 text-left text-base font-bold hover:bg-gray-100 border-b-2 border-gray-200"
                  onClick={() => handleExport('csv')}
                >
                  Export as CSV
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-base font-bold hover:bg-gray-100"
                  onClick={() => handleExport('excel')}
                >
                  Export as Excel
                </button>
              </div>
            </div>
            <div className="relative column-menu-container">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowColumnMenu(!showColumnMenu)}
              >
                <Settings className="h-5 w-5 mr-2" />
                Columns
              </Button>
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border-4 border-black z-10">
                  <div className="p-4">
                    <div className="text-base font-bold text-black mb-4 uppercase tracking-wide">Show/Hide Columns</div>
                    {table.getAllColumns()
                      .filter(column => column.getCanHide())
                      .map(column => (
                        <label key={column.id} className="flex items-center space-x-3 py-2">
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={() => toggleColumnVisibility(column.id)}
                            className="w-4 h-4 border-2 border-black"
                          />
                          <span className="text-base font-medium">{column.columnDef.header as string}</span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border-4 border-black bg-white">
        <div
          ref={tableContainerRef}
          className="h-[600px] overflow-auto"
          style={{ contain: 'strict' }}
        >
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-100 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-6 py-4 text-left text-base font-bold text-black uppercase tracking-wide relative",
                        header.column.getCanSort() && "cursor-pointer hover:bg-gray-200"
                      )}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center justify-between">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                      
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none",
                            "hover:bg-blue-500 active:bg-blue-500",
                            header.column.getIsResizing() && "bg-blue-500"
                          )}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
                      <span className="text-lg font-bold">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "hover:bg-gray-50 transition-colors",
                        row.getIsSelected() && "bg-gray-100"
                      )}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 text-base font-medium text-black"
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t-4 border-black">
        <div className="flex items-center space-x-4">
          <p className="text-base font-bold text-black">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-10 w-10 p-0"
          >
            <ChevronsLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-10 w-10 p-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <span className="text-base font-bold text-black px-4">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-10 w-10 p-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-10 w-10 p-0"
          >
            <ChevronsRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}