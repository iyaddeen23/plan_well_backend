import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateBankDto, UpdateBankDto, BankQueryDto } from './dto/bank.dto';

@Injectable()
export class BankService {
  private readonly TABLE = 'bank_transactions';

  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, dto: CreateBankDto) {
    const { data, error } = await this.supabase.db
      .from(this.TABLE)
      .insert({
        user_id: userId,
        date: dto.date,
        account: dto.account,
        currency: dto.currency ?? 'GH¢',
        fx_rate: dto.fxRate ?? 1,
        amount_foreign: dto.amountForeign,
        amount_ghc: dto.amountGhc,
        tx_type: dto.txType,
        ref: dto.ref ?? null,
        notes: dto.notes ?? null,
        period: dto.period,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAll(userId: string, query: BankQueryDto) {
    let q = this.supabase.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (query.period)   q = q.eq('period', query.period);
    if (query.account)  q = q.ilike('account', `%${query.account}%`);
    if (query.currency) q = q.eq('currency', query.currency);
    if (query.txType)   q = q.eq('tx_type', query.txType);
    if (query.from)     q = q.gte('date', query.from);
    if (query.to)       q = q.lte('date', query.to);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data;
  }

  async findOne(userId: string, id: string) {
    const { data, error } = await this.supabase.db
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException(`Bank transaction ${id} not found`);
    return data;
  }

  async update(userId: string, id: string, dto: UpdateBankDto) {
    await this.findOne(userId, id);
    const update: Record<string, any> = {};
    if (dto.date !== undefined)          update.date           = dto.date;
    if (dto.account !== undefined)       update.account        = dto.account;
    if (dto.currency !== undefined)      update.currency       = dto.currency;
    if (dto.fxRate !== undefined)        update.fx_rate        = dto.fxRate;
    if (dto.amountForeign !== undefined) update.amount_foreign = dto.amountForeign;
    if (dto.amountGhc !== undefined)     update.amount_ghc     = dto.amountGhc;
    if (dto.txType !== undefined)        update.tx_type        = dto.txType;
    if (dto.ref !== undefined)           update.ref            = dto.ref;
    if (dto.notes !== undefined)         update.notes          = dto.notes;
    if (dto.period !== undefined)        update.period         = dto.period;

    const { data, error } = await this.supabase.db
      .from(this.TABLE)
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    const { error } = await this.supabase.db
      .from(this.TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return { message: 'Bank transaction deleted' };
  }

  async reconciliation(userId: string, period?: string) {
    let q = this.supabase.db
      .from(this.TABLE)
      .select('account, currency, tx_type, amount_ghc')
      .eq('user_id', userId);

    if (period) q = q.eq('period', period);
    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const byAccount: Record<string, number> = {};
    let totalCredits = 0;
    let totalDebits = 0;

    for (const row of data) {
      const amt = Number(row.amount_ghc);
      const isCredit = row.tx_type === 'Credit (Deposit)';
      if (isCredit) totalCredits += amt; else totalDebits += amt;
      byAccount[row.account] = (byAccount[row.account] ?? 0) + (isCredit ? amt : -amt);
    }

    return { totalCredits, totalDebits, netMovement: totalCredits - totalDebits, byAccount };
  }
}
