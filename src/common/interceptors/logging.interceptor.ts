import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req   = context.switchToHttp().getRequest();
    const { method, url } = req;
    const userId = req.user?.id ? ` [${req.user.id.slice(0, 8)}…]` : '';
    const start  = Date.now();

    return next.handle().pipe(
      tap(() => {
        const status = context.switchToHttp().getResponse().statusCode;
        const ms     = Date.now() - start;
        this.logger.log(`${method} ${url}${userId} → ${status}  +${ms}ms`);
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        this.logger.error(`${method} ${url}${userId} → ERROR  +${ms}ms  ${err.message}`);
        return throwError(() => err);
      }),
    );
  }
}
