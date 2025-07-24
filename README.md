# Remotion API Server

Remotion 프로젝트의 백엔드 API 서버입니다. 사용자의 일기를 분석하여 감정, 관계, 활동 등을 추적하고 다양한 AI 기반 기능을 제공합니다.

- **API Base URL**: `https://api.remotion.online/`
- **Swagger API Docs**: `https://api.remotion.online/docs`

---

## 주요 기능

- 📝 일기 작성, 조회, 수정, 삭제 (CRUD)
- 🤖 **AI 기반 일기 분석**:
    - 주요 감정, 인물, 활동, 할 일(Todo) 추출
    - 문장 단위 벡터화를 통한 의미 기반 검색 (RAG)
    - 기분 전환을 위한 맞춤형 루틴 제안
- 👥 **관계 분석**:
    - 일기 내용 기반 인물별 친밀도 및 감정 분석
    - 관계 그래프 시각화 데이터 제공
- 📊 **감정 통계**:
    - 기간별 감정 변화 시각화
    - 주요 감정 요약 및 경고 (불안, 우울, 스트레스)
- 🔔 **푸시 알림**:
    - 작년 오늘 일기 리캡, 루틴 추가, 캐릭터 변경 등 다양한 이벤트 알림
- 🖼️ **사진 모아보기**:
    - 일기에 첨부된 모든 사진을 최신순으로 모아보는 무한 스크롤 기능

---

## 아키텍처

![스크린샷 2025-06-24 132102](https://github.com/user-attachments/assets/ad24f300-ecc7-4d8e-849b-47f1af6c1e42)

---

## 기술 스택 (Tech Stack)

![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0803.svg?style=for-the-badge&logo=typeorm&logoColor=white)
![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)


### **Backend**
- **Framework**: [NestJS](https://nestjs.com/) (Node.js, TypeScript)
- **ORM**: [TypeORM](https://typeorm.io/)
- **Authentication**: [Passport.js](http://www.passportjs.org/) (JWT, Google & Kakao OAuth)
- **API Documentation**: [Swagger](https://swagger.io/)

### **Database**
- **Primary (RDB)**: [MySQL](https://www.mysql.com/)
- **Vector DB**: [Qdrant](https://qdrant.tech/) - 일기 RAG 검색

### **AI / LLM**
- **Primary LLM**: [AWS Bedrock (Claude 3.5/4 Sonnet , Nova Pro/Lite)](https://aws.amazon.com/bedrock/) - 일기 분석 및 컨텐츠 추천
- **Embedding & Reranking**: RAG를 위해 문장을 파싱, 라벨링하고 임베딩합니다.

### **Cloud & DevOps**
- **Cloud Provider**: [Amazon Web Services (AWS)](https://aws.amazon.com/)
- **Storage**: [AWS S3](https://aws.amazon.com/s3/) - 이미지 & 오디오 파일
- **CI/CD**: [GitHub Actions](https://github.com/features/actions) & [AWS CodeDeploy](https://aws.amazon.com/codedeploy/)

### **Others**
- **Push Notifications**: Web Push API
- **Scheduling**: NestJS Schedule (Cron Jobs)

---

## 시작하기

### **1. 저장소 복제**
```bash
git clone https://github.com/B1A4-NMM/Remotion-Server.git
cd Remotion-Server
```

### **2. 의존성 설치**
```bash
npm install
```

### **3. 환경 변수 설정**
프로젝트 루트에 `.env` 파일을 생성하고 아래 내용을 채워야 합니다. 민감한 정보가 포함되어 있으므로 주의하여 관리하세요.

```env
# Application
ENVIRONMENT=develop
PORT=3000

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=remotion

# Vector DB (Qdrant)
QDRANT_URL=http://localhost:6333

# AWS Credentials
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=<for Nova Pro/Lite>
S3_BUCKET_NAME=<your bucket name>
AWS_S3_REGION=<for S3>
AWS_SONNET_REGION=<for sonnet>

# AI/Parser Model Endpoints
EMBED_MODEL_URL=<dual encoder model URL>
RERANK_MODEL_URL=<corss encoder model URL>
SIMCSE_MODEL_URL=<한국어 임베딩 모델 URL>
CLUSTER_MODEL_URL=<클러스터링 모델 URL>
PARSER_MODEL_URL=<문장 파싱 모델 URL>

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRATION_TIME=24h
FRONTEND_URL=<for frontend>

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Kakao OAuth
KAKAO_CLIENT_ID=
KAKAO_REDIRECT_URI=

# Web Push (VAPID Keys)
VAPID_SUBJECT=mailto:example@example.com
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Search Parameters
SEARCH_KEYWORD_MIN_LENGTH=5
SEARCH_THRESHOLD=0.4

#THRESHOLD
ACTIVITY_THRESHOLD=
TARGET_THRESHOLD=
WARNING_THRESHOLD=<검사 경고 임계값>
SEARCH_THRESHOLD=<RAG 검색 필터링 임계값>
```

### **4. 서버 실행**
```bash
npm run start:dev
```

---

## 배포 자동화 (Deployment)

이 프로젝트는 AWS CodeDeploy를 이용한 배포 자동화가 적용되어 있습니다. `main` 브랜치에 Push 또는 Merge가 발생하면 GitHub Actions 워크플로우가 트리거되어 자동으로 배포를 진행합니다.
