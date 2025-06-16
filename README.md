# SafePark 웹사이트 🚗🛡️

스마트 안전 주차장 관리 시스템의 웹 대시보드

## 📋 프로젝트 개요

SafePark는 IoT 센서와 카메라를 활용한 스마트 주차장 관리 시스템입니다. 실시간 주차 현황 모니터링, 환경 데이터 수집, 보안 카메라 관제 등의 기능을 제공하는 웹 기반 대시보드입니다.

## ✨ 주요 기능

### 🏠 대시보드

- **실시간 주차 현황**: A구역, B구역별 주차 공간 현황 모니터링
- **주요 통계**: 총 주차 공간, 점유율, 환경 상태 한눈에 보기
- **실시간 시간 표시**: 현재 시각 자동 업데이트

### 📹 카메라 모니터링

- **CCTV 실시간 영상**: 주차장 전체 구역 영상 모니터링
- **녹화 제어**: 녹화 시작/정지 기능
- **영상 품질 관리**: 실시간 노이즈 효과 및 상태 표시

### 🌡️ 환경 모니터링

- **온도 측정**: 실시간 온도 데이터 및 24시간 추이 그래프
- **습도 모니터링**: 습도 데이터 수집 및 변화 추이 분석
- **환경 상태 알림**: 임계값 기반 경고 시스템

### 🔊 초음파 센서

- **거리 측정**: 초음파 센서를 통한 정확한 차량 감지
- **다중 센서 관리**: 여러 구역의 센서 통합 모니터링
- **센서 상태 관리**: 배터리 상태, 연결 상태 실시간 확인

### 📊 통계 및 분석

- **주차 패턴 분석**: 시간대별, 요일별 주차 이용 통계
- **환경 데이터 분석**: 온습도 변화 패턴 및 추이
- **효율성 리포트**: 주차장 운영 효율성 분석

## 🛠️ 기술 스택

### Frontend

- **Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod

### 개발 도구

- **Package Manager**: pnpm
- **Linting**: ESLint
- **CSS Framework**: Tailwind CSS + PostCSS

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.0 이상
- pnpm (권장) 또는 npm

### 설치 및 실행

1. **저장소 클론**

```bash
git clone https://github.com/your-username/SafePark-website.git
cd SafePark-website
```

2. **의존성 설치**

```bash
pnpm install
```

3. **개발 서버 실행**

```bash
pnpm dev
```

4. **브라우저에서 확인**

```
http://localhost:3000
```

### 빌드 및 배포

```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

## 🔐 로그인 정보

개발/테스트 환경에서는 다음 계정을 사용할 수 있습니다:

- **아이디**: `admin`
- **비밀번호**: `admin`

## 📁 프로젝트 구조

```
SafePark-website/
├── app/                    # Next.js App Router
│   ├── dashboard/         # 대시보드 페이지들
│   │   ├── camera/       # 카메라 모니터링
│   │   ├── environment/  # 환경 센서 데이터
│   │   ├── statistics/   # 통계 분석
│   │   └── ultrasonic/   # 초음파 센서 관리
│   ├── globals.css       # 전역 스타일
│   ├── layout.tsx        # 루트 레이아웃
│   └── page.tsx          # 로그인 페이지
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── dashboard-nav.tsx # 대시보드 네비게이션
│   └── theme-provider.tsx # 테마 공급자
├── hooks/                # 커스텀 React 훅
├── lib/                  # 유틸리티 함수
└── public/               # 정적 파일
```

## 🎨 UI/UX 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기 지원
- **다크/라이트 테마**: 사용자 환경에 맞는 테마 선택 가능
- **직관적 네비게이션**: 사이드바 기반 메뉴 구조
- **실시간 데이터 표시**: 자동 새로고침 및 실시간 업데이트
- **시각적 데이터 표현**: 차트와 그래프를 통한 데이터 시각화

## 🔧 주요 컴포넌트

### 대시보드 네비게이션

- 사이드바 메뉴
- 반응형 모바일 메뉴
- 현재 페이지 하이라이트

### 데이터 카드

- 실시간 상태 표시
- 색상 코딩된 상태 뱃지
- 반응형 그리드 레이아웃

### 차트 및 그래프

- Recharts를 활용한 데이터 시각화
- 반응형 차트 디자인
- 실시간 데이터 업데이트

## 🔮 향후 개발 계획

- [ ] **실시간 WebSocket 연결**: 실제 센서 데이터 실시간 수신
- [ ] **알림 시스템**: 이메일/SMS 알림 기능
- [ ] **사용자 권한 관리**: 역할 기반 접근 제어
- [ ] **데이터 백업**: 자동 데이터 백업 시스템
- [ ] **모바일 앱**: React Native 기반 모바일 앱 개발
- [ ] **AI 분석**: 머신러닝 기반 주차 패턴 예측

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이나 버그 리포트는 다음을 통해 연락해주세요:

- **이슈 등록**: [GitHub Issues](https://github.com/your-username/SafePark-website/issues)
- **이메일**: your-email@example.com

---

**SafePark** - 더 안전하고 스마트한 주차장 관리 솔루션 🚗✨
