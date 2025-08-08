import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CryptoService } from '../util/crypto.service';
import { IS_ENCRYPTED_KEY } from './is-encrypted.decorator';
import 'reflect-metadata';

@Injectable()
export class DecryptionInterceptor implements NestInterceptor {
  constructor(private readonly cryptoService: CryptoService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.recursivelyDecrypt(data)),
    );
  }

  private recursivelyDecrypt(data: any): any {
    // 배열인 경우, 각 항목에 대해 재귀적으로 복호화를 시도합니다.
    if (Array.isArray(data)) {
      return data.map((item) => this.recursivelyDecrypt(item));
    }

    // 객체가 아니거나 null인 경우, 그대로 반환합니다.
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    // 객체의 프로토타입을 가져옵니다. 클래스 인스턴스가 아니면 메타데이터를 확인할 수 없습니다.
    const prototype = Object.getPrototypeOf(data);
    if (!prototype) {
      return data; // 순수 객체(plain object)는 처리하지 않습니다.
    }

    // 객체의 모든 속성을 순회합니다.
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // `Reflect.getMetadata`를 사용해 속성에 @IsEncrypted 데코레이터가 있는지 확인합니다.
        const isEncrypted = Reflect.getMetadata(IS_ENCRYPTED_KEY, prototype, key);

        if (isEncrypted && typeof data[key] === 'string') {
          // 데코레이터가 있고, 값이 문자열이면 복호화합니다.
          data[key] = this.cryptoService.decrypt(data[key]);
        } else if (typeof data[key] === 'object') {
          // 속성 값이 또 다른 객체나 배열이면, 재귀적으로 처리합니다.
          this.recursivelyDecrypt(data[key]);
        }
      }
    }

    return data;
  }
}
