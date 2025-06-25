# Git Branching Strategy

## Main Branches
- `main` — Production
- `dev-backend` — Backend 개발용
- `dev-web` — Web 개발용
- `dev-mobile` — Mobile 개발용

## Feature Branch Naming
- `feature/...` — 새로운 기능 개발
- `fix/...` — 버그 수정
- `design/...` — 스타일·UI 변경
- `refactor/...` — 코드 리팩터링

## 예시
- `dev-backend` ➔ `feature/auth-login`
- `dev-web` ➔ `design/new-chat-layout`
- `dev-mobile` ➔ `fix/socket-reconnect`

## Workflow
1. 개발 대상별 `dev-*` 브랜치로 이동
2. 작업별 브랜치 생성 (`feature/...`, `fix/...`, `design/...`)
3. 작업 후 Pull Request 통해 `dev-*`로 병합
4. 개발 후 `main`으로 병합하여 릴리스
