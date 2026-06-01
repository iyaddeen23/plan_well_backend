import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req: any = context.switchToHttp().getRequest();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('No bearer token provided');

    const user = await this.supabase.getUser(token);
    if (!user) throw new UnauthorizedException('Invalid or expired token');

    req.user = user;
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractToken(req: any): string | null {
    const auth: string | undefined = req.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
