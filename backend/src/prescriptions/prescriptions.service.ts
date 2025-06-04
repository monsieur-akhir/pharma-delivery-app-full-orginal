import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BullService } from '../bull/bull.service';
import { OcrResult } from '../bull/processors/ocr.processor';
import { PrescriptionAnalysisResult } from '../bull/processors/prescription-analysis.processor';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/enums'; // Make sure UserRole enum is correctly imported from its actual location

// TODO: Move these DTOs to src/prescriptions/dto/ and import them.
interface CreatePrescriptionDto {
  userId: number;
  pharmacyId?: number;
  image: any; // Changed from Express.Multer.File to any. Ensure @types/multer is installed and configured.
  notes?: string;
}

interface ListPrescriptionsFilterDto {
  page?: number;
  limit?: number;
  userId?: number; // Filter by user ID (for admins or specific queries)
  pharmacyId?: number; // Filter by pharmacy ID (for pharmacy admins/staff)
  status?: string; // Filter by status
  orderBy?: string; // Field to order by (e.g., 'createdAt', 'status')
  orderDirection?: 'ASC' | 'DESC';
  // Consider adding date range filters: dateFrom?: Date; dateTo?: Date;
}

interface UpdatePrescriptionDataDto {
  notes?: string;
  pharmacyId?: number; // For assignment by admin
  status?: string; // For update by admin or system
}

