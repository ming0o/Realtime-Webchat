# Backend - Real-time Webchat

## 환경 설정

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=realtime_webchat
DB_DIALECT=mysql

# JWT Configuration (if needed later)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Socket.IO Configuration
SOCKET_CORS_ORIGIN=http://localhost:3001

### 2. Google Gemini API 설정 (무료)

1. **Google AI Studio 접속**: https://makersuite.google.com/app/apikey
2. **API 키 발급**: "Create API Key" 버튼 클릭
3. **무료 크레딧**: 매월 15 requests/분 (매우 넉넉함!)
4. **환경변수 설정**: `.env` 파일에 다음 추가:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 3. MySQL 데이터베이스 설정

1. MySQL 서버가 실행 중인지 확인하세요
2. 데이터베이스를 생성하세요:
   ```sql
   CREATE DATABASE realtime_webchat;
   ```
3. `.env` 파일에서 데이터베이스 연결 정보를 올바르게 설정하세요

### 4. 의존성 설치

```bash
npm install
```

### 5. 서버 실행

개발 모드:
```bash
npm run dev
```

프로덕션 모드:
```bash
npm start
```

## API 엔드포인트

### 사용자 관련
- `POST /api/users` - 새 사용자 생성
- `GET /api/users/:userId` - 사용자 정보 조회

### 채팅방 관련
- `GET /api/chat-rooms` - 모든 채팅방 목록 조회
- `GET /api/chat-rooms/:roomId` - 특정 채팅방 정보 조회
- `POST /api/chat-rooms/:roomId/analyze` - AI 대화 분석 및 답변 추천

### 메시지 관련
- `GET /api/messages/:chatRoomId` - 특정 채팅방의 메시지 조회
- `POST /api/messages/:chatRoomId/read` - 메시지 읽음 표시

### Socket.IO 이벤트
- `user_message` - 사용자 메시지 전송/수신
- `join_room` - 채팅방 참여
- `leave_room` - 채팅방 나가기

## AI 기능

### 대화 분석
- **감정 분석**: 고객의 감정 상태 (긍정/부정/중립)
- **긴급도 분석**: 문의의 긴급도 레벨
- **카테고리 분류**: 문의 유형 분류
- **키워드 추출**: 대화에서 주요 키워드 추출

### 답변 추천
- **매크로 추천**: 기존 매크로 중 적절한 것 추천
- **AI 커스텀 답변**: AI가 생성한 맞춤형 답변
- **이관 추천**: 전문 상담원 이관 필요 시 추천

## 데이터베이스 스키마 (ERD)

### users 테이블
- id (Primary Key)
- social_type (ENUM: KAKAO, GUEST)
- social_id (string, nullable)
- nickname (string)
- token (string, JWT)
- created_at

### chat_rooms 테이블
- id (Primary Key)
- user_id (Foreign Key → users)
- created_at

### messages 테이블
- id (Primary Key)
- chat_room_id (Foreign Key → chat_rooms)
- sender_type (ENUM: USER, ADMIN)
- content (TEXT)
- message_type (ENUM: TEXT, IMAGE)
- read (BOOLEAN)
- created_at 