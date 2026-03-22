// src/types/branch.ts
import { Timestamp } from '../firebase';
export interface Branch {
    id: string;
    name: string;
    address?: string;
    isActive: boolean;
    createdAt?: Timestamp | Date;
    tableCount: number; 
}