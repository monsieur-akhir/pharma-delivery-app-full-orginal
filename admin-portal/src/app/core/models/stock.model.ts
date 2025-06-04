import { Medicine } from './medicine.model';
import { Pharmacy } from './pharmacy.model';

export interface MedicineStock {
  id: number;
  medicineId: number;
  pharmacyId: number;
  quantity: number;
  reorderLevel: number;  // Niveau de réapprovisionnement
  idealStock: number;    // Stock idéal
  batchNumber?: string;
  expiryDate?: Date;
  lastUpdated: Date;
  medicine?: Medicine;   // Relation avec le médicament
  pharmacy?: Pharmacy;   // Relation avec la pharmacie
}

export interface StockAlert {
  type: 'LOW' | 'EXPIRED' | 'EXPIRING_SOON';
  medicine: Medicine;
  pharmacy: Pharmacy;
  currentQuantity: number;
  reorderLevel: number;
  expiryDate?: Date;
  daysUntilExpiry?: number;
}

export interface StockMovement {
  id: number;
  medicineStockId: number;
  previousQuantity: number;
  newQuantity: number;
  changeReason: StockChangeReason;
  notes?: string;
  timestamp: Date;
  createdBy: string;
  medicineStock?: MedicineStock;
}

export enum StockChangeReason {
  PURCHASE = 'PURCHASE',        // Achat de stock
  SALE = 'SALE',                // Vente au client
  RETURN = 'RETURN',            // Retour par le client
  ADJUSTMENT = 'ADJUSTMENT',    // Ajustement manuel
  EXPIRY = 'EXPIRY',            // Expiration
  DAMAGE = 'DAMAGE',            // Dommage
  TRANSFER_IN = 'TRANSFER_IN',  // Transfert entrant d'une autre pharmacie
  TRANSFER_OUT = 'TRANSFER_OUT' // Transfert sortant vers une autre pharmacie
}
