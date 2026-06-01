import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SignUpDto, SignInDto, RefreshTokenDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async signUp(dto: SignUpDto) {
    const { data, error } = await this.supabase.db.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      user_metadata: { full_name: dto.fullName ?? '' },
      email_confirm: true, // auto-confirm for internal tool
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new ConflictException('A user with this email already exists');
      }
      throw new ConflictException(error.message);
    }

    return { message: 'User created successfully', userId: data.user.id };
  }

  async signIn(dto: SignInDto) {
    const { data, error } = await this.supabase.db.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session) throw new UnauthorizedException('Invalid email or password');

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name ?? '',
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const { data, error } = await this.supabase.db.auth.refreshSession({
      refresh_token: dto.refreshToken,
    });

    if (error || !data.session) throw new UnauthorizedException('Invalid or expired refresh token');

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  }

  async signOut(token: string) {
    await this.supabase.db.auth.admin.signOut(token);
    return { message: 'Signed out successfully' };
  }

  async getProfile(userId: string) {
    const { data, error } = await this.supabase.db.auth.admin.getUserById(userId);
    if (error) throw new UnauthorizedException();
    return {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name ?? '',
      createdAt: data.user.created_at,
    };
  }
}
