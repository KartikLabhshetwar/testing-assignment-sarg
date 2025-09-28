"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  title: string;
  schema: z.ZodSchema<any>;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'date' | 'tel' | 'select';
    required?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    options?: string[];
  }>;
}

export function CreateModal({ isOpen, onClose, onSubmit, title, schema, fields }: CreateModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      // Sales defaults
      discount_percentage: 0,
      quantity: 1,
      unit_price: '',
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      product_name: '',
      product_sku: '',
      payment_method: '',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      region: '',
      // Inventory defaults
      category: '',
      sub_category: '',
      stock_quantity: 0,
      reserved_quantity: 0,
      reorder_level: 10,
      unit_cost: '',
      selling_price: '',
      supplier_name: '',
      supplier_contact: '',
      last_restocked: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
    }
  });

  const onFormSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      toast.success('Record created successfully!');
      reset();
      onClose();
    } catch (error) {
      toast.error('Failed to create record');
      console.error('Create error:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name} className="text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === 'select' ? (
                <select
                  id={field.name}
                  {...register(field.name as any)}
                  className={`mt-1 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    (errors as any)[field.name] ? 'border-red-500' : 'border-gray-300'
                  } bg-white text-gray-900`}
                >
                  <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  {...register(field.name as any)}
                  placeholder={field.placeholder}
                  className={`mt-1 ${(errors as any)[field.name] ? 'border-red-500' : ''}`}
                  min={field.min}
                  max={field.max}
                  step={field.type === 'number' ? (field.name === 'unit_price' ? '0.01' : '1') : undefined}
                  required={field.required}
                />
              )}
              {(errors as any)[field.name] && (
                <p className="text-red-500 text-sm mt-1">
                  {(errors as any)[field.name]?.message as string}
                </p>
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