// Assuming your Prescription entity/interface looks something like this:
export interface Prescription {
  id: number;
  userId: number;
  pharmacyId?: number;
  imagePath: string;
  status: string; // e.g., 'pending', 'ocr_completed', 'ocr_failed', 'analysis_completed', 'analysis_failed', 'awaiting_confirmation', 'confirmed', 'rejected', 'cancelled'
  notes?: string;
  ocrText?: string;
  ocrConfidence?: number;
  ocrData?: string; // JSON string of structured OCR data
  analysisData?: string; // JSON string of AI analysis
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PrescriptionsService {
  analyzePrescription(imageBase64: string) {
    throw new Error('Method not implemented.');
  }
  checkDrugInteractions(medications: string[]) {
    throw new Error('Method not implemented.');
  }
  getMedicationInfo(medicationName: string) {
    throw new Error('Method not implemented.');
  }
  savePrescription(userId: number, imageUrl: string, orderId: number, aiAnalysis: any) {
    throw new Error('Method not implemented.');
  }
  getPrescriptionById(arg0: number) {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(PrescriptionsService.name);
  private readonly uploadDir: string;

  constructor(
    private readonly databaseService: DatabaseService, // Ensure this service has the methods used below
    private readonly bullService: BullService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', 'uploads');
    fs.ensureDirSync(this.uploadDir); // ensureDirSync is fine for startup
  }

  /**
   * Create a new prescription record
   */
  async createPrescription(data: CreatePrescriptionDto): Promise<Partial<Prescription>> {
    try {
      this.logger.log(`Creating prescription for user #${data.userId}`);
      
      if (!data.image || !data.image.buffer || !data.image.originalname) {
        throw new BadRequestException('Valid image file is required.');
      }

      const fileName = `${Date.now()}-${data.image.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = path.join(this.uploadDir, fileName);
      
      await fs.writeFile(filePath, data.image.buffer);
      
      const prescriptionData = {
        userId: data.userId,
        pharmacyId: data.pharmacyId,
        imagePath: filePath,
        status: 'pending', // Initial status
        notes: data.notes,
      };

      // @ts-ignore - Assuming DatabaseService will have createPrescription
      const prescription: Prescription = await this.databaseService.createPrescription(prescriptionData);
      
      // Queue OCR job
      await this.queueOcrJob(prescription.id, data.userId, filePath);
      
      return {
        id: prescription.id,
        status: prescription.status,
        createdAt: prescription.createdAt,
        // message: 'Prescription uploaded successfully and queued for processing', // Service methods should return data, controller handles messages
      };
    } catch (error) {
      this.logger.error(`Failed to create prescription: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) throw error;
      throw new Error(`Failed to create prescription: ${error.message}`); // Or a more specific internal server error
    }
  }

  /**
   * Get prescription by ID with RBAC
   */
  async getPrescription(id: number, requestingUserId: number, requestingUserRoles: UserRole[] = []): Promise<Prescription> {
    try {
      // @ts-ignore - Assuming DatabaseService will have getPrescription
      const prescription: Prescription = await this.databaseService.getPrescription(id);
      
      if (!prescription) {
        throw new NotFoundException(`Prescription with ID ${id} not found`);
      }
      
      const isAdmin = requestingUserRoles.includes(UserRole.ADMIN);
      const isOwner = prescription.userId === requestingUserId;
      // TODO: Implement pharmacy admin check if a user is linked to a pharmacy
      // const isPharmacyAdminForThisPrescription = requestingUserRoles.includes(UserRole.PHARMACY_ADMIN) && 
      //                                          userPharmacyId && prescription.pharmacyId === userPharmacyId;

      if (!isOwner && !isAdmin /* && !isPharmacyAdminForThisPrescription */) {
        this.logger.warn(`User #${requestingUserId} (roles: ${requestingUserRoles.join(', ')}) attempted to access prescription #${id} without authorization.`);
        throw new ForbiddenException('You are not authorized to access this prescription.');
      }
      
      return prescription;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to get prescription #${id} for user #${requestingUserId}: ${error.message}`, error.stack);
      throw new Error(`Failed to retrieve prescription: ${error.message}`);
    }
  }

  /**
   * Get all prescriptions for a specific user (owner only)
   */
  async getUserPrescriptions(userId: number, requestingUserId: number): Promise<Prescription[]> {
    if (userId !== requestingUserId) {
        // Potentially allow admins to use this too, if so, add role check
        throw new ForbiddenException('You can only retrieve your own prescriptions.');
    }
    try {
      // @ts-ignore - Assuming DatabaseService will have getUserPrescriptions
      return await this.databaseService.getUserPrescriptions(userId);
    } catch (error) {
      this.logger.error(`Failed to get prescriptions for user #${userId}: ${error.message}`, error.stack);
      throw new Error(`Failed to retrieve user prescriptions: ${error.message}`);
    }
  }

  /**
   * List prescriptions with filtering and pagination (Admin/Pharmacy Admin focus)
   */
  async listPrescriptions(
    filters: ListPrescriptionsFilterDto,
    requestingUserId: number, // Added for context and potential RBAC
    requestingUserRoles: UserRole[] = [],
  ): Promise<{ data: Prescription[]; total: number; page: number; limit: number }> {
    try {
      this.logger.log(`User #${requestingUserId} (roles: ${requestingUserRoles.join(', ')}) listing prescriptions with filters: ${JSON.stringify(filters)}`);
      
      const page = filters.page || 1;
      const limit = filters.limit || 10;

      // RBAC: Modify filters based on role
      if (requestingUserRoles.includes(UserRole.PHARMACY_ADMIN)) {
        // TODO: Fetch user's pharmacy_id
        // const userPharmacyId = await this.usersService.getUserPharmacyId(requestingUserId);
        // if (userPharmacyId) {
        //   if (filters.pharmacyId && filters.pharmacyId !== userPharmacyId) {
        //     throw new ForbiddenException('Pharmacy admins can only filter by their own pharmacy.');
        //   }
        //   filters.pharmacyId = userPharmacyId; // Enforce pharmacyId filter
        // } else {
        //   throw new ForbiddenException('Pharmacy admin not associated with a pharmacy.');
        // }
      } else if (!requestingUserRoles.includes(UserRole.ADMIN)) {
        // Non-admin, non-pharmacy_admin should not access this, or only their own if filters.userId is set and matches
        if (!filters.userId || filters.userId !== requestingUserId) {
            // throw new ForbiddenException('You are not authorized to list these prescriptions.');
            // Or, for a generic user, default to their own prescriptions if no other filter is applied by an admin
            filters.userId = requestingUserId; 
        }
      }
      // Admins can see all / filter by any userId or pharmacyId

      // @ts-ignore - Assuming DatabaseService will have findPrescriptions
      const { data, total } = await this.databaseService.findPrescriptions(filters);
      return { data, total, page, limit };
    } catch (error) {
      this.logger.error(`Failed to list prescriptions: ${error.message}`, error.stack);
      if (error instanceof ForbiddenException) throw error;
      throw new Error(`Failed to list prescriptions: ${error.message}`);
    }
  }

  /**
   * Update prescription details with authorization
   */
  async updatePrescription(
    prescriptionId: number,
    updateData: UpdatePrescriptionDataDto,
    requestingUserId: number,
    requestingUserRoles: UserRole[],
  ): Promise<Prescription> {
    this.logger.log(`User #${requestingUserId} (roles: ${requestingUserRoles.join(', ')}) attempting to update prescription #${prescriptionId} with data: ${JSON.stringify(updateData)}`);

    // @ts-ignore - Assuming DatabaseService will have getPrescription
    const prescription: Prescription = await this.databaseService.getPrescription(prescriptionId);
    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${prescriptionId} not found`);
    }

    const isAdmin = requestingUserRoles.includes(UserRole.ADMIN);
    const isOwner = prescription.userId === requestingUserId;

    const dataToUpdate: Partial<Prescription> = {};

    if (updateData.notes !== undefined) {
      if (isOwner && ['pending', 'ocr_failed', 'analysis_failed'].includes(prescription.status)) {
        dataToUpdate.notes = updateData.notes;
      } else if (isAdmin) {
        dataToUpdate.notes = updateData.notes;
      } else if (isOwner) {
        throw new ForbiddenException(`You can only update notes for prescriptions with status: pending, ocr_failed, analysis_failed.`);
      } else {
        throw new ForbiddenException('You are not authorized to update notes for this prescription.');
      }
    }

    if (updateData.pharmacyId !== undefined) {
      if (isAdmin) {
        // TODO: Integrate PharmacyService.exists(updateData.pharmacyId) check
        // if (!(await this.pharmacyService.exists(updateData.pharmacyId))) {
        //   throw new BadRequestException(`Pharmacy with ID ${updateData.pharmacyId} does not exist.`);
        // }
        dataToUpdate.pharmacyId = updateData.pharmacyId;
      } else {
        throw new ForbiddenException('You are not authorized to assign/update the pharmacy for this prescription.');
      }
    }

    if (updateData.status !== undefined) {
      if (isAdmin) {
        const allowedAdminStatuses = ['pending', 'ocr_failed', 'analysis_failed', 'awaiting_confirmation', 'confirmed', 'rejected', 'cancelled', 'on_hold', 'processing', 'shipped', 'delivered'];
        if (!allowedAdminStatuses.includes(updateData.status)) {
            throw new BadRequestException(`Invalid status value: ${updateData.status}. Admins can set status to: ${allowedAdminStatuses.join(', ')}.`);
        }
        dataToUpdate.status = updateData.status;
      } else {
        // Regular users cannot change status directly through this generic update method.
        // Status changes for users should happen via specific actions or system processes.
        throw new ForbiddenException('You are not authorized to directly change the status of this prescription.');
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException('No valid fields to update or no changes provided.');
    }
    dataToUpdate.updatedAt = new Date(); // Manually set updatedAt if not handled by ORM/DB

    try {
      // @ts-ignore - Assuming DatabaseService will have updatePrescription
      const updatedPrescription = await this.databaseService.updatePrescription(prescriptionId, dataToUpdate);
      this.logger.log(`Prescription #${prescriptionId} updated successfully by user #${requestingUserId}. Changes: ${JSON.stringify(dataToUpdate)}`);
      return updatedPrescription;
    } catch (error) {
      this.logger.error(`Failed to update prescription #${prescriptionId}: ${error.message}`, error.stack);
      throw new Error(`Failed to update prescription: ${error.message}`);
    }
  }

