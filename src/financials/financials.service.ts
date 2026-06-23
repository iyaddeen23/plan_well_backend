import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/** Maps every API period key to the DB `period` values it covers. */
const PERIOD_MONTHS: Record<string, string[]> = {
  jan: ['jan'], feb: ['feb'], mar: ['mar'],
  apr: ['apr'], may: ['may'], jun: ['jun'],
  jul: ['jul'], aug: ['aug'], sep: ['sep'],
  oct: ['oct'], nov: ['nov'], dec: ['dec'],
  q1:  ['jan', 'feb', 'mar'],
  q2:  ['apr', 'may', 'jun'],
  q3:  ['jul', 'aug', 'sep'],
  q4:  ['oct', 'nov', 'dec'],
  fy:  ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],
};

const PERIOD_META: Record<string, { label: string; short: string }> = {
  jan: { short: 'Jan 2026',        label: 'January 2026'              },
  feb: { short: 'Feb 2026',        label: 'February 2026'             },
  mar: { short: 'Mar 2026',        label: 'March 2026'                },
  apr: { short: 'Apr 2026',        label: 'April 2026'                },
  may: { short: 'May 2026',        label: 'May 2026'                  },
  jun: { short: 'Jun 2026',        label: 'June 2026'                 },
  jul: { short: 'Jul 2026',        label: 'July 2026'                 },
  aug: { short: 'Aug 2026',        label: 'August 2026'               },
  sep: { short: 'Sep 2026',        label: 'September 2026'            },
  oct: { short: 'Oct 2026',        label: 'October 2026'              },
  nov: { short: 'Nov 2026',        label: 'November 2026'             },
  dec: { short: 'Dec 2026',        label: 'December 2026'             },
  q1:  { short: 'Q1 2026',         label: 'Q1 2026 — Jan to Mar'      },
  q2:  { short: 'Q2 2026',         label: 'Q2 2026 — Apr to Jun'      },
  q3:  { short: 'Q3 2026',         label: 'Q3 2026 — Jul to Sep'      },
  q4:  { short: 'Q4 2026',         label: 'Q4 2026 — Oct to Dec'      },
  fy:  { short: 'Full Year 2026',  label: 'Full Year 2026 — Jan to Dec' },
};

const MONTHS_LIST = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

/** Date boundaries for each period key (2026). Used for date-range queries
 *  on tables whose `period` column may store free-form values (e.g. bank_transactions). */
const PERIOD_DATES: Record<string, { from: string; to: string }> = {
  jan: { from: '2026-01-01', to: '2026-01-31' },
  feb: { from: '2026-02-01', to: '2026-02-28' },
  mar: { from: '2026-03-01', to: '2026-03-31' },
  apr: { from: '2026-04-01', to: '2026-04-30' },
  may: { from: '2026-05-01', to: '2026-05-31' },
  jun: { from: '2026-06-01', to: '2026-06-30' },
  jul: { from: '2026-07-01', to: '2026-07-31' },
  aug: { from: '2026-08-01', to: '2026-08-31' },
  sep: { from: '2026-09-01', to: '2026-09-30' },
  oct: { from: '2026-10-01', to: '2026-10-31' },
  nov: { from: '2026-11-01', to: '2026-11-30' },
  dec: { from: '2026-12-01', to: '2026-12-31' },
  q1:  { from: '2026-01-01', to: '2026-03-31' },
  q2:  { from: '2026-04-01', to: '2026-06-30' },
  q3:  { from: '2026-07-01', to: '2026-09-30' },
  q4:  { from: '2026-10-01', to: '2026-12-31' },
  fy:  { from: '2026-01-01', to: '2026-12-31' },
};

@Injectable()
export class FinancialsService {
  constructor(private readonly supabase: SupabaseService) {}

  getPeriods() {
    return {
      months:    MONTHS_LIST.map(k => ({ key: k, ...PERIOD_META[k] })),
      quarters:  ['q1','q2','q3','q4','fy'].map(k => ({ key: k, ...PERIOD_META[k] })),
      multiyear: [
        { key: '6y',   label: 'Last 6 Years 2021–2026' },
        { key: '6ytd', label: 'Last 6 Years YTD' },
      ],
    };
  }

