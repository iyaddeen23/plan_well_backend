import { Injectable, BadRequestException } from '@nestjs/common';

const FY = {
  comm:    925168,
  invest:  293885,
  exp:     1113248,
  products: [392063, 180912, 151793, 94760, 59554, 28411, 17140, 535],
  expenses: {
    sal: 332519, dir: 24000, mgmt: 69500, prof: 4828, print: 1405, comm2: 4740,
    util: 50770, levy: 27223, audit: 6000, fuel: 37410, trav: 3664, rep: 4606,
    rent: 60150, refresh: 18950, bank: 7559, office: 2560, biz: 153397, ins: 1050,
    fx: 183807, dep: 112860, amort: 6250,
  },
  insurers: {
    names:  ['Enterprise','Serene','Ent. Life','Provident','Allianz Life','Coronation','Vanguard','Phoenix','GLICO','State'],
    v2026:  [372254, 154725, 91579, 56050, 38755, 40947, 29673, 27877, 12833, 17715],
    v2025:  [2741, 0, 111065, 71358, 23419, 710841, 14917, 1146, 13238, 14178],
  },
  loan:         [47565, 49052, 50568, 52115, 53693, 55303, 56945, 58621, 60331, 62076, 63857, 65675],
  totalAssets:  1272084,
  totalEquity:  1112103,
  retainedEarningsOpen: -98567,
};

/** Prior-year (2025) figures for comparative statements */
const PRIOR_YEAR = {
  comm:   1082431,
  exp:    1089426,
  inv:    293885,
  fc:     53003,
  tx:     70996,
  net:    5628,
  opLoss: 1082431 - 1089426,
  pbit:   1082431 - 1089426 + 293885,
  /** Key ratios as reported in the 2025 audited financial statements */
  ratios: {
    npm:            '0.61',   // net profit margin %
    cti:            '117.8',  // cost-to-income %
    roa:            '8.21',   // return on assets %
    roe:            '0.50',   // return on equity %
    ic:             '0.11',   // interest cover ×
    revenueToStaff: '2.78',   // revenue / staff cost ×
    cr:             '2.77',   // current ratio ×
  },
};

/** Full statement of financial position — year-end 2026 balances */
const BALANCE_SHEET = {
  assets: {
    nonCurrent: {
      ppe:         72724,
      intangibles: 28750,
      total:       101474,
    },
    current: {
      rentPrepaid:        65000,
      commReceivable:     209821,  // commission receivable
      interestReceivable: 538089,  // fixed-deposit interest receivable
      tradeReceivables:   747910,  // sum of the two above
      deferredTax:        3308,
      taxAssets:          36000,
      cashAtBank:         354392,
      total:              1170610,
    },
    total: 1272084,
  },
  liabilities: {
    bankOverdraft:  260077,
    tradeCreditors: 103950,
    accruals:       18057,
    taxPayable:     39763,
    otherPayables:  675,
    total:          422522,
  },
  equity: {
    statedCapital: 1215994,
    retainedOpen:  -98567,
  },
  netCashPosition: 94315,
};

/** Loan details and accrued interest history */
const LOAN = {
  principal:      26780,
  annualRatePct:  20,
  monthlyRatePct: 20 / 12,
  penaltyPct:     2,
  startYear:      2022,
  history: {
    years:           ['2022', '2023', '2024', '2025'],
    accruedInterest: [9665,   9776,   12399,  15724],
  },
};

/** GRA CIT/WHT statement entries (documentary — actual Ghana Revenue Authority records) */
const TAX_STATEMENT = {
  cit2025: [
    { ref: '1',   date: '01 Jan 2025', description: 'CG Assessment 2025',            debit:  8843, credit: null, balance:  8843   },
    { ref: '2-10',date: 'Feb 2025',    description: 'WHT credits various payers',     debit:  1044, credit: null, balance:  7799   },
    { ref: '14',  date: '28 Feb 2025', description: 'WHT C0002862654',                debit:  1330, credit: null, balance:  6469   },
    { ref: '20',  date: '07 Apr 2025', description: 'Receipt payment',                debit:  2087, credit: null, balance:  4382   },
    { ref: '44',  date: '17 Apr 2025', description: 'WHT C0002862654 (large)',        debit:  2303, credit: null, balance: -3716   },
    { ref: '35',  date: '30 Sep 2025', description: 'WHT C0003168875',                debit:     4, credit: null, balance: -3.58   },
  ],
  cit2024: [
    { ref: '1',   date: '19 Feb 2024', description: 'WHT Credit C0003004783',         debit: null, credit:    23, balance:    -23  },
    { ref: '14',  date: '26 Apr 2024', description: 'Receipt Payment',                debit: null, credit:  4501, balance:  -6286  },
    { ref: '18',  date: '26 Jun 2025', description: 'Processed Returns 2024',         debit: null, credit: 25902, balance:  19413  },
    { ref: '22',  date: '16 Sep 2025', description: 'Receipt Payment',                debit: null, credit:  5911, balance:  12345  },
    { ref: '51',  date: '23 Oct 2025', description: 'WHT C0002718731',                debit: null, credit:   441, balance:  10982  },
    { ref: '52',  date: '03 Dec 2025', description: 'WHT C0002864959',                debit: null, credit:    69, balance:  10914  },
  ],
};

