import { z } from 'zod';

// Sales validation schema
export const salesCreateSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required').max(100, 'Name too long'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long'),
  product_name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  product_sku: z.string().min(1, 'Product SKU is required').max(50, 'SKU too long'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').max(1000, 'Quantity too high'),
  unit_price: z.coerce.number().min(0.01, 'Unit price must be greater than 0').max(999999.99, 'Price too high'),
  discount_percentage: z.coerce.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%'),
  payment_method: z.string().refine((val) => ['Cash', 'Card', 'Online'].includes(val), {
    message: 'Please select a valid payment method (Cash, Card, or Online)'
  }),
  order_date: z.string().min(1, 'Order date is required'),
  delivery_date: z.string().min(1, 'Delivery date is required'),
  region: z.string().refine((val) => ['North', 'South', 'East', 'West'].includes(val), {
    message: 'Please select a valid region (North, South, East, or West)'
  })
}).refine((data) => {
  const orderDate = new Date(data.order_date);
  const deliveryDate = new Date(data.delivery_date);
  return deliveryDate >= orderDate;
}, {
  message: 'Delivery date must be on or after order date',
  path: ['delivery_date']
});

// Inventory validation schema
export const inventoryCreateSchema = z.object({
  product_name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  product_sku: z.string().min(1, 'Product SKU is required').max(50, 'SKU too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long'),
  sub_category: z.string().min(1, 'Sub-category is required').max(100, 'Sub-category too long'),
  stock_quantity: z.coerce.number().min(0, 'Stock quantity cannot be negative').max(999999, 'Stock quantity too high'),
  reserved_quantity: z.coerce.number().min(0, 'Reserved quantity cannot be negative').max(999999, 'Reserved quantity too high'),
  reorder_level: z.coerce.number().min(0, 'Reorder level cannot be negative').max(999999, 'Reorder level too high'),
  unit_cost: z.coerce.number().min(0.01, 'Unit cost must be greater than 0').max(999999.99, 'Unit cost too high'),
  selling_price: z.coerce.number().min(0.01, 'Selling price must be greater than 0').max(999999.99, 'Selling price too high'),
  supplier_name: z.string().min(1, 'Supplier name is required').max(100, 'Supplier name too long'),
  supplier_contact: z.string().min(10, 'Supplier contact must be at least 10 characters').max(50, 'Contact too long'),
  last_restocked: z.string().min(1, 'Last restocked date is required'),
  expiry_date: z.string().min(1, 'Expiry date is required')
}).refine((data) => {
  const restockedDate = new Date(data.last_restocked);
  const expiryDate = new Date(data.expiry_date);
  return expiryDate > restockedDate;
}, {
  message: 'Expiry date must be after last restocked date',
  path: ['expiry_date']
}).refine((data) => {
  return data.reserved_quantity <= data.stock_quantity;
}, {
  message: 'Reserved quantity cannot exceed stock quantity',
  path: ['reserved_quantity']
});

// Field configurations for forms
export const salesFields = [
  { name: 'customer_name', label: 'Customer Name', type: 'text' as const, required: true, placeholder: 'Enter customer name' },
  { name: 'customer_email', label: 'Email', type: 'email' as const, required: true, placeholder: 'customer@example.com' },
  { name: 'customer_phone', label: 'Phone', type: 'tel' as const, required: true, placeholder: '+1 (555) 123-4567' },
  { name: 'product_name', label: 'Product Name', type: 'text' as const, required: true, placeholder: 'Enter product name' },
  { name: 'product_sku', label: 'Product SKU', type: 'text' as const, required: true, placeholder: 'PROD-12345' },
  { name: 'quantity', label: 'Quantity', type: 'number' as const, required: true, min: 1, max: 1000, placeholder: '1' },
  { name: 'unit_price', label: 'Unit Price', type: 'number' as const, required: true, min: 0.01, max: 999999.99, placeholder: '99.99' },
  { name: 'discount_percentage', label: 'Discount %', type: 'number' as const, required: true, min: 0, max: 100, placeholder: '10' },
  { name: 'payment_method', label: 'Payment Method', type: 'select' as const, required: true, options: ['Cash', 'Card', 'Online'], placeholder: 'Select payment method' },
  { name: 'order_date', label: 'Order Date', type: 'date' as const, required: true },
  { name: 'delivery_date', label: 'Delivery Date', type: 'date' as const, required: true },
  { name: 'region', label: 'Region', type: 'select' as const, required: true, options: ['North', 'South', 'East', 'West'], placeholder: 'Select region' }
];

export const inventoryFields = [
  { name: 'product_name', label: 'Product Name', type: 'text' as const, required: true, placeholder: 'Enter product name' },
  { name: 'product_sku', label: 'Product SKU', type: 'text' as const, required: true, placeholder: 'PROD-12345' },
  { name: 'category', label: 'Category', type: 'select' as const, required: true, options: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Health & Beauty', 'Automotive', 'Other'], placeholder: 'Select category' },
  { name: 'sub_category', label: 'Sub-Category', type: 'text' as const, required: true, placeholder: 'Smartphones, T-Shirts, etc.' },
  { name: 'stock_quantity', label: 'Stock Quantity', type: 'number' as const, required: true, min: 0, max: 999999, placeholder: '100' },
  { name: 'reserved_quantity', label: 'Reserved Quantity', type: 'number' as const, required: true, min: 0, max: 999999, placeholder: '10' },
  { name: 'reorder_level', label: 'Reorder Level', type: 'number' as const, required: true, min: 0, max: 999999, placeholder: '20' },
  { name: 'unit_cost', label: 'Unit Cost', type: 'number' as const, required: true, min: 0.01, max: 999999.99, placeholder: '50.00' },
  { name: 'selling_price', label: 'Selling Price', type: 'number' as const, required: true, min: 0.01, max: 999999.99, placeholder: '99.99' },
  { name: 'supplier_name', label: 'Supplier Name', type: 'text' as const, required: true, placeholder: 'Enter supplier name' },
  { name: 'supplier_contact', label: 'Supplier Contact', type: 'text' as const, required: true, placeholder: 'supplier@example.com' },
  { name: 'last_restocked', label: 'Last Restocked', type: 'date' as const, required: true },
  { name: 'expiry_date', label: 'Expiry Date', type: 'date' as const, required: true }
];
