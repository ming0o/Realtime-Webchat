# Backend - Real-time Webchat

## 환경 설정

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Server Configuration
PORT=3000
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
```

### 2. MySQL 데이터베이스 설정

1. MySQL 서버가 실행 중인지 확인하세요
2. 데이터베이스를 생성하세요:
   ```sql
   CREATE DATABASE realtime_webchat;
   ```
3. `.env` 파일에서 데이터베이스 연결 정보를 올바르게 설정하세요

### 3. 의존성 설치

```bash
npm install
```

### 4. 서버 실행

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

### 메시지 관련
- `GET /api/messages/:chatRoomId` - 특정 채팅방의 메시지 조회
- `POST /api/messages/:chatRoomId/read` - 메시지 읽음 표시

### Socket.IO 이벤트
- `user_message` - 사용자 메시지 전송/수신
- `join_room` - 채팅방 참여
- `leave_room` - 채팅방 나가기

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

## 서비스 구조

### UserService
- 사용자 생성, 조회, 토큰 업데이트 기능

### ChatRoomService
- 채팅방 생성, 조회, 삭제 기능

### MessageService
- 메시지 저장, 조회, 읽음 표시, 삭제 기능

## 주의사항

1. MySQL 서버가 실행 중이어야 합니다
2. 데이터베이스 연결 정보가 올바르게 설정되어야 합니다
3. 환경 변수 파일(.env)이 프로젝트 루트에 있어야 합니다
4. 새로운 ERD에 따라 사용자별 채팅방이 자동으로 생성됩니다 