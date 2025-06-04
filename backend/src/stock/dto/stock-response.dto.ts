import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MedicineStockResponseDto {
  @ApiProperty({ description: 'ID du stock' })
  id: number;

  @ApiProperty({ description: 'ID du médicament' })
  medicineId: number;

  @ApiProperty({ description: 'ID de la pharmacie' })
  pharmacyId: number;

  @ApiProperty({ description: 'Quantité en stock' })
  quantity: number;

  @ApiProperty({ description: 'Niveau de réapprovisionnement' })
  reorderLevel: number;

  @ApiProperty({ description: 'Stock idéal' })
  idealStock: number;

  @ApiPropertyOptional({ description: 'Numéro de lot' })
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Date d\'expiration' })
  expiryDate?: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  lastUpdated: Date;

  @ApiPropertyOptional({ description: 'Informations du médicament' })
  medicine?: {
    id: number;
    name: string;
    genericName: string;
    category: string;
    manufacturer: string;
    imageUrl?: string;
  };

  @ApiPropertyOptional({ description: 'Informations de la pharmacie' })
  pharmacy?: {
    id: number;
    name: string;
    address: string;
  };
}

export class StockAlertResponseDto {
  @ApiProperty({ description: 'Type d\'alerte', enum: ['LOW', 'EXPIRED', 'EXPIRING_SOON'] })
  type: 'LOW' | 'EXPIRED' | 'EXPIRING_SOON';

  @ApiProperty({ description: 'Médicament concerné' })
  medicine: {
    id: number;
    name: string;
    genericName: string;
  };

  @ApiProperty({ description: 'Pharmacie concernée' })
  pharmacy: {
    id: number;
    name: string;
  };

  @ApiProperty({ description: 'Quantité actuelle' })
  currentQuantity: number;

  @ApiProperty({ description: 'Niveau de réapprovisionnement' })
  reorderLevel: number;

  @ApiPropertyOptional({ description: 'Date d\'expiration' })
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Jours avant expiration' })
  daysUntilExpiry?: number;
}

export class StockMovementResponseDto {
  @ApiProperty({ description: 'ID du mouvement' })
  id: number;

  @ApiProperty({ description: 'ID du stock médicament' })
  medicineStockId: number;

  @ApiProperty({ description: 'Quantité précédente' })
  previousQuantity: number;

  @ApiProperty({ description: 'Nouvelle quantité' })
  newQuantity: number;

  @ApiProperty({ description: 'Raison du changement' })
  changeReason: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiProperty({ description: 'Horodatage' })
  timestamp: Date;

  @ApiProperty({ description: 'Créé par' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Informations du stock' })
  medicineStock?: MedicineStockResponseDto;
}

export class StockListResponseDto {
  @ApiProperty({ description: 'Liste des stocks', type: [MedicineStockResponseDto] })
  stock: MedicineStockResponseDto[];

  @ApiProperty({ description: 'Nombre total d\'éléments' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Limite par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;
}

export class StockTransferResponseDto {
  @ApiProperty({ description: 'Stock source après transfert' })
  source: MedicineStockResponseDto;

  @ApiProperty({ description: 'Stock de destination après transfert' })
  destination: MedicineStockResponseDto;

  @ApiProperty({ description: 'Message de confirmation' })
  message: string;
}