  async computePeriod(userId: string, period: string) {
    if (period === '6y')   return this.compute6y(userId);
    if (period === '6ytd') return this.compute6ytd(userId);

    const dbPeriods = PERIOD_MONTHS[period];
    if (!dbPeriods) throw new BadRequestException(
      `Unknown period "${period}". Valid: jan–dec, q1, q2, q3, q4, fy, 6y, 6ytd`,
    );

    const meta = PERIOD_META[period];
    const dateBounds = PERIOD_DATES[period];

    // Fetch all source tables in parallel
    const [prodRows, imprestRows, jrnRows, bankRows, arRows] = await Promise.all([
      this.supabase.db
        .from('production_entries')
        .select('commission, product, insurer')
        .eq('user_id', userId)
        .in('period', dbPeriods)
        .then(r => { if (r.error) throw new Error(r.error.message); return r.data ?? []; }),

      this.supabase.db
        .from('imprest_transactions')
        .select('category, amount')
        .eq('user_id', userId)
        .eq('tx_type', 'payment')
        .in('period', dbPeriods)
        .then(r => { if (r.error) throw new Error(r.error.message); return r.data ?? []; }),

      this.supabase.db
        .from('journal_entries')
        .select('dr_account, cr_account, amount')
        .eq('user_id', userId)
        .in('period', dbPeriods)
        .then(r => { if (r.error) throw new Error(r.error.message); return r.data ?? []; }),

      // Use date-range filtering for bank_transactions so the result is correct
      // regardless of what period string format was stored in that column.
      this.supabase.db
        .from('bank_transactions')
        .select('tx_type, amount_ghc')
        .eq('user_id', userId)
        .gte('date', dateBounds.from)
        .lte('date', dateBounds.to)
        .then(r => { if (r.error) throw new Error(r.error.message); return r.data ?? []; }),

      this.supabase.db
        .from('ar_entries')
        .select('outstanding_balance')
        .eq('user_id', userId)
        .then(r => { if (r.error) throw new Error(r.error.message); return r.data ?? []; }),
    ]);

    // --- Commission income, product & insurer breakdown ---
    let comm = 0;
    const byProduct: Record<string, number> = {};
    const byInsurer: Record<string, number> = {};
    for (const row of prodRows) {
      const c = Number(row.commission);
      comm += c;
      byProduct[row.product] = (byProduct[row.product] ?? 0) + c;
      byInsurer[row.insurer] = (byInsurer[row.insurer] ?? 0) + c;
    }

    // --- Expenses from imprest payments, grouped by category ---
    const expByCategory: Record<string, number> = {};
    for (const row of imprestRows) {
      const a = Number(row.amount);
      expByCategory[row.category] = (expByCategory[row.category] ?? 0) + a;
    }

    // --- Journal entries: non-cash items & below-the-line figures ---
    // Matching against dr/cr account names — uses the naming conventions in the journal form.
    let inv = 0, fc = 0, exchLoss = 0, tx = 0;
    for (const row of jrnRows) {
      const dr  = (row.dr_account ?? '').toLowerCase();
      const cr  = (row.cr_account ?? '').toLowerCase();
      const amt = Number(row.amount);

      // Investment / interest income  →  cr account
      if (cr.includes('interest income') || cr.includes('investment income')) {
        inv += amt;
      }

      // Finance cost / loan interest  →  dr account
      if (dr.includes('finance cost') || dr.includes('interest expense') || dr.includes('loan interest')) {
        fc += amt;
      }

      // Exchange / forex loss  →  dr account
      if (dr.includes('exchange loss') || dr.includes('fx loss') || dr.includes('foreign exchange loss')) {
        exchLoss += amt;
      }

      // Income tax / current tax charge  →  dr account
      if (dr.includes('income tax') || dr.includes('tax expense') || dr.includes('current tax')) {
        tx += amt;
      }

      // Non-cash operating expenses (depreciation, amortisation)  →  dr account, added to expense pool
      if (dr.includes('depreciation') || dr.includes('amortis') || dr.includes('amortiz')) {
        expByCategory[row.dr_account] = (expByCategory[row.dr_account] ?? 0) + amt;
      }
    }

    const exp    = Object.values(expByCategory).reduce((s, v) => s + v, 0);
    const opLoss = comm - exp;
    const pbit   = opLoss + inv;
    const pbt    = pbit - fc;
    const pat    = pbt  - tx;

    // --- Cash position from bank transactions ---
    let cash = 0;
    for (const row of bankRows) {
      cash += row.tx_type === 'Credit (Deposit)' ? Number(row.amount_ghc) : -Number(row.amount_ghc);
    }

    // --- Commission receivable from AR ---
    const commReceivable = arRows.reduce((s, r) => s + Number(r.outstanding_balance), 0);

    // --- Ratios (guard against division by zero) ---
    const npm = comm ? ((pat  / comm) * 100).toFixed(2) : '0.00';
    const cti = comm ? ((exp  / comm) * 100).toFixed(1) : '0.0';
    const ic  = fc   ? (pbit / fc).toFixed(2)           : '0.00';

    const balanceSheet = {
      assets: {
        nonCurrent: { ppe: 0, intangibles: 0, total: 0 },
        current: {
          commReceivable,
          cashAtBank: Math.max(cash, 0),
          total: commReceivable + Math.max(cash, 0),
        },
        total: commReceivable + Math.max(cash, 0),
      },
      liabilities: {
        bankOverdraft: cash < 0 ? Math.abs(cash) : 0,
        total:         cash < 0 ? Math.abs(cash) : 0,
      },
      equity:          { statedCapital: 0, retainedOpen: 0 },
      netCashPosition: cash,
    };

    return {
      is6:         false,
      period,
      label:       meta.short,
      periodLabel: meta.label,
      factor:      1,
      income:      { comm, inv, exch: exchLoss, totRev: comm + inv - exchLoss },
      profitLoss:  { opLoss, pbit, pbt, pat, fc, tx },
      expenses:    expByCategory,
      expTotal:    exp,
      products:    byProduct,
      insurers:    byInsurer,
      ratios:      { npm, cti, ic, roa: '0.00', roe: '0.00', at: '0.000', cr: '0.00' },
      equity:      { retainedOpen: 0, pat, retainedClose: pat },
      balanceSheet,
      priorYear:     null,
      loanSchedule:  [],
      loanHistory:   { years: [], accruedInterest: [] },
      loanDetails:   {},
      taxStatement:  { cit2025: [], cit2024: [] },
      fyFc:          0,
      fyTx:          0,
      fyExch:        0,
      fyExpenses:    {},
    };
  }

