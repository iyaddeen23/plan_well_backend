import { Module } from '@nestjs/common';
import { ArService } from './ar.service';
import { ArController } from './ar.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ArController],
  providers: [ArService],
})
export class ArModule {}
