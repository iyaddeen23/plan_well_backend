import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTbDto, UpdateTbDto, TbQueryDto } from './dto/trial-balance.dto';

@Injectable()
export class TrialBalanceService {
  private readonly TABLE = 'tb_adjustments';

  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, dto: CreateTbDto) {
    const { data, error } = await this.supabase.db
      .from(this.TABLE)
      .insert({
        user_id: userId,
        particulars: dto.particulars,
        debit: dto.debit ?? null,
        credit: dto.credit ?? null,
        period: dto.period ?? '2026',
        adj_type: dto.adjType,
        notes: dto.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAll(userId: string, query: TbQueryDto) {
    let q = this.supabase.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (query.period)  q = q.eq('period', query.period);
    if (query.adjType) q = q.eq('adj_type', query.adjType);

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

    if (error || !data) throw new NotFoundException(`TB adjustment ${id} not found`);
    return data;
  }

  async update(userId: string, id: string, dto: UpdateTbDto) {
    await this.findOne(userId, id);
    const update: Record<string, any> = {};
    if (dto.particulars !== undefined) update.particulars = dto.particulars;
    if (dto.debit !== undefined)       update.debit       = dto.debit;
    if (dto.credit !== undefined)      update.credit      = dto.credit;
    if (dto.period !== undefined)      update.period      = dto.period;
    if (dto.adjType !== undefined)     update.adj_type    = dto.adjType;
    if (dto.notes !== undefined)       update.notes       = dto.notes;

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
    return { message: 'TB adjustment deleted' };
  }

  async balanceCheck(userId: string) {
    const { data, error } = await this.supabase.db
      .from(this.TABLE)
      .select('debit, credit, adj_type')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    let totalDebits = 0;
    let totalCredits = 0;
    const byType: Record<string, number> = {};

    for (const row of data) {
      totalDebits  += Number(row.debit ?? 0);
      totalCredits += Number(row.credit ?? 0);
      byType[row.adj_type] = (byType[row.adj_type] ?? 0) + 1;
    }

    return {
      totalAdjustments: data.length,
      totalDebits,
      totalCredits,
      difference: totalDebits - totalCredits,
      balanced: Math.abs(totalDebits - totalCredits) < 0.01,
      byType,
    };
  }
}
