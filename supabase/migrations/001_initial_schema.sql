-- ============================================================
--  Planwell Accounting — Initial Supabase Schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
--  or via: supabase db push
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
--  1. JOURNAL ENTRIES
-- ============================================================
create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  ref         text not null,
  particulars text not null,
  dr_account  text not null,
  cr_account  text not null,
  amount      numeric(15,2) not null check (amount > 0),
  entry_type  text not null default 'journal'
                check (entry_type in ('journal','adjustment','correction')),
  narration   text,
  period      text not null,
  created_at  timestamptz not null default now()
);

-- Row-Level Security
alter table public.journal_entries enable row level security;

create policy "Users see own journal entries"
  on public.journal_entries for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_journal_user_date on public.journal_entries(user_id, date desc);
create index idx_journal_period    on public.journal_entries(user_id, period);


-- ============================================================
--  2. IMPREST TRANSACTIONS
-- ============================================================
create table if not exists public.imprest_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  chq        text,
  invoice    text,
  payee      text not null,
  details    text not null,
  category   text not null,
  amount     numeric(15,2) not null check (amount > 0),
  tx_type    text not null default 'payment'
               check (tx_type in ('payment','receipt')),
  period     text not null,
  created_at timestamptz not null default now()
);

alter table public.imprest_transactions enable row level security;

create policy "Users see own imprest transactions"
  on public.imprest_transactions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_imprest_user_date on public.imprest_transactions(user_id, date desc);
create index idx_imprest_period    on public.imprest_transactions(user_id, period);


-- ============================================================
--  3. PRODUCTION ENTRIES
-- ============================================================
create table if not exists public.production_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  ref           text,
  insurer       text not null,
  insurer_other text,
  product       text not null,
  period        text not null,
  premium       numeric(15,2),
  commission    numeric(15,2) not null check (commission > 0),
  client        text,
  created_at    timestamptz not null default now()
);

alter table public.production_entries enable row level security;

create policy "Users see own production entries"
  on public.production_entries for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_production_user_date    on public.production_entries(user_id, date desc);
create index idx_production_period       on public.production_entries(user_id, period);
create index idx_production_insurer      on public.production_entries(user_id, insurer);


-- ============================================================
--  4. ACCOUNTS RECEIVABLE
-- ============================================================
create table if not exists public.ar_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  date                date not null,
  client              text not null,
  insurer             text,
  product             text not null,
  currency            text not null default 'GH¢'
                        check (currency in ('GH¢','USD','EUR','GBP')),
  fx_rate             numeric(12,4) not null default 1,
  sum_insured         numeric(15,2),
  premium             numeric(15,2) not null,
  commission          numeric(15,2),
  outstanding_balance numeric(15,2) not null,
  status              text not null default 'Pending'
                        check (status in ('Pending','Partial','Collected','Disputed')),
  created_at          timestamptz not null default now()
);

alter table public.ar_entries enable row level security;

create policy "Users see own AR entries"
  on public.ar_entries for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_ar_user_date   on public.ar_entries(user_id, date desc);
create index idx_ar_status      on public.ar_entries(user_id, status);
create index idx_ar_client      on public.ar_entries(user_id, client);


-- ============================================================
--  5. BANK TRANSACTIONS
-- ============================================================
create table if not exists public.bank_transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           date not null,
  account        text not null,
  currency       text not null default 'GH¢'
                   check (currency in ('GH¢','USD','EUR')),
  fx_rate        numeric(12,4) not null default 1,
  amount_foreign numeric(15,2) not null check (amount_foreign >= 0),
  amount_ghc     numeric(15,2) not null check (amount_ghc >= 0),
  tx_type        text not null
                   check (tx_type in ('Credit (Deposit)','Debit (Withdrawal)','Bank Charge','Interest Charged')),
  ref            text,
  notes          text,
  period         text not null,
  created_at     timestamptz not null default now()
);

alter table public.bank_transactions enable row level security;

create policy "Users see own bank transactions"
  on public.bank_transactions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_bank_user_date on public.bank_transactions(user_id, date desc);
create index idx_bank_account   on public.bank_transactions(user_id, account);
create index idx_bank_period    on public.bank_transactions(user_id, period);


-- ============================================================
--  6. TRIAL BALANCE ADJUSTMENTS
-- ============================================================
create table if not exists public.tb_adjustments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  particulars text not null,
  debit       numeric(15,2) check (debit >= 0),
  credit      numeric(15,2) check (credit >= 0),
  period      text not null default '2026'
                check (period in ('2026','2025','Both')),
  adj_type    text not null
                check (adj_type in ('Audit Adjustment','Journal Entry','Reclassification','Accrual')),
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.tb_adjustments enable row level security;

create policy "Users see own TB adjustments"
  on public.tb_adjustments for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_tb_user on public.tb_adjustments(user_id, created_at desc);


-- ============================================================
--  DONE — all tables created with RLS enabled
-- ============================================================
