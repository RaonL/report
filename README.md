# Infra Ops Runbook

회사 자산 정보를 외부에 입력하지 않고도 장애 유형별 대응 절차를 생성할 수 있는 Render Free용 정적 웹 도구입니다.

## Features

- DNS, SSL/TLS, 네트워크, 서버, VPN, WAF, NAC, EDR 장애 Runbook
- 심각도, 운영 단계, 영향 범위별 절차 구성
- 초동 대응, 원인 분리, 상세 점검, 점검 명령, 우회/복구, 에스컬레이션, 사후 점검 생성
- 내부 공유, 사용자/고객 공지, 복구 완료 문구 생성
- 전체 복사, 섹션별 복사, 인쇄/PDF
- LocalStorage, DB, API, 로그인 없음

## Security Model

이 앱은 실제 회사 자산 정보를 저장하지 않는 것을 전제로 설계되었습니다.

- IP 입력 없음
- 도메인 입력 없음
- 장비명 입력 없음
- 계정 입력 없음
- 로그 원문 업로드 없음
- 브라우저에서만 동작

## Render Free 배포

Render에서 Static Site로 배포합니다.

- Build Command: 비움
- Publish Directory: `./`
- Root Directory: 비움
