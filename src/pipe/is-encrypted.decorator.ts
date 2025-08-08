import 'reflect-metadata'; // Required for Reflect.defineMetadata

export const IS_ENCRYPTED_KEY = 'isEncrypted';

/**
 * DTO의 특정 필드가 암호화된 필드임을 나타내는 데코레이터입니다.
 * 이 데코레이터가 적용된 필드는 DecryptionInterceptor에 의해 자동으로 복호화됩니다.
 */
export function IsEncrypted(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    Reflect.defineMetadata(IS_ENCRYPTED_KEY, true, target, propertyKey);
  };
}