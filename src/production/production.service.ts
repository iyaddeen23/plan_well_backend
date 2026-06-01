import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductionDto, UpdateProductionDto, ProductionQueryDto } from './dto/production.dto';

@Injectable()
export class ProductionService {
  private readonly TABLE = 'production_entries';

  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, dto: CreateProductionDto) {
    const { data, error } = await this.supabase.db
      .from(this.TABLE)
      .insert({
        user_id: userId,
        date: dto.date,
        ref: dto.ref ?? null,
        insurer: dto.insurer,
        insurer_other: dto.insurerOther ?? null,
        product: dto.product,
        period: dto.period,
        premium: dto.premium ?? null,
        commission: dto.commission,
        client: dto.client ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAll(userId: string, query: ProductionQueryDto) {
    let q = this.supabase.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (query.period)  q = q.eq('period', query.period);
    if (query.insurer) q = q.eq('insurer', query.insurer);
    if (query.product) q = q.eq('product', query.product);
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

    if (error || !data) throw new NotFoundException(`Production entry ${id} not found`);
    return data;
  }

  async update(userId: string, id: string, dto: UpdateProductionDto) {
    await this.findOne(userId, id);
    const update: Record<string, any> = {};
    if (dto.date !== undefined)         update.date          = dto.date;
    if (dto.ref !== undefined)          update.ref           = dto.ref;
    if (dto.insurer !== undefined)      update.insurer       = dto.insurer;
    if (dto.insurerOther !== undefined) update.insurer_other = dto.insurerOther;
    if (dto.product !== undefined)      update.product       = dto.product;
    if (dto.period !== undefined)       update.period        = dto.period;
    if (dto.premium !== undefined)      update.premium       = dto.premium;
    if (dto.commission !== undefined)   update.commission    = dto.commission;
    if (dto.client !== undefined)       update.client        = dto.client;

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
    return { message: 'Production entry deleted' };
  }

  async summary(userId: string, period?: string) {
    let q = this.supabase.db
      .from(this.TABLE)
      .select('insurer, product, commission')
      .eq('user_id', userId);

    if (period) q = q.eq('period', period);
    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const byInsurer: Record<string, number> = {};
    const byProduct: Record<string, number> = {};
    let totalCommission = 0;

    for (const row of data) {
      const c = Number(row.commission);
      totalCommission += c;
      byInsurer[row.insurer] = (byInsurer[row.insurer] ?? 0) + c;
      byProduct[row.product] = (byProduct[row.product] ?? 0) + c;
    }

    return { totalCommission, totalEntries: data.length, byInsurer, byProduct };
  }
}
