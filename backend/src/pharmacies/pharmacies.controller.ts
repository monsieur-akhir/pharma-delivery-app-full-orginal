import { Controller, Get, Post, Body, Param, Put, Patch, Delete, HttpException, HttpStatus, Query, Logger } from '@nestjs/common';
import { PharmaciesService } from './pharmacies.service';
import { CreatePharmacyDto } from './dto/create-pharmacy.dto';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';
import { AddStaffDto } from './dto/add-staff.dto';
import { InsertPharmacy } from '../../../shared/schema';
import { DatabaseService } from '../database/database.service';

console.log('PharmaciesController loaded');

@Controller('pharmacies')
export class PharmaciesController {
  private readonly logger = new Logger(PharmaciesController.name);

  constructor(
    private readonly pharmaciesService: PharmaciesService,
    private readonly databaseService: DatabaseService
  ) {
    this.logger.log('PharmaciesController initialized');
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('status') status?: string,
  ) {
    try {
      const pageNumber = page ? parseInt(page, 10) : 0;
      const limitNumber = limit ? parseInt(limit, 10) : 10;
      const sortField = sort || 'createdAt';
      const sortOrder = order || 'desc';
      
      return await this.pharmaciesService.findAll(
        search,
        pageNumber,
        limitNumber,
        sortField,
        sortOrder,
        status
      );
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve pharmacies: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  // Supprimé - redéfini plus bas

  @Get('nearby')
  async findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    try {
      if (!lat || !lng) {
        throw new HttpException('Latitude and longitude are required', HttpStatus.BAD_REQUEST);
      }
      
      const radiusValue = radius ? +radius : 5; // Default to 5km
      
      return await this.pharmaciesService.findByProximity(+lat, +lng, radiusValue);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to find nearby pharmacies: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async create(@Body() createPharmacyDto: CreatePharmacyDto) {
    try {
      // Convert DTO to InsertPharmacy type
      const pharmacyData: InsertPharmacy = {
        name: createPharmacyDto.name,
        address: createPharmacyDto.address,
        phone: createPharmacyDto.phone,
        email: createPharmacyDto.email,
        location: createPharmacyDto.location,
        license_number: createPharmacyDto.license_number,
        is_active: true,
        opening_hours: createPharmacyDto.operating_hours,
        logo_image: createPharmacyDto.image_url,
        created_at: new Date(),
        updated_at: new Date(),
      };

      return await this.pharmaciesService.create(pharmacyData);
    } catch (error) {
      throw new HttpException(
        `Failed to create pharmacy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePharmacyDto: UpdatePharmacyDto) {
    try {
      const pharmacy = await this.pharmaciesService.findById(+id);
      if (!pharmacy) {
        throw new HttpException('Pharmacy not found', HttpStatus.NOT_FOUND);
      }

      return await this.pharmaciesService.update(+id, {
        ...updatePharmacyDto,
        updated_at: new Date(),
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update pharmacy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const pharmacy = await this.pharmaciesService.findById(+id);
      if (!pharmacy) {
        throw new HttpException('Pharmacy not found', HttpStatus.NOT_FOUND);
      }

      const deleted = await this.pharmaciesService.delete(+id);
      if (!deleted) {
        throw new HttpException('Failed to delete pharmacy', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return { message: 'Pharmacy deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete pharmacy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Patch(':id/approve')
  async approvePharmacy(@Param('id') id: string) {
    try {
      const pharmacy = await this.pharmaciesService.findById(+id);
      if (!pharmacy) {
        throw new HttpException('Pharmacy not found', HttpStatus.NOT_FOUND);
      }

      // Utiliser la valeur 'APPROVED' qui fait partie de l'enum
      return await this.pharmaciesService.updateStatus(+id, 'APPROVED' as any);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to approve pharmacy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Patch(':id/suspend')
  async suspendPharmacy(@Param('id') id: string) {
    try {
      const pharmacy = await this.pharmaciesService.findById(+id);
      if (!pharmacy) {
        throw new HttpException('Pharmacy not found', HttpStatus.NOT_FOUND);
      }

      // Comme il n'y a pas de statut 'SUSPENDED', on utilise 'PENDING_INFO' à la place
      return await this.pharmaciesService.updateStatus(+id, 'PENDING_INFO' as any, 'Suspended for review');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to suspend pharmacy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Patch(':id/reject')
  async rejectPharmacy(
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ) {
    try {
      const pharmacy = await this.pharmaciesService.findById(+id);
      if (!pharmacy) {
        throw new HttpException('Pharmacy not found', HttpStatus.NOT_FOUND);
      }

      // Utiliser la valeur 'REJECTED' qui fait partie de l'enum
      return await this.pharmaciesService.updateStatus(+id, 'REJECTED' as any, body.reason);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to reject pharmacy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/staff')
  async getPharmacyStaff(@Param('id') id: string) {
    try {
      const pharmacy = await this.pharmaciesService.findById(+id);
      if (!pharmacy) {
        throw new HttpException('Pharmacy not found', HttpStatus.NOT_FOUND);
      }

      return await this.pharmaciesService.getPharmacyStaff(+id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve pharmacy staff: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/staff')
  async addStaffMember(
    @Param('id') id: string,
    @Body() addStaffDto: AddStaffDto,
  ) {
    try {
      const pharmacy = await this.pharmaciesService.findById(+id);
      if (!pharmacy) {
        throw new HttpException('Pharmacy not found', HttpStatus.NOT_FOUND);
      }

      return await this.pharmaciesService.addStaffMember(
        +id,
        addStaffDto.userId,
        addStaffDto.role,
        addStaffDto.position,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to add staff member: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id/staff/:staffId')
  async removeStaffMember(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
  ) {
    try {
      const pharmacy = await this.pharmaciesService.findById(+id);
      if (!pharmacy) {
        throw new HttpException('Pharmacy not found', HttpStatus.NOT_FOUND);
      }

      const removed = await this.pharmaciesService.removeStaffMember(+id, +staffId);
      if (!removed) {
        throw new HttpException('Failed to remove staff member', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return { message: 'Staff member removed successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to remove staff member: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getPharmacyStats() {
    this.logger.log('GET /api/pharmacies/stats endpoint called');
    try {
      const stats = await this.pharmaciesService.getPharmacyStats();
      
      // Ajouter le champ 'suspended' pour la compatibilité avec le frontend
      const pendingInfoCount = (stats as any).pendingInfo || 0;
      const result = {
        ...stats,
        suspended: pendingInfoCount
      };
      
      // Supprimer pendingInfo si elle existe
      if ('pendingInfo' in result) {
        delete result.pendingInfo;
      }
      
      this.logger.log('Pharmacy stats result:', result);
      return result;
    } catch (error) {
      this.logger.error('Error fetching pharmacy stats:', error);
      throw new HttpException(
        `Failed to retrieve pharmacy statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  @Get('medicine/:medicineId')
  async getPharmaciesByMedicine(@Param('medicineId') medicineId: string) {
    try {
      return await this.pharmaciesService.getPharmaciesByMedicine(+medicineId);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve pharmacies by medicine: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const pharmacy = await this.pharmaciesService.findById(+id);
      if (!pharmacy) {
        throw new HttpException('Pharmacy not found', HttpStatus.NOT_FOUND);
      }
      return pharmacy;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve pharmacy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}