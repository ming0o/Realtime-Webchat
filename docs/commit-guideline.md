# 📋 Commit Message Guideline

일관된 커밋 메시지는 개발 효율과 변경 추적성을 높입니다.  
아래 원칙에 따라 메시지를 작성해주세요.

---

## ⚡️ Format

```
<type>(<scope>): <subject>
```

- **예시**: `feat(backend): add message save API`

---

## ✅ Type 정의
| Type       | 설명                      | 예시                                     |
|------------|----------------------------|----------------------------------------|
| `feat`     | 새로운 기능 개발           | `feat(backend): add message save API` |
| `fix`      | 버그 수정                   | `fix(web): scroll bug fixed`           |
| `docs`     | 문서 작업                  | `docs(guideline): add commit rules`    |
| `style`    | 스타일 변경(코드 변화 X)    | `style(web): adjust button padding`    |
| `refactor` | 로직 변경(새 기능 X)        | `refactor(backend): optimize db query` |
| `test`     | 테스트 코드 변경·추가       | `test(backend): add room test`         |
| `chore`    | 기타 작업(빌드, 의존 변경) | `chore(web): upgrade next version`     |

---

## ⚡️ Scope 정의
- 변경 대상 도메인 명시
    - 예: `web`, `backend`, `mobile`, `socket`, `database`, `auth` 등
- 가능한 한 직관적으로 변경 대상 표기

---

## ✅ 원칙
- 메시지는 **영어**로 작성
- **현재형** 동사로 표기 (`add`, `fix`, `update` 등)
- 핵심 내용을 **한 문장**으로 간결히 표기
- 변경 범위가 크다면 적절히 `scope`를 구분해 여러 커밋으로 진행


## 🔥 참고
원칙과 형식을 준수하면 변경 내역이 한눈에 파악 가능해지고,
협업 시 효율적인 리뷰·기록·추적이 가능해집니다.