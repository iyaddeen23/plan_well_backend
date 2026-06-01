import { Module } from '@nestjs/common';
import { ImprestService } from './imprest.service';
import { ImprestController } from './imprest.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ImprestController],
  providers: [ImprestService],
})
export class ImprestModule {}
