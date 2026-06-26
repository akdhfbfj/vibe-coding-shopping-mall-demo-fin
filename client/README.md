# Shopping Mall Client

React + Vite 프론트엔드 프로젝트입니다.

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

## 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 |

## 환경 변수

`.env.example`을 참고해 `.env` 파일을 설정하세요.

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 클라이언트 API 요청 경로 | `/api` |
| `VITE_API_PROXY_TARGET` | 개발 서버 프록시 대상 (백엔드) | `http://localhost:5000` |

개발 중에는 `/api` 요청이 Vite 프록시를 통해 백엔드(`server`, 포트 5000)로 전달됩니다.

## 폴더 구조

```
src/
├── api/          # API 클라이언트
├── components/   # 공통 컴포넌트
├── pages/        # 페이지 컴포넌트
├── App.jsx
└── main.jsx
```

## 백엔드 연동

1. `server` 폴더에서 `npm run dev` 로 API 서버 실행
2. `client` 폴더에서 `npm run dev` 로 프론트 실행
3. API 호출 예시:

```js
import { apiClient } from '@/api/client.js'

const data = await apiClient.get('/products')
```
