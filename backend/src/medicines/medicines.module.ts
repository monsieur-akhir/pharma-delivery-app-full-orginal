import { Module } from '@nestjs/common';
import { MedicinesController } from './medicines.controller';
import { MedicinesService } from './medicines.service';
import { DatabaseModule } from '../database/database.module';
import { PrescriptionsModule } from 'src/prescriptions/prescriptions.module';

@Module({
  imports: [DatabaseModule, PrescriptionsModule],
  controllers: [MedicinesController],
  providers: [MedicinesService],
  exports: [MedicinesService],
})
export class MedicinesModule {}