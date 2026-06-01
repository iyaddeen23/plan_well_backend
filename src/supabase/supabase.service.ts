import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  // Using `any` generic so table .from() calls resolve without requiring
  // exact Database type matching (the DB types file is still useful for
  // documentation and manual type narrowing).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: SupabaseClient<any>;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const key = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get db(): SupabaseClient<any> {
    return this.client;
  }

  /** Verify a user JWT issued by Supabase Auth and return the user, or null. */
  async getUser(jwt: string) {
    const { data, error } = await this.client.auth.getUser(jwt);
    if (error) return null;
    return data.user;
  }
}
