import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateArDto, UpdateArDto, ArQueryDto } from './dto/ar.dto';

@Injectable()
export class ArService {
  private readonly TABLE = 'ar_entries';

  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, dto: CreateArDto) {
    const { data, error } = await this.supabase.db
      .from(this.TABLE)
      .insert({
        user_id: userId,
        date: dto.date,
        client: dto.client,
        insurer: dto.insurer ?? null,
        product: dto.product,
        currency: dto.currency ?? 'GH¢',
        fx_rate: dto.fxRate ?? 1,
        sum_insured: dto.sumInsured ?? null,
        premium: dto.premium,
        commission: dto.commission ?? null,
        outstanding_balance: dto.outstandingBalance,
        status: dto.status ?? 'Pending',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAll(userId: string, query: ArQueryDto) {
    let q = this.supabase.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (query.client)  q = q.ilike('client', `%${query.client}%`);
    if (query.insurer) q = q.ilike('insurer', `%${query.insurer}%`);
    if (query.product) q = q.eq('product', query.product);
    if (query.status)  q = q.eq('status', query.status);
    if (query.from)    q = q.gte('date', query.from);
    if (query.to)      q = q.lte('date', query.to);

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

    if (error || !data) throw new NotFoundException(`AR entry ${id} not found`);
    return data;
  }

  async update(userId: string, id: string, dto: UpdateArDto) {
    await this.findOne(userId, id);
    const update: Record<string, any> = {};
    if (dto.date !== undefined)               update.date                = dto.date;
    if (dto.client !== undefined)             update.client              = dto.client;
    if (dto.insurer !== undefined)            update.insurer             = dto.insurer;
    if (dto.product !== undefined)            update.product             = dto.product;
    if (dto.currency !== undefined)           update.currency            = dto.currency;
    if (dto.fxRate !== undefined)             update.fx_rate             = dto.fxRate;
    if (dto.sumInsured !== undefined)         update.sum_insured         = dto.sumInsured;
    if (dto.premium !== undefined)            update.premium             = dto.premium;
    if (dto.commission !== undefined)         update.commission          = dto.commission;
    if (dto.outstandingBalance !== undefined) update.outstanding_balance = dto.outstandingBalance;
    if (dto.status !== undefined)             update.status              = dto.status;

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
    return { message: 'AR entry deleted' };
  }

  async summary(userId: string) {
    const { data, error } = await this.supabase.db
      .from(this.TABLE)
      .select('outstanding_balance, status, product')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    const result = {
      totalOutstanding: 0,
      byStatus: {} as Record<string, number>,
      byProduct: {} as Record<string, number>,
      count: data.length,
    };

    for (const row of data) {
      const b = Number(row.outstanding_balance);
      result.totalOutstanding += b;
      result.byStatus[row.status]   = (result.byStatus[row.status] ?? 0) + b;
      result.byProduct[row.product] = (result.byProduct[row.product] ?? 0) + b;
    }
    return result;
  }
}
