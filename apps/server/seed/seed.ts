import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function seedSales() {
  console.log('Seeding Sales table...');
  
  const rows = [];
  for (let i = 0; i < 1000; i++) {
    const qty = faker.number.int({ min: 1, max: 10 });
    const unit = parseFloat(faker.commerce.price({ min: 10, max: 1000, dec: 2 }));
    const discount = faker.number.int({ min: 0, max: 30 });
    const total = (qty * unit) * (1 - discount / 100);
    
    rows.push({
      order_id: `ORD-${2025}-${String(i + 1).padStart(4, '0')}`,
      customer_name: faker.person.fullName(),
      customer_email: faker.internet.email(),
      customer_phone: faker.phone.number(),
      product_name: faker.commerce.productName(),
      product_sku: `PROD-${faker.string.alphanumeric(6).toUpperCase()}`,
      quantity: qty,
      unit_price: unit,
      discount_percentage: discount,
      total_amount: parseFloat(total.toFixed(2)),
      payment_method: faker.helpers.arrayElement(['Cash', 'Card', 'Online']),
      order_date: faker.date.past({ years: 1 }),
      delivery_date: faker.date.soon({ days: 14 }),
      region: faker.helpers.arrayElement(['North', 'South', 'East', 'West'])
    });
  }
  
  await prisma.sales.createMany({ data: rows });
  console.log('Sales seeded successfully');
}

async function seedInventory() {
  console.log('Seeding Inventory table...');
  
  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Furniture'];
  const subCategories = {
    'Electronics': ['Smartphones', 'Laptops', 'Tablets', 'Accessories'],
    'Clothing': ['Men', 'Women', 'Kids', 'Shoes'],
    'Food': ['Beverages', 'Snacks', 'Dairy', 'Frozen'],
    'Books': ['Fiction', 'Non-Fiction', 'Educational', 'Children'],
    'Furniture': ['Living Room', 'Bedroom', 'Office', 'Kitchen']
  };
  
  const rows = [];
  for (let i = 0; i < 1000; i++) {
    const category = faker.helpers.arrayElement(categories);
    const subCategory = faker.helpers.arrayElement(subCategories[category]);
    const stockQty = faker.number.int({ min: 0, max: 500 });
    const reservedQty = faker.number.int({ min: 0, max: Math.floor(stockQty * 0.3) });
    const unitCost = parseFloat(faker.commerce.price({ min: 5, max: 500, dec: 2 }));
    const sellingPrice = unitCost * faker.number.float({ min: 1.2, max: 3.0, fractionDigits: 2 });
    
    rows.push({
      product_id: `PROD-${String(i + 1).padStart(4, '0')}`,
      product_name: faker.commerce.productName(),
      product_sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      category,
      sub_category: subCategory,
      stock_quantity: stockQty,
      reserved_quantity: reservedQty,
      reorder_level: faker.number.int({ min: 10, max: 50 }),
      unit_cost: unitCost,
      selling_price: parseFloat(sellingPrice.toFixed(2)),
      supplier_name: faker.company.name(),
      supplier_contact: faker.phone.number(),
      last_restocked: faker.date.past({ years: 1 }),
      expiry_date: faker.date.future({ years: 2 })
    });
  }
  
  await prisma.inventory.createMany({ data: rows });
  console.log('Inventory seeded successfully');
}

async function main() {
  try {
    console.log('Starting database seeding...');
    
    // Clear existing data
    await prisma.sales.deleteMany();
    await prisma.inventory.deleteMany();
    
    // Seed tables
    await seedSales();
    await seedInventory();
    
    // Validate counts
    const salesCount = await prisma.sales.count();
    const inventoryCount = await prisma.inventory.count();
    
    if (salesCount !== 1000) {
      throw new Error(`Sales seed count mismatch: expected 1000, got ${salesCount}`);
    }
    
    if (inventoryCount !== 1000) {
      throw new Error(`Inventory seed count mismatch: expected 1000, got ${inventoryCount}`);
    }
    
    console.log('✅ Database seeded successfully!');
    console.log(`✅ Sales records: ${salesCount}`);
    console.log(`✅ Inventory records: ${inventoryCount}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