  async getInsurers(userId: string) {
    const year  = new Date().getFullYear();
    const prior = year - 1;

    const query = (from: string, to: string) =>
      this.supabase.db
        .from('production_entries')
        .select('insurer, commission')
        .eq('user_id', userId)
        .gte('date', from)
        .lte('date', to)
        .then(r => r.data ?? []);

    const [currRows, priorRows] = await Promise.all([
      query(`${year}-01-01`,  `${year}-12-31`),
      query(`${prior}-01-01`, `${prior}-12-31`),
    ]);

    const agg = (rows: any[]) => {
      const m: Record<string, number> = {};
      for (const r of rows) m[r.insurer] = (m[r.insurer] ?? 0) + Number(r.commission);
      return m;
    };

    return { [year]: agg(currRows), [prior]: agg(priorRows) };
  }

  async getExpenseBreakdown(userId: string, period = 'fy') {
    const dbPeriods = PERIOD_MONTHS[period];
    if (!dbPeriods) throw new BadRequestException(`Unknown period "${period}"`);

    const { data, error } = await this.supabase.db
      .from('imprest_transactions')
      .select('category, amount')
      .eq('user_id', userId)
      .eq('tx_type', 'payment')
      .in('period', dbPeriods);

    if (error) throw new Error(error.message);

    const expenses: Record<string, number> = {};
    for (const row of data ?? []) {
      expenses[row.category] = (expenses[row.category] ?? 0) + Number(row.amount);
    }
    const total = Object.values(expenses).reduce((s, v) => s + v, 0);
    return { period, expenses, total };
  }

  // ─── Multi-year helpers ───────────────────────────────────────────────────

