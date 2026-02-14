// src/types/report.ts
import { Timestamp } from '../firebase';
import type { Order } from './order'; // Importamos la Orden segura

export interface ProductSummary {
  name: string;
  quantity: number;
  total: number;
}

export interface IngredientSummary {
  name: string;
  quantity: number;
}

export interface Expense {
  id?: string;
  description: string;
  amount: number;
  category: string;
  createdAt: Timestamp | Date; 
}

export interface DailyReportData {
  totalSales: number;
  totalOrders: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  totalExpenses: number;
  netBalance: number;
  
  orders: Order[];
  expenses: Expense[];
  
  productBreakdown: ProductSummary[];
  ingredientBreakdown: IngredientSummary[];
}