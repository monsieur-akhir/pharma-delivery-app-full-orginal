// src/medicines/dto/update-medicine.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateMedicineDto } from './create-medicine.dto';

/**
 * DTO pour la mise à jour d'un médicament
 * Toutes les propriétés sont optionnelles
 */
export class UpdateMedicineDto extends PartialType(CreateMedicineDto) {}