/**
 * Minimal hand-written Supabase database types.
 * Re-generate with `supabase gen types typescript` once the project is linked.
 */
export type Database = {
  public: {
    Tables: {
      journal_entries: {
        Row: JournalEntry;
        Insert: Omit<JournalEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<JournalEntry, 'id' | 'created_at'>>;
      };
      imprest_transactions: {
        Row: ImprestTransaction;
        Insert: Omit<ImprestTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<ImprestTransaction, 'id' | 'created_at'>>;
      };
      production_entries: {
        Row: ProductionEntry;
        Insert: Omit<ProductionEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<ProductionEntry, 'id' | 'created_at'>>;
      };
      ar_entries: {
        Row: ArEntry;
        Insert: Omit<ArEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<ArEntry, 'id' | 'created_at'>>;
      };
      bank_transactions: {
        Row: BankTransaction;
        Insert: Omit<BankTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<BankTransaction, 'id' | 'created_at'>>;
      };
      tb_adjustments: {
        Row: TbAdjustment;
        Insert: Omit<TbAdjustment, 'id' | 'created_at'>;
        Update: Partial<Omit<TbAdjustment, 'id' | 'created_at'>>;
      };
    };
  };
};

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  ref: string;
  particulars: string;
  dr_account: string;
  cr_account: string;
  amount: number;
  entry_type: 'journal' | 'adjustment' | 'correction';
  narration: string | null;
  period: string;
  created_at: string;
}

export interface ImprestTransaction {
  id: string;
  user_id: string;
  date: string;
  chq: string | null;
  invoice: string | null;
  payee: string;
  details: string;
  category: string;
  amount: number;
  tx_type: 'payment' | 'receipt';
  period: string;
  created_at: string;
}

export interface ProductionEntry {
  id: string;
  user_id: string;
  date: string;
  ref: string | null;
  insurer: string;
  insurer_other: string | null;
  product: string;
  period: string;
  premium: number | null;
  commission: number;
  client: string | null;
  created_at: string;
}

export interface ArEntry {
  id: string;
  user_id: string;
  date: string;
  client: string;
  insurer: string | null;
  product: string;
  currency: 'GH¢' | 'USD' | 'EUR' | 'GBP';
  fx_rate: number;
  sum_insured: number | null;
  premium: number;
  commission: number | null;
  outstanding_balance: number;
  status: 'Pending' | 'Partial' | 'Collected' | 'Disputed';
  created_at: string;
}

export interface BankTransaction {
  id: string;
  user_id: string;
  date: string;
  account: string;
  currency: 'GH¢' | 'USD' | 'EUR';
  fx_rate: number;
  amount_foreign: number;
  amount_ghc: number;
  tx_type: 'Credit (Deposit)' | 'Debit (Withdrawal)' | 'Bank Charge' | 'Interest Charged';
  ref: string | null;
  notes: string | null;
  period: string;
  created_at: string;
}

export interface TbAdjustment {
  id: string;
  user_id: string;
  particulars: string;
  debit: number | null;
  credit: number | null;
  period: '2026' | '2025' | 'Both';
  adj_type: 'Audit Adjustment' | 'Journal Entry' | 'Reclassification' | 'Accrual';
  notes: string | null;
  created_at: string;
}
