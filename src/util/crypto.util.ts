import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const ENCRYPTION_PREFIX = 'enc::';

/**
 * 문자열을 암호화합니다.
 * AES-256-CBC 알고리즘을 사용하며, 결과물은 'enc::[iv]:[encrypted_text]' 형식의 문자열입니다.
 * @param text 암호화할 평문
 * @param secretKey 32바이트 비밀 키
 * @returns 암호화된 문자열
 */
export function encrypt(text: string, secretKey: string): string {
  if (text.startsWith(ENCRYPTION_PREFIX)) {
    // 이미 암호화된 데이터는 다시 암호화하지 않음
    return text;
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${ENCRYPTION_PREFIX}${iv.toString('hex')}:${encrypted}`;
}

/**
 * 암호화된 문자열을 복호화합니다.
 * 'enc::' 접두사를 확인하여 암호화된 데이터인지 판별하고, 평문은 그대로 반환합니다.
 * @param encryptedText 복호화할 암호화된 문자열
 * @param secretKey 32바이트 비밀 키
 * @returns 복호화된 평문 또는 원본 문자열
 */
export function decrypt(encryptedText: string, secretKey: string): string {
  if (!encryptedText || !encryptedText.startsWith(ENCRYPTION_PREFIX)) {
    // 접두사가 없으면 평문으로 간주하고 그대로 반환
    return encryptedText;
  }

  try {
    const textParts = encryptedText.substring(ENCRYPTION_PREFIX.length).split(':');
    const ivString = textParts.shift();

    if (!ivString) {
      console.error('Decryption failed: IV is missing in', encryptedText);
      return encryptedText;
    }

    const iv = Buffer.from(ivString, 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // 복호화 실패 시 (e.g., 잘못된 키, 깨진 데이터) 원본 데이터를 반환하거나 에러 처리를 할 수 있습니다.
    // 여기서는 원본을 반환하여 기존 평문 데이터와의 호환성을 유지합니다.
    console.error('Decryption failed for:', encryptedText, error);
    return encryptedText;
  }
}
