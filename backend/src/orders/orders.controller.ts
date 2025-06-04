import { Controller, Get, Post, Body, Param, Put, HttpException, HttpStatus, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      
      const { orders, total } = await this.ordersService.findAllPaginated(pageNumber, limitNumber);
      
      return {
        orders,
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const order = await this.ordersService.findById(+id);
      if (!order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }
      return order;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/details')
  async getOrderWithDetails(@Param('id') id: string) {
    try {
      const orderDetails = await this.ordersService.getOrderWithDetails(+id);
      if (!orderDetails) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }
      return orderDetails;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve order details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:userId')
  async getUserOrders(@Param('userId') userId: string) {
    try {
      return await this.ordersService.findUserOrders(+userId);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve user orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('pharmacy/:pharmacyId')
  async getPharmacyOrders(@Param('pharmacyId') pharmacyId: string) {
    try {
      return await this.ordersService.findPharmacyOrders(+pharmacyId);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve pharmacy orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('delivery-person/:deliveryPersonId')
  async getDeliveryPersonOrders(@Param('deliveryPersonId') deliveryPersonId: string) {
    try {
      return await this.ordersService.findDeliveryPersonOrders(+deliveryPersonId);
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve delivery person orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      // Adaptation des formats: transformation de l'objet deliveryAddress en string et extraction des coordonnées
      let deliveryAddress: string = '';
      let deliveryCoordinates = null;
      
      if (createOrderDto.deliveryAddress) {
        // Convertir l'objet adresse en string
        deliveryAddress = createOrderDto.deliveryAddress.address;
        
        // Récupérer les coordonnées si elles existent
        if (createOrderDto.deliveryAddress.location) {
          deliveryCoordinates = {
            lat: createOrderDto.deliveryAddress.location.lat,
            lng: createOrderDto.deliveryAddress.location.lng
          };
        }
      }

      const orderData = {
        userId: createOrderDto.userId,
        pharmacyId: createOrderDto.pharmacyId,
        deliveryAddress: deliveryAddress,
        deliveryCoordinates: deliveryCoordinates,
        paymentMethod: createOrderDto.paymentMethod,
        paymentIntentId: createOrderDto.paymentIntentId,
      };

      const orderItems = createOrderDto.items.map(item => ({
        medicineId: item.medicineId,
        quantity: item.quantity,
        price: item.price,
      }));

      return await this.ordersService.createOrder(orderData, orderItems);
    } catch (error) {
      throw new HttpException(
        `Failed to create order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    try {
      const order = await this.ordersService.findById(+id);
      if (!order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      return await this.ordersService.updateOrderStatus(
        +id,
        updateOrderStatusDto.status,
        updateOrderStatusDto.deliveryPersonId,
        updateOrderStatusDto.notes,
        updateOrderStatusDto.cancellationReason,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update order status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/delivery')
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
  ) {
    try {
      const order = await this.ordersService.findById(+id);
      if (!order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      return await this.ordersService.updateDeliveryStatus(
        +id,
        {
          location: updateDeliveryDto.location,
          estimatedTimeInMinutes: updateDeliveryDto.estimatedTimeInMinutes,
          deliveryStatus: updateDeliveryDto.deliveryStatus,
          notes: updateDeliveryDto.notes,
        },
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update delivery status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/payment')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() paymentData: { paymentStatus: string; paymentIntentId?: string },
  ) {
    try {
      const order = await this.ordersService.findById(+id);
      if (!order) {
        throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
      }

      return await this.ordersService.updatePaymentStatus(
        +id,
        paymentData.paymentStatus,
        paymentData.paymentIntentId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update payment status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}