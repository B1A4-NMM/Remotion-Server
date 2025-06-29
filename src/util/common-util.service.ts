import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CommonUtilService {
  generateUUID() {
    return uuidv4();
  }

  getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // 예: 2025-06-27
  }

  getCurrentDateToISOString(): Date {
    const now = new Date();
    // 시간 성분은 무시하고 ‘오늘’만 쓰고 싶다면…
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}