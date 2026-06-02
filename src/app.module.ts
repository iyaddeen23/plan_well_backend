import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { JournalModule } from './journal/journal.module';
import { ImprestModule } from './imprest/imprest.module';
import { ProductionModule } from './production/production.module';
import { ArModule } from './ar/ar.module';
import { BankModule } from './bank/bank.module';
import { TrialBalanceModule } from './trial-balance/trial-balance.module';
import { FinancialsModule } from './financials/financials.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    JournalModule,
    ImprestModule,
    ProductionModule,
    ArModule,
    BankModule,
    TrialBalanceModule,
    FinancialsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