  /**
   * Update prescription status (Primarily for Admin or internal system calls)
   */
  async updatePrescriptionStatus(
    id: number, 
    isVerified: boolean, 
    verifiedBy?: number, 
    verificationNotes?: string
  ): Promise<Prescription> {
    try {
      this.logger.log(`Updating verification status for prescription #${id} to ${isVerified ? 'verified' : 'rejected'} by user #${verifiedBy}`);
      
      const status = isVerified ? 'confirmed' : 'rejected';
      const updateData = { 
        status,
        verifiedBy,
        verificationNotes,
        updatedAt: new Date()
      };
      
      // @ts-ignore - Assuming DatabaseService will have updatePrescription
      return await this.databaseService.updatePrescription(id, updateData);
    } catch (error) {
      this.logger.error(`Failed to update prescription #${id} verification status: ${error.message}`, error.stack);
      throw new Error(`Failed to update prescription verification status: ${error.message}`);
    }
  }

  /**
   * Update prescription with OCR results (internal method called by OCR processor)
   */
  async updateOcrResults(prescriptionId: number, ocrResult: OcrResult): Promise<boolean> {
    try {
      this.logger.log(`Updating prescription #${prescriptionId} with OCR results (user: #${ocrResult.userId})`);
      
      const updatePayload: Partial<Prescription> = {
        ocrText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        ocrData: JSON.stringify(ocrResult.structuredData), // Ensure structuredData is serializable
        status: 'ocr_completed',
        updatedAt: new Date(),
      };
      // @ts-ignore - Assuming DatabaseService will have updatePrescription
      await this.databaseService.updatePrescription(prescriptionId, updatePayload);
      
      // Queue AI analysis job
      await this.queueAnalysisJob(prescriptionId, ocrResult.userId, ocrResult);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to update prescription #${prescriptionId} with OCR results: ${error.message}`, error.stack);
      // Potentially update status to 'ocr_failed'
      try {
        // @ts-ignore - Assuming DatabaseService will have updatePrescription
        await this.databaseService.updatePrescription(prescriptionId, { status: 'ocr_failed', updatedAt: new Date() });
      } catch (statusUpdateError) {
        this.logger.error(`Failed to update prescription #${prescriptionId} status to ocr_failed: ${statusUpdateError.message}`, statusUpdateError.stack);
      }
      return false; // Indicate failure
    }
  }