const QUARTERS: Record<string, { f: number; fc: number; tx: number; exchLoss: number; label: string; short: string }> = {
  q1: { f: 0.20, fc: 13251, tx: 14000, exchLoss: 32000,  label: 'Q1 2026 — Jan to Mar',       short: 'Q1 2026' },
  q2: { f: 0.28, fc: 13251, tx: 18500, exchLoss: 58000,  label: 'Q2 2026 — Apr to Jun',       short: 'Q2 2026' },
  q3: { f: 0.26, fc: 13251, tx: 17200, exchLoss: 49000,  label: 'Q3 2026 — Jul to Sep',       short: 'Q3 2026' },
  q4: { f: 0.26, fc: 13251, tx: 15342, exchLoss: 44807,  label: 'Q4 2026 — Oct to Dec',       short: 'Q4 2026' },
  fy: { f: 1.00, fc: 53003, tx: 65042, exchLoss: 183807, label: 'Full Year 2026 — Jan to Dec', short: 'Full Year 2026' },
};

const SIX_YEARS = {
  years: ['2021','2022','2023','2024','2025','2026'],
  comm:  [512400,648300,782500,875200,1082431,925168],
  exp:   [498000,620000,740000,830000,1089426,1113248],
  inv:   [82000,110000,145000,198000,293885,293885],
  net:   [42000,58200,78000,95000,5628,-12240],
  cash:  [198000,215000,248000,301000,354000,354392],
};

const SIX_YTD = {
  years: ['2021','2022','2023','2024','2025','2026'],
  comm:  [209000,264800,319500,357250,441800,444081],
  exp:   [203000,253000,302000,338750,444800,555000],
  inv:   [33500,44900,59200,80900,120100,146860],
  net:   [17200,23700,31900,38800,2300,-22900],
  cash:  [182000,195000,224000,274000,320000,354392],
};

function sharedFields() {
  return {
    balanceSheet:  BALANCE_SHEET,
    loanSchedule:  FY.loan,
    loanHistory:   LOAN.history,
    loanDetails:   LOAN,
    taxStatement:  TAX_STATEMENT,
    priorYear:     PRIOR_YEAR,
    fyFc:          QUARTERS.fy.fc,
    fyTx:          QUARTERS.fy.tx,
    fyExch:        QUARTERS.fy.exchLoss,
    fyExpenses:    FY.expenses,
  };
}

@Injectable()
export class FinancialsService {
  getPeriods() {
    return {
      quarters: Object.entries(QUARTERS).map(([key, q]) => ({ key, label: q.label, short: q.short })),
      multiyear: [
        { key: '6y',   label: 'Last 6 Years 2021–2026' },
        { key: '6ytd', label: 'Last 6 Years YTD' },
      ],
    };
  }

  computePeriod(period: string) {
    if (period === '6y') {
      return { is6: true, period, label: 'Last 6 Years 2021–2026', data: SIX_YEARS, ...sharedFields() };
    }
    if (period === '6ytd') {
      return { is6: true, period, label: 'Last 6 Years YTD',        data: SIX_YTD,   ...sharedFields() };
    }

    const q = QUARTERS[period];
    if (!q) throw new BadRequestException(`Unknown period "${period}". Valid: q1, q2, q3, q4, fy, 6y, 6ytd`);

    const { f, fc, tx, exchLoss: exch } = q;
    const comm   = Math.round(FY.comm    * f);
    const inv    = Math.round(FY.invest  * f);
    const exp    = Math.round(FY.exp     * f);
    const totRev = comm + inv - exch;
    const opLoss = comm - exp;
    const pbit   = opLoss + inv;
    const pbt    = pbit - fc;
    const pat    = pbt  - tx;

    const E: Record<string, number> = {};
    for (const [k, v] of Object.entries(FY.expenses)) E[k] = Math.round(v * f);

    const products    = FY.products.map(v => Math.round(v * f));
    const insurerVals = FY.insurers.v2026.map(v => Math.round(v * f));

    const npm  = (pat  / comm                           * 100).toFixed(2);
    const cti  = (exp  / comm                           * 100).toFixed(1);
    const roa  = (pbit / BALANCE_SHEET.assets.total     * 100).toFixed(2);
    const ic   = (pbit / fc).toFixed(2);
    const roe  = (pat  / FY.totalEquity                 * 100).toFixed(2);
    const at   = (comm / BALANCE_SHEET.assets.total).toFixed(3);
    const cr   = (BALANCE_SHEET.assets.current.total / BALANCE_SHEET.liabilities.total).toFixed(2);
    const reClose = FY.retainedEarningsOpen + pat;

    return {
      is6: false, period,
      label:       q.short,
      periodLabel: q.label,
      factor:      f,
      income:      { comm, inv, exch, totRev },
      profitLoss:  { opLoss, pbit, pbt, pat, fc, tx },
      expenses:    E,
      products,
      insurers: {
        names:      FY.insurers.names,
        values2026: insurerVals,
        values2025: FY.insurers.v2025.map(v => Math.round(v * f)),
      },
      ratios:      { npm, cti, roa, ic, roe, at, cr },
      equity:      { retainedOpen: FY.retainedEarningsOpen, pat, retainedClose: reClose },
      ...sharedFields(),
    };
  }

  getInsurers() {
    return {
      names:      FY.insurers.names,
      values2026: FY.insurers.v2026,
      values2025: FY.insurers.v2025,
    };
  }

  getExpenseBreakdown(period = 'fy') {
    const q = QUARTERS[period];
    if (!q) throw new BadRequestException(`Unknown period "${period}"`);
    const f = q.f;
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(FY.expenses)) result[k] = Math.round(v * f);
    return { period, factor: f, expenses: result, total: Object.values(result).reduce((a, b) => a + b, 0) };
  }
}
