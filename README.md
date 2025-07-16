# Realtime Webchat Support

실시간 웹·앱 연동 채팅 지원 서비스 개발 저장소

## 🗂️ Directory
- `backend/`: Node.js + Express + Socket.IO + MySQL로 실시간 메시지 브로커 역할
- `frontend/`
  - `mobile/`: React Native (Original, CLI 버전)로 개발된 모바일 채팅 클라이언트
  - `web/`: Next.js로 개발된 웹 대시보드 (상담사 인터페이스)

## 🚀 Features
- 실시간 메시지 송·수신 (Socket.IO)
- 채팅 메시지 저장·조회 (MySQL 연동)
- JWT 기반 인증 (회원·비회원 모두 가능)
- 자동응답·메시지 요약 연계 가능 (OpenAI)

## 🛠️ Stack
- **Backend**: Node.js, Express, Socket.IO, MySQL
- **Mobile**: React Native (Original CLI), NativeWind, TypeScript
- **Web**: Next.js, Tailwind, Zustand, TypeScript
- **Database**: MySQL
