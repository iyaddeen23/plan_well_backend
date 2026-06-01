import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateImprestDto, UpdateImprestDto, ImprestQueryDto } from './dto/imprest.dto';

@Injectable()
export class ImprestService {
  private readonly TABLE = 'imprest_transactions';

  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, dto: CreateImprestDto) {
    const { data, error } = await this.supabase.db
      .from(this.TABLE)
      .insert({
        user_id: userId,
        date: dto.date,
        chq: dto.chq ?? null,
        invoice: dto.invoice ?? null,
        payee: dto.payee,
        details: dto.details,
        category: dto.category,
        amount: dto.amount,
        tx_type: dto.txType ?? 'payment',
        period: dto.period,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAll(userId: string, query: ImprestQueryDto) {
    let q = this.supabase.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (query.period)   q = q.eq('period', query.period);
    if (query.category) q = q.eq('category', query.category);
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

    if (error || !data) throw new NotFoundException(`Imprest transaction ${id} not found`);
    return data;
  }

  async update(userId: string, id: string, dto: UpdateImprestDto) {
    await this.findOne(userId, id);
    const update: Record<string, any> = {};
    if (dto.date !== undefined)     update.date     = dto.date;
    if (dto.chq !== undefined)      update.chq      = dto.chq;
    if (dto.invoice !== undefined)  update.invoice  = dto.invoice;
    if (dto.payee !== undefined)    update.payee    = dto.payee;
    if (dto.details !== undefined)  update.details  = dto.details;
    if (dto.category !== undefined) update.category = dto.category;
    if (dto.amount !== undefined)   update.amount   = dto.amount;
    if (dto.txType !== undefined)   update.tx_type  = dto.txType;
    if (dto.period !== undefined)   update.period   = dto.period;

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
    return { message: 'Transaction deleted' };
  }

  async summary(userId: string, period?: string) {
    let q = this.supabase.db
      .from(this.TABLE)
      .select('category, amount, tx_type')
      .eq('user_id', userId);

    if (period) q = q.eq('period', period);
    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const result = {
      totalPayments: 0,
      totalReceipts: 0,
      netCash: 0,
      byCategory: {} as Record<string, number>,
    };

    for (const row of data) {
      const amt = Number(row.amount);
      if (row.tx_type === 'payment') result.totalPayments += amt;
      else result.totalReceipts += amt;
      result.byCategory[row.category] = (result.byCategory[row.category] ?? 0) + amt;
    }
    result.netCash = result.totalReceipts - result.totalPayments;
    return result;
  }
}