  private async compute6y(userId: string) {
    const years = [2021, 2022, 2023, 2024, 2025, 2026];
    const rows  = await Promise.all(years.map(yr => this.yearSummary(userId, yr)));
    return {
      is6: true, period: '6y', label: 'Last 6 Years 2021–2026',
      data: {
        years: years.map(String),
        comm:  rows.map(r => r.comm),
        exp:   rows.map(r => r.exp),
        inv:   rows.map(r => r.inv),
        net:   rows.map(r => r.net),
        cash:  rows.map(r => r.cash),
      },
      ...this.emptyShared(),
    };
  }

  private async compute6ytd(userId: string) {
    const years  = [2021, 2022, 2023, 2024, 2025, 2026];
    const today  = new Date();
    const mmdd   = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const rows   = await Promise.all(years.map(yr => this.yearSummary(userId, yr, `${yr}-${mmdd}`)));
    return {
      is6: true, period: '6ytd', label: 'Last 6 Years YTD',
      data: {
        years: years.map(String),
        comm:  rows.map(r => r.comm),
        exp:   rows.map(r => r.exp),
        inv:   rows.map(r => r.inv),
        net:   rows.map(r => r.net),
        cash:  rows.map(r => r.cash),
      },
      ...this.emptyShared(),
    };
  }

  /** Shared fields returned on every response so the frontend never reads undefined. */
  private emptyShared() {
    return {
      balanceSheet: {
        assets: {
          nonCurrent: { ppe: 0, intangibles: 0, total: 0 },
          current:    { commReceivable: 0, cashAtBank: 0, total: 0 },
          total: 0,
        },
        liabilities: { bankOverdraft: 0, total: 0 },
        equity:      { statedCapital: 0, retainedOpen: 0 },
        netCashPosition: 0,
      },
      priorYear:    null,
      loanSchedule: [],
      loanHistory:  { years: [], accruedInterest: [] },
      loanDetails:  {},
      taxStatement: { cit2025: [], cit2024: [] },
      fyFc:         0,
      fyTx:         0,
      fyExch:       0,
      fyExpenses:   {},
    };
  }

  private async yearSummary(userId: string, year: number, toDate?: string) {
    const from = `${year}-01-01`;
    const to   = toDate ?? `${year}-12-31`;

    const [prodData, imprestData, jrnData, bankData] = await Promise.all([
      this.supabase.db.from('production_entries')
        .select('commission').eq('user_id', userId).gte('date', from).lte('date', to)
        .then(r => r.data ?? []),

      this.supabase.db.from('imprest_transactions')
        .select('amount').eq('user_id', userId).eq('tx_type', 'payment').gte('date', from).lte('date', to)
        .then(r => r.data ?? []),

      this.supabase.db.from('journal_entries')
        .select('dr_account, cr_account, amount').eq('user_id', userId).gte('date', from).lte('date', to)
        .then(r => r.data ?? []),

      this.supabase.db.from('bank_transactions')
        .select('tx_type, amount_ghc').eq('user_id', userId).gte('date', from).lte('date', to)
        .then(r => r.data ?? []),
    ]);

    const comm = prodData.reduce((s, r) => s + Number(r.commission), 0);
    const exp  = imprestData.reduce((s, r) => s + Number(r.amount), 0);

    let inv = 0, fc = 0, tx = 0, exchLoss = 0;
    for (const row of jrnData) {
      const dr  = (row.dr_account ?? '').toLowerCase();
      const cr  = (row.cr_account ?? '').toLowerCase();
      const amt = Number(row.amount);
      if (cr.includes('interest income') || cr.includes('investment income')) inv += amt;
      if (dr.includes('finance cost')    || dr.includes('interest expense'))  fc  += amt;
      if (dr.includes('income tax')      || dr.includes('tax expense'))       tx  += amt;
      if (dr.includes('exchange loss')   || dr.includes('fx loss'))           exchLoss += amt;
    }

    let cash = 0;
    for (const row of bankData) {
      cash += row.tx_type === 'Credit (Deposit)' ? Number(row.amount_ghc) : -Number(row.amount_ghc);
    }

    const net = comm + inv - exchLoss - exp - fc - tx;
    return { comm, exp, inv, net, cash };
  }
}
