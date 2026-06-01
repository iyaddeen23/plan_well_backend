import { Module } from '@nestjs/common';
import { TrialBalanceService } from './trial-balance.service';
import { TrialBalanceController } from './trial-balance.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TrialBalanceController],
  providers: [TrialBalanceService],
})
export class TrialBalanceModule {}
