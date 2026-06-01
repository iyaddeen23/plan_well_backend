import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateJournalDto, UpdateJournalDto, JournalQueryDto } from './dto/journal.dto';

@Injectable()
export class JournalService {
  private readonly TABLE = 'journal_entries';

  constructor(private readonly supabase: SupabaseService) {}

  async create(userId: string, dto: CreateJournalDto) {
    const { data, error } = await this.supabase.db
      .from(this.TABLE)
      .insert({
        user_id: userId,
        date: dto.date,
        ref: dto.ref,
        particulars: dto.particulars,
        dr_account: dto.drAccount,
        cr_account: dto.crAccount,
        amount: dto.amount,
        entry_type: dto.entryType ?? 'journal',
        narration: dto.narration ?? null,
        period: dto.period,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAll(userId: string, query: JournalQueryDto) {
    let q = this.supabase.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (query.period)    q = q.eq('period', query.period);
    if (query.entryType) q = q.eq('entry_type', query.entryType);
    if (query.from)      q = q.gte('date', query.from);
    if (query.to)        q = q.lte('date', query.to);

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

    if (error || !data) throw new NotFoundException(`Journal entry ${id} not found`);
    return data;
  }

  async update(userId: string, id: string, dto: UpdateJournalDto) {
    await this.findOne(userId, id); // ensure ownership
    const update: Record<string, any> = {};
    if (dto.date)       update.date        = dto.date;
    if (dto.ref)        update.ref         = dto.ref;
    if (dto.particulars) update.particulars = dto.particulars;
    if (dto.drAccount)  update.dr_account  = dto.drAccount;
    if (dto.crAccount)  update.cr_account  = dto.crAccount;
    if (dto.amount)     update.amount      = dto.amount;
    if (dto.entryType)  update.entry_type  = dto.entryType;
    if (dto.narration !== undefined) update.narration = dto.narration;
    if (dto.period)     update.period      = dto.period;

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
    return { message: 'Journal entry deleted' };
  }

  async summary(userId: string, period?: string) {
    let q = this.supabase.db
      .from(this.TABLE)
      .select('entry_type, amount')
      .eq('user_id', userId);

    if (period) q = q.eq('period', period);
    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const result = { totalEntries: data.length, totalAmount: 0, byType: {} as Record<string, number> };
    for (const row of data) {
      result.totalAmount += Number(row.amount);
      result.byType[row.entry_type] = (result.byType[row.entry_type] ?? 0) + 1;
    }
    return result;
  }
}