  /**
   * Update prescription with AI analysis results (internal method called by Analysis processor)
   */
  async updateAnalysisResults(prescriptionId: number, analysisResult: PrescriptionAnalysisResult): Promise<boolean> {
    try {
      this.logger.log(`Updating prescription #${prescriptionId} with AI analysis results (user: #${analysisResult.userId})`);
      
      const updatePayload: Partial<Prescription> = {
        analysisData: JSON.stringify(analysisResult), // Ensure analysisResult is serializable
        status: 'analysis_completed',
        updatedAt: new Date(),
      };
      // @ts-ignore - Assuming DatabaseService will have updatePrescription
      await this.databaseService.updatePrescription(prescriptionId, updatePayload);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to update prescription #${prescriptionId} with analysis results: ${error.message}`, error.stack);
      // Potentially update status to 'analysis_failed'
      try {
        // @ts-ignore - Assuming DatabaseService will have updatePrescription
        await this.databaseService.updatePrescription(prescriptionId, { status: 'analysis_failed', updatedAt: new Date() });
      } catch (statusUpdateError) {
        this.logger.error(`Failed to update prescription #${prescriptionId} status to analysis_failed: ${statusUpdateError.message}`, statusUpdateError.stack);
      }
      return false; // Indicate failure
    }
  }

  /**
   * Delete a prescription with RBAC
   */
  async deletePrescription(id: number, requestingUserId: number, requestingUserRoles: UserRole[] = []): Promise<{ success: boolean; message: string }> {
    try {
      // getPrescription already performs NotFound and basic Forbidden checks
      // @ts-ignore - Assuming DatabaseService will have getPrescription
      const prescription: Prescription = await this.getPrescription(id, requestingUserId, requestingUserRoles);

      // Additional specific delete permissions if needed (e.g. only owner can delete, not even admin)
      // For now, if user can get it (owner or admin), they can delete it.
      // If only owner should delete: 
      // if (prescription.userId !== requestingUserId) {
      //   throw new ForbiddenException('Only the owner can delete this prescription.');
      // }

      // Delete the image file
      if (prescription.imagePath) {
        try {
          await fs.unlink(prescription.imagePath);
          this.logger.log(`Deleted image file ${prescription.imagePath} for prescription #${id}`);
        } catch (fileError: any) { // Explicitly type fileError
          this.logger.warn(`Failed to delete prescription image file ${prescription.imagePath}: ${fileError.message}`);
          // Do not necessarily stop deletion of DB record if file deletion fails, but log it.
        }
      }
      
      // Delete from database
      // @ts-ignore - Assuming DatabaseService will have deletePrescription
      await this.databaseService.deletePrescription(id);
      
      return { success: true, message: 'Prescription deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete prescription #${id} by user #${requestingUserId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new Error(`Failed to delete prescription: ${error.message}`);
    }
  }

  /**
   * Queue OCR job for a prescription (private helper)
   */
  private async queueOcrJob(prescriptionId: number, userId: number, imagePath: string): Promise<boolean> {
    try {
      await this.bullService.addOcrJob({
        prescriptionId,
        userId,
        imagePath,
        languages: this.configService.get<string[]>('OCR_SUPPORTED_LANGUAGES', ['eng', 'fra']),
      });
      
      this.logger.log(`OCR job queued for prescription #${prescriptionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to queue OCR job for prescription #${prescriptionId}: ${error.message}`, error.stack);
      // Consider how to handle this failure: update prescription status to 'ocr_queue_failed'?
      throw new Error(`Failed to queue OCR job: ${error.message}`); // Propagate to inform the calling function
    }
  }

  /**
   * Queue AI analysis job for a prescription (private helper)
   */
  private async queueAnalysisJob(prescriptionId: number, userId: number, ocrResult: OcrResult): Promise<boolean> {
    try {
      await this.bullService.addPrescriptionAnalysisJob({
        prescriptionId,
        userId,
        ocrResult,
      });
      
      this.logger.log(`AI analysis job queued for prescription #${prescriptionId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to queue AI analysis job for prescription #${prescriptionId}: ${error.message}`, error.stack);
      // Consider how to handle this failure: update prescription status to 'analysis_queue_failed'?
      throw new Error(`Failed to queue AI analysis job: ${error.message}`); // Propagate
    }
  }
}