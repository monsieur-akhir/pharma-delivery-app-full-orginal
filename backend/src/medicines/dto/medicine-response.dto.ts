// src/medicines/dto/medicine-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO pour la réponse d'un médicament
 */
export class MedicineResponseDto {
  @ApiProperty({ description: 'Identifiant unique', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Nom du médicament' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Nom générique' })
  @Expose()
  generic: string;

  @ApiProperty({ description: 'Catégorie thérapeutique' })
  @Expose()
  category: string;

  @ApiProperty({ description: 'Posologie' })
  @Expose()
  dosage: string;

  @ApiProperty({ description: 'Quantité en stock' })
  @Expose()
  stock: number;

  @ApiProperty({ description: 'Seuil minimal pour alerte' })
  @Expose()
  minStock: number;

  @ApiProperty({ description: 'Capacité maximale de stockage' })
  @Expose()
  maxStock: number;

  @ApiProperty({ description: 'Prix unitaire' })
  @Expose()
  price: number;

  @ApiProperty({ description: 'Date d\'expiration (ISO 8601)' })
  @Expose()
  expiry: string;

  @ApiProperty({ description: 'Description détaillée', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Nom du fabricant', required: false })
  @Expose()
  manufacturer?: string;

  @ApiProperty({ description: 'Conditions de conservation', required: false })
  @Expose()
  storageRequirements?: string;

  @ApiProperty({ description: 'Prescription requise', default: false })
  @Expose()
  prescriptionRequired: boolean;

  @ApiProperty({ description: 'Effets secondaires éventuels', type: [String], required: false })
  @Expose()
  sideEffects?: string[];

  @ApiProperty({ description: "URL de l'image", required: false })
  @Expose()
  imageUrl?: string;

  @ApiProperty({ description: "Code-barres", required: false })
  @Expose()
  barcode?: string;

  @ApiProperty({ description: 'Disponibilité en stock (true si stock > 0)' })
  @Expose()
  inStock: boolean;

  @ApiProperty({ description: 'Date de création du médicament' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @Expose()
  updatedAt: Date;
}