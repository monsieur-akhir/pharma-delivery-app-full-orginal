import { Controller, Post, Body, Get, Param, Put, HttpException, HttpStatus } from '@nestjs/common';
import { PrescriptionsService, Prescription } from './prescriptions.service';
import { AnalyzePrescriptionDto } from './dto/analyze-prescription.dto';
import { CheckDrugInteractionsDto } from './dto/check-drug-interactions.dto';
import { GetMedicationInfoDto } from './dto/get-medication-info.dto';
import { UpdatePrescriptionStatusDto } from './dto/update-prescription-status.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { OcrService } from './services/ocr.service';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService, private readonly ocrService: OcrService) {console.log('PrescriptionsModule loaded');}

  /**
   * Analyze a prescription image using AI
   * @param analyzePrescriptionDto DTO containing the base64 encoded image
   * @returns Structured analysis of the prescription
   */
  @Post('analyze')
  async analyzePrescription(@Body() analyzePrescriptionDto: AnalyzePrescriptionDto) {
    try {
      if (!analyzePrescriptionDto.imageBase64) {
        throw new HttpException(
          'Image data is required for prescription analysis',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      const result = await this.prescriptionsService.analyzePrescription(
        analyzePrescriptionDto.imageBase64
      );
      // Remove the null check since the method will throw an error if it fails
      return {
        success: true,
        data: result,
        message: 'Prescription analyzed successfully'
      };
    } catch (error) {
      console.error('Controller: Prescription analysis error:', error);
      throw new HttpException(
        `Failed to analyze prescription: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check for potential interactions between medications
   * @param checkDrugInteractionsDto DTO containing array of medications to check
   * @returns Analysis of potential drug interactions
   */
  @Post('check-interactions')
  async checkDrugInteractions(@Body() checkDrugInteractionsDto: CheckDrugInteractionsDto) {
    try {
      if (!checkDrugInteractionsDto.medications || !checkDrugInteractionsDto.medications.length) {
        throw new HttpException(
          'Medications list is required for interaction check',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.prescriptionsService.checkDrugInteractions(
        checkDrugInteractionsDto.medications
      );
      // Remove the null check since the method will throw an error if it fails
      return {
        success: true,
        data: result,
        message: 'Drug interactions analyzed successfully'
      };
    } catch (error) {
      console.error('Controller: Drug interaction check error:', error);
      
      // If it's a validation error, return a 400 response
      if (error.message.includes('At least two medications')) {
        throw new HttpException(
          error.message,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      throw new HttpException(
        `Failed to check drug interactions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get comprehensive information about a medication
   * @param getMedicationInfoDto DTO containing medication name
   * @returns Detailed information about the medication
   */
  @Post('medication-info')
  async getMedicationInfo(@Body() getMedicationInfoDto: GetMedicationInfoDto) {
    try {
      if (!getMedicationInfoDto.medicationName) {
        throw new HttpException(
          'Medication name is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.prescriptionsService.getMedicationInfo(
        getMedicationInfoDto.medicationName
      );
      // Remove the null check since the method will throw an error if it fails
      return {
        success: true,
        data: result,
        message: 'Medication information retrieved successfully'
      };
    } catch (error) {
      console.error('Controller: Medication info error:', error);
      throw new HttpException(
        `Failed to get medication information: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Save a prescription to the database
   * @param createPrescriptionDto DTO containing prescription details
   * @returns The created prescription record
   */
  @Post()
  async createPrescription(@Body() createPrescriptionDto: CreatePrescriptionDto) {
    try {
      if (!createPrescriptionDto.userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }
      
      if (!createPrescriptionDto.imageUrl) {
        throw new HttpException('Image URL is required', HttpStatus.BAD_REQUEST);
      }
      
      const prescription = await this.prescriptionsService.savePrescription(
        createPrescriptionDto.userId,
        createPrescriptionDto.imageUrl,
        createPrescriptionDto.orderId,
        createPrescriptionDto.aiAnalysis,
      );
      // The service will throw an error if the creation fails
      return {
        success: true,
        data: prescription,
        message: 'Prescription created successfully'
      };
    } catch (error) {
      console.error('Controller: Create prescription error:', error);
      
      if (error.message.includes('required')) {
        throw new HttpException(
          error.message,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      throw new HttpException(
        `Failed to create prescription: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all prescriptions for a specific user
   * @param userId User ID
   * @returns Array of prescription records
   */
  @Get('user/:userId')
  async getUserPrescriptions(@Param('userId') userId: string): Promise<{
    success: boolean;
    data: Prescription[];
    count: number;
    message: string;
  }> {
    try {
      if (!userId || isNaN(+userId)) {
        throw new HttpException('Valid user ID is required', HttpStatus.BAD_REQUEST);
      }
      
      const prescriptions = await this.prescriptionsService.getUserPrescriptions(+userId, +userId);
      
      return {
        success: true,
        data: prescriptions,
        count: prescriptions.length,
        message: `Retrieved ${prescriptions.length} prescriptions for user ${userId}`
      };
    } catch (error) {
      console.error(`Controller: Get user prescriptions error for user ID ${userId}:`, error);
      
      if (error.message.includes('required')) {
        throw new HttpException(
          error.message,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      throw new HttpException(
        `Failed to retrieve user prescriptions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a specific prescription by ID
   * @param id Prescription ID
   * @returns The prescription record
   */
  @Get('detail/:id')
  async getPrescription(@Param('id') id: string) {
    try {
      if (!id || isNaN(+id)) {
        throw new HttpException('Valid prescription ID is required', HttpStatus.BAD_REQUEST);
      }
      
      const prescription = await this.prescriptionsService.getPrescriptionById(+id);
      
      // The service will throw a NotFoundException if the prescription is not found
      
      return {
        success: true,
        data: prescription,
        message: 'Prescription retrieved successfully'
      };
    } catch (error) {
      console.error(`Controller: Get prescription error for ID ${id}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to retrieve prescription: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  /**
   * Update the verification status of a prescription
   * @param id Prescription ID
   * @param updateStatusDto DTO containing verification details
   * @returns The updated prescription record
   */
  @Put(':id/status')
  async updatePrescriptionStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePrescriptionStatusDto,
  ) {
    try {
      if (!id || isNaN(+id)) {
        throw new HttpException('Valid prescription ID is required', HttpStatus.BAD_REQUEST);
      }
      
      // Check that isVerified is defined
      if (updateStatusDto.isVerified === undefined) {
        throw new HttpException(
          'Verification status (isVerified) is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // First check if the prescription exists
      const prescription = await this.prescriptionsService.getPrescription(+id, undefined, undefined);
      // The service will throw a NotFoundException if the prescription is not found

      // Update the prescription status
      const updatedPrescription = await this.prescriptionsService.updatePrescriptionStatus(
        +id,
        updateStatusDto.isVerified,
        updateStatusDto.verifiedBy,
        updateStatusDto.verificationNotes,
      );
      // The service will throw an error if the update fails
      return {
        success: true,
        data: updatedPrescription,
        message: `Prescription status updated to ${updatedPrescription.status}`
      };
    } catch (error) {
      console.error(`Controller: Update prescription status error for ID ${id}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to update prescription status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}