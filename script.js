const runbooks = {
  dns: {
    name: "DNS 장애",
    objective: "내부/외부 DNS 응답 차이를 확인하고 레코드, 위임, 캐시, 보안 장비 영향 여부를 분리합니다.",
    sla: "10분 내 영향 범위 식별, 30분 내 우회 방향 제시",
    escalation: "권한 있는 DNS 변경이 필요하거나 대외 서비스 영향이 확인되면 인프라/DNS 담당 즉시 호출",
    tags: ["DNS", "Record", "TTL", "Delegation", "Resolver"],
    triage: [
      "장애 접수 시점, 영향 사용자 범위, 특정 도메인/전체 도메인 여부를 분리합니다.",
      "내부 DNS와 외부 DNS 응답을 비교하여 내부 해석 문제인지 권한 DNS 문제인지 확인합니다.",
      "최근 DNS 레코드 변경, 네임서버 변경, 도메인 갱신, CDN/WAF 변경 이력을 확인합니다.",
      "TTL과 캐시 영향으로 구 응답이 남아있는지 확인하고, 영향 구간을 기록합니다.",
      "서비스 IP가 정상이어도 DNS 응답이 잘못되면 우회 접속 안내 또는 임시 레코드 복구를 검토합니다."
    ],
    verify: [
      "권한 DNS 응답과 재귀 DNS 응답의 A/AAAA/CNAME/MX/TXT 결과를 비교합니다.",
      "내부망, 외부망, 모바일망 등 서로 다른 경로에서 동일 증상인지 확인합니다.",
      "NXDOMAIN, SERVFAIL, timeout, stale answer 중 어떤 형태인지 구분합니다.",
      "DNSSEC 사용 시 DS/DNSKEY 불일치 또는 서명 만료 여부를 확인합니다.",
      "캐시 flush 또는 resolver 재시작이 필요한 범위인지 운영 영향도를 검토합니다."
    ],
    commands: [
      "nslookup example.com",
      "nslookup example.com 8.8.8.8",
      "dig example.com A +trace",
      "dig example.com NS",
      "dig example.com SOA",
      "Resolve-DnsName example.com -Server 8.8.8.8"
    ],
    mitigate: [
      "오류 레코드가 확인되면 직전 정상 값으로 복구하고 TTL 전파 시간을 공지합니다.",
      "특정 resolver 문제라면 임시 우회 DNS 사용 또는 캐시 초기화를 안내합니다.",
      "권한 DNS 장애라면 보조 DNS, CDN DNS, 등록기관 콘솔 상태를 확인합니다.",
      "대외 서비스 영향 시 사용자 안내 문구에는 도메인명 대신 서비스명 기준으로 표현합니다."
    ],
    post: [
      "변경 요청, 승인, 반영 시각, 전파 완료 시각을 타임라인으로 정리합니다.",
      "TTL 정책과 긴급 복구용 레코드 백업 절차를 보완합니다.",
      "권한 DNS, 등록기관, CDN의 접근 권한과 담당자 체계를 재확인합니다.",
      "동일 장애 재발 감지를 위한 외부 DNS 모니터링 항목을 등록합니다."
    ]
  },
  ssl: {
    name: "SSL/TLS 인증서 장애",
    objective: "인증서 만료, 체인 누락, SNI 불일치, TLS 정책 문제를 분리하고 안전한 교체 절차를 수행합니다.",
    sla: "15분 내 인증서 상태 확인, 45분 내 교체/우회 판단",
    escalation: "인증서 개인키, LB/WAF 반영 권한, 대외 서비스 영향이 있으면 보안/인프라 담당 동시 호출",
    tags: ["SSL", "TLS", "Certificate", "Chain", "SNI"],
    triage: [
      "브라우저 오류 문구와 발생 위치를 확인하여 만료, 신뢰 실패, 이름 불일치, 프로토콜 오류를 구분합니다.",
      "외부 접속 지점, 내부 접속 지점, 로드밸런서/WAF 후단 각각에서 인증서가 동일한지 확인합니다.",
      "최근 인증서 교체, WAF 정책 변경, VIP 변경, CDN 인증서 자동 갱신 실패 여부를 확인합니다.",
      "단일 도메인인지 와일드카드/멀티 SAN 인증서 전체 영향인지 확인합니다.",
      "장애 중 신규 인증서를 발급할 경우 CSR, 개인키, 체인 인증서의 위치와 소유권을 엄격히 확인합니다."
    ],
    verify: [
      "인증서 유효기간, CN/SAN, 발급자, 체인 포함 여부를 확인합니다.",
      "SNI 기준으로 올바른 인증서가 내려오는지 확인합니다.",
      "중간 인증서 누락 또는 루트 신뢰 문제인지 클라이언트 유형별로 비교합니다.",
      "TLS 버전과 Cipher 정책이 최근 변경된 보안 기준과 충돌하는지 확인합니다.",
      "인증서 교체 후 캐시, WAF, LB, CDN 각각에 반영되었는지 재검증합니다."
    ],
    commands: [
      "openssl s_client -connect example.com:443 -servername example.com -showcerts",
      "curl -Iv https://example.com",
      "Test-NetConnection example.com -Port 443",
      "openssl x509 -in cert.pem -noout -dates -subject -issuer",
      "nmap --script ssl-cert,ssl-enum-ciphers -p 443 example.com"
    ],
    mitigate: [
      "직전 정상 인증서와 개인키 백업이 있으면 우선 롤백 가능성을 검토합니다.",
      "체인 누락이면 서버 인증서가 아니라 full chain 적용으로 해결 가능한지 확인합니다.",
      "WAF/LB 이중 종단 구조에서는 외부 종단 인증서를 우선 복구합니다.",
      "서비스 영향이 큰 경우 임시 점검 공지와 함께 인증서 교체 창을 즉시 확보합니다."
    ],
    post: [
      "만료 알림 기준을 30일/15일/7일로 나누고 담당자 백업 체계를 지정합니다.",
      "인증서 배포 대상 목록과 실제 반영 위치를 비교해 누락 장비를 제거합니다.",
      "CSR/개인키 보관 절차, 접근 권한, 교체 승인 프로세스를 점검합니다.",
      "교체 후 외부 모니터링과 브라우저 호환성 테스트 결과를 기록합니다."
    ]
  },
  network: {
    name: "네트워크 지연/단절",
    objective: "사용자 구간, 내부망, 회선, 방화벽, 라우팅, 서버 구간을 분리하여 장애 지점을 좁힙니다.",
    sla: "10분 내 단일 구간/다중 구간 여부 판단, 30분 내 우회 경로 검토",
    escalation: "회선 장애, 라우팅 변경, 방화벽 정책 영향이 의심되면 네트워크 담당 즉시 호출",
    tags: ["Network", "Routing", "Firewall", "Latency", "Packet Loss"],
    triage: [
      "영향 범위를 사용자, 지점, 서비스, 특정 포트 기준으로 분리합니다.",
      "단절인지 지연인지, 간헐인지 지속인지, 특정 시간대 반복인지 확인합니다.",
      "최근 방화벽 정책, 라우팅, 회선, VPN, 보안 장비 변경 이력을 확인합니다.",
      "동일 목적지에 대해 ICMP, TCP 포트, 애플리케이션 레벨 테스트를 분리합니다.",
      "모니터링 지표에서 패킷 손실, 인터페이스 에러, CPU 상승, 세션 한도 도달 여부를 확인합니다."
    ],
    verify: [
      "출발지별 traceroute 결과를 비교하여 경로 변화 또는 특정 hop 지연을 확인합니다.",
      "방화벽 로그에서 deny/drop/session timeout 여부를 확인합니다.",
      "L2/L3 장비 인터페이스 오류, duplex mismatch, CRC, discard 카운터를 확인합니다.",
      "NAT/PAT 고갈, 세션 테이블 포화, HA failover 이벤트를 점검합니다.",
      "문제가 특정 포트라면 서비스 리스닝 상태와 보안 정책을 함께 확인합니다."
    ],
    commands: [
      "ping target",
      "tracert target",
      "pathping target",
      "Test-NetConnection target -Port 443",
      "netstat -ano",
      "tcpdump -nn host target and port 443"
    ],
    mitigate: [
      "회선 또는 특정 경로 장애가 확인되면 우회 회선, 백업 터널, 정책 라우팅 적용 가능성을 검토합니다.",
      "방화벽 정책 문제라면 임시 허용 정책은 만료 시간과 승인자를 명시하고 적용합니다.",
      "세션/NAT 고갈이면 불필요 세션 정리와 임계치 상향의 운영 위험을 검토합니다.",
      "서비스 단절이 장기화되면 영향 사용자에게 우회 접속 방법을 제공합니다."
    ],
    post: [
      "장애 구간별 증거 자료를 정리하고 회선사/벤더 티켓 번호를 기록합니다.",
      "변경 전 검증 항목에 경로, 포트, 정책, 세션 용량 확인을 추가합니다.",
      "반복 지연 구간은 임계치 기반 알림과 capacity review 대상으로 등록합니다.",
      "우회 정책이 임시라면 제거 일정과 담당자를 지정합니다."
    ]
  },
  server: {
    name: "서버 리소스 장애",
    objective: "CPU, 메모리, 디스크, 프로세스, 의존 서비스 상태를 확인하여 서비스 영향 원인을 분리합니다.",
    sla: "10분 내 리소스 병목 확인, 30분 내 임시 완화 조치 판단",
    escalation: "데이터 손상, 디스크 장애, 반복 재기동, 비정상 프로세스가 있으면 시스템 담당 호출",
    tags: ["Server", "CPU", "Memory", "Disk", "Process"],
    triage: [
      "서비스 응답 지연, 접속 불가, 오류율 상승 중 어떤 증상인지 확인합니다.",
      "CPU, 메모리, 디스크, 네트워크, 프로세스 상태를 동시에 확인하여 단일 병목을 찾습니다.",
      "최근 배포, 패치, 스케줄 작업, 백업, 보안 스캔 시각과 장애 시각을 비교합니다.",
      "서비스 프로세스가 살아있는지, 포트를 리스닝하는지, 로그가 증가하는지 확인합니다.",
      "디스크 full 또는 inode 고갈이면 로그 증가 원인과 삭제 가능 범위를 먼저 확인합니다."
    ],
    verify: [
      "시스템 로그와 애플리케이션 로그에서 OOM, permission denied, connection refused, timeout을 확인합니다.",
      "프로세스 재시작 전 현재 상태, 로그, 메모리 덤프 필요성을 판단합니다.",
      "DB, 인증, 파일시스템, 외부 API 등 의존 서비스 장애인지 분리합니다.",
      "HA 구성이라면 active/standby 상태와 failover 가능성을 확인합니다.",
      "보안 이벤트 또는 비정상 프로세스가 의심되면 임의 삭제 없이 보안 담당에게 공유합니다."
    ],
    commands: [
      "top 또는 htop",
      "free -m",
      "df -h",
      "df -i",
      "systemctl status service-name",
      "journalctl -u service-name --since '30 minutes ago'",
      "ss -lntp"
    ],
    mitigate: [
      "로그 폭증이면 보관 정책을 확인한 뒤 압축/이관/rotate를 우선 적용합니다.",
      "프로세스 hang이면 재기동 전 영향 범위와 세션 유실 가능성을 공유합니다.",
      "리소스 부족이면 임시 scale-up, 불필요 작업 중지, 트래픽 우회 중 하나를 선택합니다.",
      "원인 미확정 상태의 재기동은 증거 손실 가능성이 있으므로 최소 로그를 확보한 뒤 진행합니다."
    ],
    post: [
      "리소스 임계치, 로그 보관, 배치 작업 시간, 용량 추세를 재검토합니다.",
      "장애 전 징후가 모니터링에 잡혔는지 확인하고 알림 기준을 조정합니다.",
      "재기동 또는 scale-up이 반복되면 구조적 개선 과제로 등록합니다.",
      "운영 절차서에 재기동 전 확인해야 할 로그와 승인 기준을 추가합니다."
    ]
  },
  vpn: {
    name: "VPN 접속 장애",
    objective: "인증, 계정, 단말, 네트워크, 터널, 정책 문제를 분리하여 원격 접속 경로를 복구합니다.",
    sla: "15분 내 사용자/전체 영향 구분, 30분 내 임시 접속 우회 판단",
    escalation: "전체 사용자 영향, 인증 서버 장애, 터널 장애가 확인되면 보안/네트워크 담당 동시 호출",
    tags: ["VPN", "MFA", "Authentication", "Tunnel", "Remote Access"],
    triage: [
      "특정 사용자 문제인지 전체 사용자 문제인지 우선 분리합니다.",
      "오류 메시지를 인증 실패, MFA 실패, 터널 수립 실패, 접속 후 통신 실패로 분류합니다.",
      "인증 서버, MFA, NAC, 방화벽, VPN 장비의 최근 변경 이력을 확인합니다.",
      "사용자 단말 시간, 인증서, 클라이언트 버전, 네트워크 환경을 확인합니다.",
      "접속은 되지만 내부 시스템 접근이 안 되면 라우팅/ACL/DNS 문제로 분리합니다."
    ],
    verify: [
      "VPN 장비 세션 수, 라이선스 한도, CPU/메모리 상태를 확인합니다.",
      "인증 로그에서 계정 잠금, 비밀번호 만료, MFA 거절, 그룹 매핑 실패를 확인합니다.",
      "접속 성공 후 할당 IP, split tunnel, DNS, route push 상태를 확인합니다.",
      "방화벽 로그에서 VPN pool 대역의 내부 접근 차단 여부를 확인합니다.",
      "동일 계정의 다른 단말 또는 테스트 계정으로 재현성을 확인합니다."
    ],
    commands: [
      "ipconfig /all",
      "route print",
      "nslookup internal-service",
      "Test-NetConnection internal-service -Port 443",
      "ping gateway",
      "tracert internal-service"
    ],
    mitigate: [
      "특정 사용자 문제라면 계정 잠금 해제, MFA 재등록, 클라이언트 재설치를 안내합니다.",
      "전체 장애라면 VPN HA 상태와 인증 서버 우회 가능성을 확인합니다.",
      "내부 접근 정책 문제라면 임시 허용은 대상/기간/승인자를 제한합니다.",
      "업무 영향이 큰 경우 대체 접속 경로나 사내망 작업 대행 절차를 공지합니다."
    ],
    post: [
      "VPN 장애 유형별 사용자 안내문과 운영자 체크리스트를 분리합니다.",
      "인증 서버/MFA/VPN 장비 간 의존성 모니터링을 추가합니다.",
      "라이선스, 세션, IP pool 사용량 추세를 월간 점검 항목으로 등록합니다.",
      "원격 접속 변경 작업 시 사전 검증 계정과 테스트 절차를 표준화합니다."
    ]
  },
  waf: {
    name: "WAF 차단/오탐 이슈",
    objective: "정상 트래픽 차단, 공격 탐지, 정책 변경, 애플리케이션 오류를 분리하고 안전한 예외 정책을 검토합니다.",
    sla: "15분 내 차단 룰 식별, 45분 내 예외/우회/개발 수정 방향 제시",
    escalation: "대외 서비스 영향 또는 공격 의심이 있으면 보안 관제/서비스 담당 동시 호출",
    tags: ["F5", "WAF", "Policy", "Payload", "False Positive"],
    triage: [
      "사용자 오류가 WAF 차단 페이지인지 애플리케이션 오류인지 먼저 확인합니다.",
      "발생 URI, Method, 응답 코드, 요청 시각, 사용자 영향 범위를 수집하되 민감 payload는 외부 도구에 입력하지 않습니다.",
      "최근 WAF 정책 학습, Signature 업데이트, 예외 정책 변경, 배포 이력을 확인합니다.",
      "차단 이벤트의 룰명, 위반 항목, support ID, source 대역을 기준으로 정상/비정상 가능성을 나눕니다.",
      "동일 요청이 WAF 우회 경로에서 정상인지 확인해 애플리케이션 문제와 분리합니다."
    ],
    verify: [
      "차단된 요청이 인증된 사용자 정상 업무인지 공격 패턴인지 서비스 담당과 확인합니다.",
      "URI 단위 예외, 파라미터 단위 예외, Signature 단위 예외 중 최소 범위를 선택합니다.",
      "예외 적용 전 staging 정책 또는 테스트 VIP에서 재현 여부를 검증합니다.",
      "예외 정책은 만료일, 사유, 승인자, 재검토 일정을 함께 기록합니다.",
      "공격 의심이면 차단 유지 후 IOC, source, 빈도, 대상 URI를 관제에 공유합니다."
    ],
    commands: [
      "curl -k -I https://service/path",
      "curl -k -X POST https://service/path",
      "grep 'support id' waf-log",
      "tcpdump -nn host client-ip and port 443",
      "브라우저 개발자도구 Network 탭에서 응답 코드 확인"
    ],
    mitigate: [
      "정상 업무 오탐이면 최소 범위 예외를 적용하고 즉시 재현 테스트를 수행합니다.",
      "정책 학습 중 발생한 오탐이면 학습 제안 승인 전 영향 URI를 검토합니다.",
      "공격 트래픽이면 차단 유지, rate limit, source reputation, 추가 탐지 룰을 검토합니다.",
      "긴급 우회가 필요하면 WAF bypass 대신 제한된 경로/시간/대상 기준으로 통제합니다."
    ],
    post: [
      "오탐 룰, URI, 예외 범위, 승인자, 만료일을 정책 관리대장에 기록합니다.",
      "개발 수정이 필요한 입력값 검증 문제인지 확인하고 재발 방지 과제로 등록합니다.",
      "Signature 업데이트 후 영향 검증 절차를 변경 관리 체크리스트에 추가합니다.",
      "차단 이벤트 리포트를 서비스 담당과 공유해 정상 트래픽 패턴을 보정합니다."
    ]
  },
  nac: {
    name: "NAC 인증/접속 제어 장애",
    objective: "단말 인증, 사용자 인증, 스위치 연동, 정책 매핑, 예외 처리 문제를 분리합니다.",
    sla: "15분 내 특정 단말/구간/전체 영향 구분, 45분 내 임시 접속 방안 검토",
    escalation: "다수 사용자 접속 불가, 스위치 연동 장애, 인증 서버 장애 시 네트워크/보안 담당 호출",
    tags: ["NAC", "802.1X", "Authentication", "Policy", "Endpoint"],
    triage: [
      "신규 단말, 기존 단말, 특정 구역, 전체 구역 중 어디에서 발생하는지 확인합니다.",
      "유선/무선, 사내망/게스트망, 인증 방식별로 증상을 분리합니다.",
      "NAC 정책 변경, 인증 서버 변경, 스위치 설정 변경, 인증서 만료 여부를 확인합니다.",
      "단말이 차단된 사유가 미등록, 보안 상태 미충족, 계정 실패, MAC 변동인지 확인합니다.",
      "업무 긴급도가 높으면 임시 예외 정책 적용 가능성과 승인 기준을 확인합니다."
    ],
    verify: [
      "NAC 이벤트 로그에서 단말 MAC, 사용자, 정책, VLAN 할당, 실패 사유를 확인합니다.",
      "스위치 포트 상태, 802.1X/MAB 동작, RADIUS 응답 여부를 확인합니다.",
      "단말 에이전트 상태, 백신/EDR 연동 상태, 인증서 상태를 확인합니다.",
      "정책 매핑 결과가 예상 VLAN/ACL과 일치하는지 확인합니다.",
      "예외 등록 시 대상, 기간, 사유, 승인자를 명확히 남깁니다."
    ],
    commands: [
      "ipconfig /all",
      "gpupdate /force",
      "netsh lan show interfaces",
      "netsh wlan show interfaces",
      "Test-NetConnection radius-server -Port 1812",
      "스위치 show authentication sessions"
    ],
    mitigate: [
      "단일 단말 문제라면 에이전트 재시작, 인증서 갱신, 재인증을 우선 안내합니다.",
      "정책 오매핑이면 직전 정책으로 롤백하거나 제한된 예외 VLAN을 적용합니다.",
      "RADIUS 장애라면 보조 인증 서버 전환 또는 fail-open 정책 적용 가능성을 검토합니다.",
      "게스트/협력사 접속 이슈는 업무망 접근 권한과 분리하여 임시 인터넷망 제공을 검토합니다."
    ],
    post: [
      "반복 차단 사유를 유형화하고 사용자 안내 문구를 정리합니다.",
      "스위치/NAC/RADIUS 연동 모니터링과 인증 실패율 알림을 추가합니다.",
      "예외 정책은 만료일 기준으로 정리하고 장기 예외를 제거합니다.",
      "정책 변경 전 테스트 단말과 테스트 포트 기준을 운영 절차에 반영합니다."
    ]
  },
  edr: {
    name: "EDR 탐지/격리 이벤트",
    objective: "탐지 이벤트의 실제 위협 여부, 업무 영향, 격리 필요성, 복구 절차를 분리합니다.",
    sla: "15분 내 이벤트 분류, 60분 내 격리/해제/추가 분석 방향 결정",
    escalation: "악성 행위 의심, lateral movement, 중요 서버 탐지 시 보안 관제/시스템 담당 즉시 호출",
    tags: ["EDR", "Detection", "Isolation", "Endpoint", "Security"],
    triage: [
      "탐지 시각, 탐지명, 단말 유형, 사용자 영향, 자동 조치 여부를 확인합니다.",
      "프로세스 트리, 파일 경로, 해시, 네트워크 연결, 부모 프로세스를 기준으로 정상 업무 여부를 판단합니다.",
      "동일 해시/프로세스가 다른 단말에서도 발생했는지 확산 여부를 확인합니다.",
      "업무 필수 프로그램 오탐 가능성이 있으면 배포 이력과 서명 정보를 확인합니다.",
      "격리된 단말이 업무 핵심 단말이면 대체 업무 수단과 복구 승인 절차를 동시에 준비합니다."
    ],
    verify: [
      "탐지 이벤트의 confidence, severity, action taken, MITRE mapping을 확인합니다.",
      "사용자에게 민감 내용을 요구하지 않고 실행 시각과 업무 행위만 확인합니다.",
      "파일 해시, 서명, 생성 위치, persistence 등록 여부를 분석합니다.",
      "네트워크 연결 대상이 내부/외부인지, 차단 여부와 로그를 확인합니다.",
      "오탐 해제 전 최소 2개 이상의 근거를 확보합니다."
    ],
    commands: [
      "Get-Process",
      "Get-FileHash file-path",
      "Get-AuthenticodeSignature file-path",
      "netstat -ano",
      "schtasks /query",
      "wevtutil qe Security /c:20 /f:text"
    ],
    mitigate: [
      "위협 가능성이 높으면 단말 격리 유지, 계정 잠금, 네트워크 연결 차단을 검토합니다.",
      "오탐 가능성이 높으면 파일 서명과 배포 출처 확인 후 예외 정책을 최소 범위로 적용합니다.",
      "업무 영향이 크면 대체 단말 제공 또는 필수 파일 백업 후 재이미징을 검토합니다.",
      "해제 요청은 탐지 근거, 해제 사유, 승인자를 기록한 뒤 진행합니다."
    ],
    post: [
      "탐지 이벤트 타임라인과 조치 근거를 보안 티켓에 정리합니다.",
      "오탐이면 예외 정책 범위와 만료일을 지정하고 정기 재검토 대상으로 등록합니다.",
      "실제 위협이면 IOC를 공유하고 동일 패턴 헌팅 쿼리를 수행합니다.",
      "사용자 교육 또는 보안 정책 개선이 필요한지 후속 조치를 지정합니다."
    ]
  },
  firewall: {
    name: "방화벽 정책/세션 장애",
    objective: "정책 차단, NAT, 라우팅, 세션 고갈, 비대칭 경로, 객체 변경 이슈를 분리하여 통신 장애 원인을 확인합니다.",
    sla: "15분 내 차단/라우팅/세션 이슈 분류, 45분 내 임시 허용 또는 롤백 판단",
    escalation: "대외 서비스 또는 핵심 업무망 통신 장애가 확인되면 네트워크/보안 정책 승인자 동시 호출",
    tags: ["Firewall", "Policy", "NAT", "Session", "Routing"],
    triage: [
      "출발지, 목적지, 포트, 프로토콜, 발생 시각을 기준으로 정책 조회 조건을 정리합니다.",
      "신규 정책 요청인지 기존 통신 장애인지 구분하고 최근 정책 변경/객체 변경/NAT 변경 이력을 확인합니다.",
      "방화벽 로그에서 allow, deny, drop, reset, timeout 중 어떤 동작인지 확인합니다.",
      "정책상 허용되어도 NAT, 라우팅, zone, security profile, IPS/WAF 연동에서 차단되는지 분리합니다.",
      "양방향 통신이 필요한 서비스는 return path와 비대칭 경로 가능성을 함께 확인합니다."
    ],
    verify: [
      "정책 매칭 순서, 상위 deny 정책, 객체 그룹 포함 여부, address/service object 오타를 확인합니다.",
      "NAT 전/후 주소 기준으로 로그와 세션 테이블을 각각 확인합니다.",
      "세션 테이블 사용률, CPS, CPU, 메모리, HA 상태, failover 이벤트를 점검합니다.",
      "IPS, AV, URL filtering, SSL inspection 같은 보안 프로파일 차단 여부를 확인합니다.",
      "임시 허용이 필요한 경우 대상, 포트, 기간, 사유, 승인자를 먼저 확정합니다."
    ],
    commands: [
      "Test-NetConnection target -Port 443",
      "telnet target 443",
      "tracert target",
      "tcpdump -nn host source-ip and host destination-ip",
      "show session all filter source source-ip destination destination-ip",
      "show log traffic query equal source source-ip"
    ],
    mitigate: [
      "정책 오적용이면 직전 정상 정책 또는 객체 버전으로 롤백합니다.",
      "긴급 허용 정책은 최상단 광범위 허용 대신 특정 출발지/목적지/포트/시간으로 제한합니다.",
      "NAT 문제라면 기존 NAT 순서와 중복 객체 충돌을 검토한 뒤 최소 변경으로 반영합니다.",
      "세션 고갈이면 비정상 트래픽 차단, 세션 timeout 조정, 우회 경로 적용을 검토합니다."
    ],
    post: [
      "정책 변경 요청서와 실제 반영값의 출발지/목적지/서비스 객체를 비교합니다.",
      "임시 허용 정책은 만료일 기준으로 제거 예약하고 장기 정책으로 승격할지 검토합니다.",
      "정책 검증 체크리스트에 NAT, 라우팅, 보안 프로파일, 로그 확인 항목을 추가합니다.",
      "반복 장애가 발생한 객체 그룹은 명명 규칙과 소유자를 정리합니다."
    ]
  },
  cableGbic: {
    name: "케이블/GBIC 물리 링크 이슈",
    objective: "케이블, GBIC/SFP, 포트, 광세기, CRC, duplex, 패치 경로 문제를 확인하여 물리 계층 장애를 분리합니다.",
    sla: "10분 내 링크 상태 확인, 30분 내 케이블/GBIC/포트 교체 판단",
    escalation: "이중화 구간 동시 저하, 광세기 임계치 초과, 상면 작업 필요 시 네트워크/IDC 담당 호출",
    tags: ["Cable", "GBIC", "SFP", "CRC", "Link"],
    triage: [
      "장애가 link down, flap, 속도 저하, 패킷 손실, CRC 증가 중 어디에 해당하는지 확인합니다.",
      "최근 상면 작업, 케이블 정리, GBIC 교체, 장비 재기동, 포트 변경 이력을 확인합니다.",
      "양단 장비 포트 상태와 인터페이스 카운터를 같은 시각 기준으로 비교합니다.",
      "광 구간이면 TX/RX power, wavelength, single/multi mode, 거리 규격을 확인합니다.",
      "이중화 구성에서는 active/standby 또는 LAG 멤버 중 특정 링크만 문제인지 분리합니다."
    ],
    verify: [
      "CRC, input error, output error, discard, pause frame, link flap 카운터 증가 여부를 확인합니다.",
      "포트 speed/duplex/auto-negotiation 설정이 양단에서 일치하는지 확인합니다.",
      "GBIC 벤더 호환성, DOM 지원 여부, 온도, 전압, 광세기 임계치를 확인합니다.",
      "패치 패널과 실제 케이블 라벨이 문서와 일치하는지 확인합니다.",
      "케이블/GBIC/포트 순서로 교차 교체하여 장애가 따라가는지 확인합니다."
    ],
    commands: [
      "show interface status",
      "show interface counters errors",
      "show interface transceiver details",
      "show logging | include LINK",
      "ethtool interface-name",
      "ip -s link show interface-name"
    ],
    mitigate: [
      "단일 링크 장애이고 이중화가 정상이면 영향 확인 후 케이블 또는 GBIC를 교체합니다.",
      "LAG 멤버 오류라면 해당 멤버를 임시 제외하고 트래픽 분산 상태를 확인합니다.",
      "광세기 불량이면 케이블 청소, 패치 경로 변경, GBIC 교체 순서로 조치합니다.",
      "포트 불량이 의심되면 예비 포트로 이동하되 VLAN/LAG/트렁크 설정을 사전 확인합니다."
    ],
    post: [
      "교체한 케이블/GBIC 시리얼, 위치, 포트, 작업 시각을 기록합니다.",
      "링크 flap과 error counter 기준의 모니터링 임계치를 조정합니다.",
      "상면 패치 문서와 실제 연결 상태를 갱신합니다.",
      "예비 GBIC/케이블 재고와 규격을 점검합니다."
    ]
  },
  l2: {
    name: "L2 스위치 장애",
    objective: "VLAN, STP, trunk, LAG, MAC learning, loop, broadcast storm 문제를 분리합니다.",
    sla: "15분 내 VLAN/포트/루프 여부 판단, 45분 내 우회 포트 또는 롤백 결정",
    escalation: "루프 또는 다수 포트 영향이 의심되면 네트워크 담당과 현장 담당 즉시 호출",
    tags: ["L2", "Switch", "VLAN", "STP", "Trunk"],
    triage: [
      "영향 범위를 단일 포트, 단일 VLAN, 단일 스위치, 전체 스위치 구간으로 분리합니다.",
      "최근 VLAN 추가, trunk 허용 VLAN 변경, LAG 변경, STP 설정 변경 이력을 확인합니다.",
      "포트 link 상태, VLAN 할당, trunk/native VLAN, port-security 차단 여부를 확인합니다.",
      "MAC address table에서 MAC flapping 또는 예상 포트와 다른 학습 위치를 확인합니다.",
      "broadcast storm, loop, STP topology change 증가 여부를 확인합니다."
    ],
    verify: [
      "access 포트와 trunk 포트의 VLAN 설정이 설계와 일치하는지 확인합니다.",
      "STP root bridge, blocked port, topology change count를 확인합니다.",
      "LACP 상태와 bundle 멤버 불일치 여부를 확인합니다.",
      "포트 보안, BPDU guard, storm control, err-disable 상태를 확인합니다.",
      "동일 VLAN 내 게이트웨이 ARP와 단말 MAC 학습 상태를 비교합니다."
    ],
    commands: [
      "show vlan brief",
      "show interfaces trunk",
      "show spanning-tree",
      "show mac address-table dynamic",
      "show etherchannel summary",
      "show interfaces status err-disabled"
    ],
    mitigate: [
      "루프 의심 포트는 영향 확인 후 즉시 shutdown하고 STP 안정화 여부를 확인합니다.",
      "trunk VLAN 누락이면 변경 전 승인 범위 내에서 허용 VLAN을 복구합니다.",
      "LAG 불일치면 멤버 포트를 임시 제외하고 단일 링크 안정성을 확인합니다.",
      "err-disable 포트는 원인 제거 후 복구하며 자동 복구 설정 여부를 확인합니다."
    ],
    post: [
      "VLAN/trunk 변경 절차에 사전/사후 MAC, STP, LACP 확인을 추가합니다.",
      "루프 방지를 위해 BPDU guard, storm control, root guard 적용 범위를 점검합니다.",
      "스위치 포트 사용 현황과 패치 문서를 갱신합니다.",
      "반복 flap 포트는 케이블/GBIC/단말 NIC 점검 대상으로 등록합니다."
    ]
  },
  l3: {
    name: "L3 라우팅 장애",
    objective: "게이트웨이, 라우팅 테이블, 동적 라우팅, ACL, VRF, 비대칭 경로 문제를 분리합니다.",
    sla: "15분 내 경로 단절 위치 확인, 45분 내 라우팅 복구 또는 우회 경로 판단",
    escalation: "핵심 라우터, WAN, 동적 라우팅 장애가 확인되면 네트워크/회선 담당 호출",
    tags: ["L3", "Routing", "Gateway", "OSPF", "BGP"],
    triage: [
      "출발지와 목적지 사이 어느 구간까지 도달 가능한지 hop 단위로 확인합니다.",
      "단일 prefix 문제인지 다수 prefix 문제인지 라우팅 테이블 기준으로 분리합니다.",
      "최근 static route, dynamic routing, VRF, ACL, redistribution 변경 이력을 확인합니다.",
      "게이트웨이, HSRP/VRRP, 라우팅 프로토콜 neighbor 상태를 확인합니다.",
      "왕복 경로가 다른 비대칭 라우팅으로 방화벽 세션이 끊기는지 확인합니다."
    ],
    verify: [
      "라우팅 테이블의 next-hop, metric, administrative distance를 확인합니다.",
      "OSPF/BGP/EIGRP neighbor 상태와 route advertisement 여부를 확인합니다.",
      "VRF 또는 routing instance가 올바르게 매핑되었는지 확인합니다.",
      "ACL/PBR/route-map이 특정 트래픽만 우회 또는 차단하는지 확인합니다.",
      "회선 장애라면 carrier 상태와 양단 인터페이스 상태를 함께 확인합니다."
    ],
    commands: [
      "show ip route",
      "show ip interface brief",
      "show ip ospf neighbor",
      "show bgp summary",
      "traceroute target",
      "ping target source source-interface"
    ],
    mitigate: [
      "잘못된 static route 또는 route-map 변경은 직전 설정으로 롤백합니다.",
      "동적 라우팅 장애는 neighbor 재수립보다 원인 로그와 인터페이스 상태를 먼저 확인합니다.",
      "회선 장애 시 백업 경로 또는 임시 static route 적용 가능성을 검토합니다.",
      "비대칭 경로는 방화벽 경유 경로 일관성을 기준으로 우회안을 검토합니다."
    ],
    post: [
      "라우팅 변경 전후 경로 캡처와 영향 prefix 목록을 기록합니다.",
      "동적 라우팅 neighbor down 알림과 route count 변동 알림을 보완합니다.",
      "PBR/route-map 변경은 변경 관리 체크리스트에 별도 승인 항목으로 추가합니다.",
      "WAN 회선 장애라면 회선사 티켓과 SLA 시간을 기록합니다."
    ]
  },
  l4: {
    name: "L4 로드밸런서 장애",
    objective: "VIP, pool member, health check, persistence, SNAT, 세션 분산 문제를 확인합니다.",
    sla: "15분 내 VIP/pool 상태 확인, 45분 내 member 제외 또는 우회 판단",
    escalation: "대외 서비스 VIP 영향 또는 전체 pool down 시 인프라/서비스 담당 즉시 호출",
    tags: ["L4", "Load Balancer", "VIP", "Pool", "Health Check"],
    triage: [
      "장애가 VIP 접속 불가인지 특정 pool member 장애인지 먼저 분리합니다.",
      "최근 VIP, pool, monitor, SNAT, persistence, SSL offload 변경 이력을 확인합니다.",
      "pool member 상태가 down인지 up이지만 응답 지연인지 확인합니다.",
      "health check 실패 사유가 포트, 경로, 응답 코드, 인증, 방화벽 중 어디인지 확인합니다.",
      "client-side와 server-side 연결 로그를 분리하여 어느 구간에서 끊기는지 확인합니다."
    ],
    verify: [
      "VIP listener, pool member, monitor, profile, persistence 설정을 확인합니다.",
      "member별 connection 수, 응답 시간, error, reset 증가 여부를 확인합니다.",
      "SNAT pool 고갈 또는 source IP 보존 정책으로 return path가 깨지는지 확인합니다.",
      "health check URL이 애플리케이션 배포 후에도 유효한지 확인합니다.",
      "L7 정책이 함께 적용된 경우 URI/header 기반 라우팅 오류를 확인합니다."
    ],
    commands: [
      "curl -Iv https://vip",
      "curl -Iv http://pool-member:port/health",
      "show ltm virtual",
      "show ltm pool",
      "show ltm node",
      "tcpdump -nn host vip or host pool-member"
    ],
    mitigate: [
      "장애 member는 pool에서 임시 제외하고 남은 member 용량을 확인합니다.",
      "monitor 오탐이면 서비스 담당 확인 후 monitor 조건을 최소 범위로 보정합니다.",
      "SNAT 고갈이면 pool 확장 또는 timeout 조정을 검토합니다.",
      "VIP 설정 오류는 직전 정상 설정으로 롤백하고 접속 테스트를 반복합니다."
    ],
    post: [
      "member down 원인과 제외/복귀 시각을 타임라인으로 정리합니다.",
      "health check 경로와 애플리케이션 배포 정책의 의존성을 재검토합니다.",
      "pool 용량과 장애 시 잔여 capacity 기준을 문서화합니다.",
      "VIP 변경 시 사전 검증 항목에 client/server side 테스트를 추가합니다."
    ]
  },
  l7: {
    name: "L7 프록시/애플리케이션 게이트웨이 장애",
    objective: "HTTP 상태 코드, URI 라우팅, 헤더, 인증, SSL offload, WAF/프록시 정책 문제를 분리합니다.",
    sla: "15분 내 4xx/5xx/timeout 분류, 45분 내 라우팅 또는 정책 복구 판단",
    escalation: "대외 서비스 5xx 증가, 인증 장애, 프록시 전체 장애 시 서비스/보안 담당 동시 호출",
    tags: ["L7", "HTTP", "Proxy", "Gateway", "Routing"],
    triage: [
      "증상을 4xx, 5xx, timeout, redirect loop, login loop, 특정 URI 장애로 분류합니다.",
      "최근 라우팅 룰, 인증 연동, SSL offload, header rewrite, WAF 정책 변경 이력을 확인합니다.",
      "특정 URI, Method, Header, Cookie, Host 기반으로만 발생하는지 확인합니다.",
      "프록시 앞단과 후단의 응답 코드가 다른지 확인하여 어느 계층에서 오류가 생성되는지 분리합니다.",
      "사용자 입력값이나 토큰 등 민감 정보는 외부 도구에 복사하지 않습니다."
    ],
    verify: [
      "access log와 error log에서 upstream status, response time, request id를 확인합니다.",
      "upstream 서버별 5xx 비율과 특정 member 편중 여부를 확인합니다.",
      "Host header, X-Forwarded-For, X-Forwarded-Proto 전달이 애플리케이션 기대와 일치하는지 확인합니다.",
      "인증/SSO 연동 장애라면 redirect URI, cookie domain, session timeout을 확인합니다.",
      "캐시/CDN/프록시 레이어가 오래된 응답을 제공하는지 확인합니다."
    ],
    commands: [
      "curl -Iv https://service/path",
      "curl -H \"Host: example.com\" http://gateway/path",
      "curl -k -L https://service/login",
      "grep request-id access.log",
      "tail -f error.log",
      "nginx -t 또는 proxy config validation"
    ],
    mitigate: [
      "잘못된 라우팅 룰은 직전 정상 룰로 롤백하고 특정 URI 테스트를 수행합니다.",
      "단일 upstream 장애라면 해당 member를 제외하고 오류율 변화를 확인합니다.",
      "인증 redirect 문제가 있으면 임시 공지 후 SSO 설정과 cookie domain을 복구합니다.",
      "캐시 오염이면 purge 범위와 사용자 영향도를 확인한 뒤 최소 범위로 제거합니다."
    ],
    post: [
      "URI별 오류율, upstream 상태, 변경 이력을 기반으로 원인을 정리합니다.",
      "L7 정책 변경 전 staging 검증과 header/redirect 테스트를 체크리스트에 추가합니다.",
      "request id 기반 추적이 가능하도록 로그 포맷과 대시보드를 보완합니다.",
      "WAF/프록시/애플리케이션 간 책임 경계를 문서화합니다."
    ]
  }
};

const severityMap = {
  sev1: {
    label: "SEV-1",
    cadence: "15분 단위 공유",
    decision: "전체 영향 가능성이 있으므로 즉시 상황방을 만들고 담당 리더에게 보고합니다.",
    audience: "전사/핵심 서비스"
  },
  sev2: {
    label: "SEV-2",
    cadence: "30분 단위 공유",
    decision: "주요 서비스 영향 가능성이 있으므로 담당 조직과 원인 분석 상황을 공유합니다.",
    audience: "주요 사용자/업무 부서"
  },
  sev3: {
    label: "SEV-3",
    cadence: "60분 단위 공유",
    decision: "일부 사용자 영향으로 판단하고 재현 조건과 우회 방법을 우선 확인합니다.",
    audience: "영향 사용자"
  },
  sev4: {
    label: "SEV-4",
    cadence: "필요 시 공유",
    decision: "문의 또는 점검 수준으로 분류하고 표준 절차에 따라 확인합니다.",
    audience: "요청자"
  }
};

const stageMap = {
  detect: "장애 인지",
  triage: "원인 분석 중",
  mitigate: "우회/복구 조치",
  recover: "복구 확인",
  postmortem: "사후 정리"
};

const impactMap = {
  internal: "내부 사용자",
  external: "외부 사용자",
  branch: "특정 지점/망",
  customer: "고객/대외 서비스",
  unknown: "확인 중"
};

const diagramFlows = {
  dns: [
    ["Client", "사용자 요청"],
    ["Resolver", "내부/외부 DNS"],
    ["Authoritative DNS", "권한 DNS"],
    ["Record", "A/CNAME/NS/SOA"],
    ["Service", "대상 서비스"]
  ],
  ssl: [
    ["Client", "브라우저/앱"],
    ["DNS", "서비스 해석"],
    ["TLS Endpoint", "WAF/LB/CDN"],
    ["Certificate", "CN/SAN/Chain"],
    ["Backend", "후단 서비스"]
  ],
  network: [
    ["User Segment", "사용자 구간"],
    ["Access", "스위치/AP"],
    ["Firewall", "정책/NAT"],
    ["Routing", "L3/WAN"],
    ["Service", "대상 시스템"]
  ],
  server: [
    ["Client", "요청"],
    ["VIP/Gateway", "접속 지점"],
    ["Server", "CPU/Memory/Disk"],
    ["Process", "서비스 프로세스"],
    ["Dependency", "DB/API/Storage"]
  ],
  vpn: [
    ["User", "원격 사용자"],
    ["VPN Gateway", "터널"],
    ["AAA/MFA", "인증"],
    ["Internal Network", "사내망"],
    ["Target System", "업무 시스템"]
  ],
  waf: [
    ["Client", "요청"],
    ["DNS", "서비스 해석"],
    ["WAF Policy", "정책"],
    ["Signature", "Violation"],
    ["Backend Pool", "후단 서버"]
  ],
  nac: [
    ["Endpoint", "단말"],
    ["Switch/AP", "접속 포트"],
    ["NAC", "정책 판단"],
    ["RADIUS/AD", "인증"],
    ["VLAN/ACL", "접근 제어"]
  ],
  edr: [
    ["Endpoint", "단말"],
    ["Sensor", "탐지"],
    ["EDR Console", "이벤트"],
    ["Isolation", "격리/해제"],
    ["Response", "조치/보고"]
  ],
  firewall: [
    ["Source", "출발지"],
    ["Zone", "보안 구간"],
    ["Policy", "허용/차단"],
    ["NAT/SNAT", "주소 변환"],
    ["Destination", "목적지"]
  ],
  cableGbic: [
    ["Device A", "양단 장비"],
    ["Port", "인터페이스"],
    ["Cable", "패치/광케이블"],
    ["GBIC/SFP", "광모듈"],
    ["Device B", "대상 장비"]
  ],
  l2: [
    ["Endpoint", "단말/서버"],
    ["Access Port", "VLAN"],
    ["Switch", "MAC/STP"],
    ["Trunk/LAG", "업링크"],
    ["Gateway", "L3 경계"]
  ],
  l3: [
    ["Source", "출발지"],
    ["Gateway", "기본 게이트웨이"],
    ["Route Table", "경로"],
    ["Dynamic Routing", "OSPF/BGP"],
    ["Destination", "목적지"]
  ],
  l4: [
    ["Client", "사용자"],
    ["DNS", "서비스 해석"],
    ["VIP", "Virtual Server"],
    ["Load Balancer", "L4"],
    ["Pool Member", "서버"]
  ],
  l7: [
    ["Client", "요청"],
    ["DNS", "서비스 해석"],
    ["Proxy/Gateway", "L7"],
    ["Route Policy", "URI/Header"],
    ["Upstream", "애플리케이션"]
  ]
};

const elements = {
  scenario: document.querySelector("#scenarioSelect"),
  severity: document.querySelector("#severitySelect"),
  stage: document.querySelector("#stageSelect"),
  impact: document.querySelector("#impactSelect"),
  includeCommands: document.querySelector("#includeCommands"),
  includeComms: document.querySelector("#includeComms"),
  includeRollback: document.querySelector("#includeRollback"),
  includePost: document.querySelector("#includePost"),
  generate: document.querySelector("#generateButton"),
  copy: document.querySelector("#copyButton"),
  print: document.querySelector("#printButton"),
  objective: document.querySelector("#objectiveText"),
  sla: document.querySelector("#slaText"),
  escalation: document.querySelector("#escalationText"),
  runbookTitle: document.querySelector("#runbookTitle"),
  updated: document.querySelector("#updatedText"),
  runbookGrid: document.querySelector("#runbookGrid"),
  timelineGrid: document.querySelector("#timelineGrid"),
  commandGrid: document.querySelector("#commandGrid"),
  diagramFlow: document.querySelector("#diagramFlow"),
  internalMessage: document.querySelector("#internalMessage"),
  externalMessage: document.querySelector("#externalMessage"),
  executiveMessage: document.querySelector("#executiveMessage"),
  recoveryMessage: document.querySelector("#recoveryMessage"),
  postmortemOutput: document.querySelector("#postmortemOutput"),
  incidentStart: document.querySelector("#incidentStartInput"),
  incidentEnd: document.querySelector("#incidentEndInput"),
  cause: document.querySelector("#causeInput"),
  action: document.querySelector("#actionInput"),
  copyCommands: document.querySelector("#copyCommandsButton"),
  refreshPostmortem: document.querySelector("#refreshPostmortemButton"),
  cardTemplate: document.querySelector("#runbookCardTemplate"),
  toast: document.querySelector("#toast")
};

function init() {
  Object.entries(runbooks).forEach(([key, runbook]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = runbook.name;
    elements.scenario.appendChild(option);
  });

  elements.scenario.value = "network";
  bindEvents();
  generate();
}

function bindEvents() {
  [
    elements.scenario,
    elements.severity,
    elements.stage,
    elements.impact,
    elements.includeCommands,
    elements.includeComms,
    elements.includeRollback,
    elements.includePost
  ].forEach((element) => element.addEventListener("change", generate));

  elements.generate.addEventListener("click", generate);
  elements.copy.addEventListener("click", copyAll);
  elements.print.addEventListener("click", () => window.print());
  elements.copyCommands.addEventListener("click", copyCommands);
  elements.refreshPostmortem.addEventListener("click", () => renderPostmortem(getContext()));

  document.querySelectorAll(".tabbar button").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", () => copyText(document.querySelector(`#${button.dataset.copyTarget}`).textContent));
  });
}

function generate() {
  const context = getContext();
  const sections = buildSections(context);
  renderSummary(context);
  renderRunbook(context, sections);
  renderTimeline(context);
  renderCommands(context);
  renderDiagram(context);
  renderMessages(context);
  renderPostmortem(context);
}

function getContext() {
  const runbook = runbooks[elements.scenario.value];
  const severity = severityMap[elements.severity.value];
  return {
    runbook,
    severity,
    stage: stageMap[elements.stage.value],
    impact: impactMap[elements.impact.value],
    includeCommands: elements.includeCommands.checked,
    includeComms: elements.includeComms.checked,
    includeRollback: elements.includeRollback.checked,
    includePost: elements.includePost.checked
  };
}

function buildSections(context) {
  const sections = [
    {
      title: "1. 초동 대응",
      items: [
        `${context.stage} 단계로 분류하고 영향 범위는 '${context.impact}' 기준으로 기록합니다.`,
        context.severity.decision,
        "장애 접수 시각, 최초 탐지 경로, 담당자, 현재 사용자 영향 여부를 타임라인에 남깁니다.",
        "회사 IP, 계정, 장비명, 고객명 등 민감 정보는 외부 도구나 공개 채널에 입력하지 않습니다.",
        "복구보다 증거 보존이 중요한 상황인지 판단하고, 필요한 로그와 화면 캡처를 먼저 확보합니다."
      ]
    },
    {
      title: "2. 원인 분리",
      items: context.runbook.triage
    },
    {
      title: "3. 상세 점검",
      items: context.runbook.verify
    }
  ];

  if (context.includeCommands) {
    sections.push({
      title: "4. 점검 명령",
      items: context.runbook.commands
    });
  }

  if (context.includeRollback) {
    sections.push({
      title: "5. 우회/복구 판단",
      items: context.runbook.mitigate
    });
  }

  sections.push({
    title: "6. 에스컬레이션 기준",
    items: [
      context.runbook.escalation,
      `${context.severity.label} 기준으로 ${context.severity.cadence} 원칙을 적용합니다.`,
      "영향 범위가 확대되거나 원인 분리가 지연되면 담당 조직, 서비스 오너, 보안 담당에게 동시에 공유합니다.",
      "임시 정책, 예외, 우회 조치는 만료 시각과 승인자를 반드시 명시합니다."
    ]
  });

  if (context.includePost) {
    sections.push({
      title: "7. 복구 후 점검",
      items: context.runbook.post
    });
  }

  return sections;
}

function renderSummary(context) {
  elements.objective.textContent = context.runbook.objective;
  elements.sla.textContent = context.runbook.sla;
  elements.escalation.textContent = context.runbook.escalation;
  elements.runbookTitle.textContent = `${context.runbook.name} Runbook`;
  elements.updated.textContent = `생성됨 · ${new Date().toLocaleString("ko-KR")}`;
}

function renderRunbook(context, sections) {
  elements.runbookGrid.innerHTML = "";

  sections.forEach((section) => {
    const card = elements.cardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector("h3").textContent = section.title;
    const list = card.querySelector("ol");
    section.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    card.querySelector("button").addEventListener("click", () => copyText(`${section.title}\n${section.items.map((item, index) => `${index + 1}. ${item}`).join("\n")}`));
    elements.runbookGrid.appendChild(card);
  });
}

function renderMessages(context) {
  const serviceText = context.impact === "확인 중" ? "일부 서비스" : context.impact;
  const base = `[${context.severity.label} / ${context.runbook.name}]\n현재 ${serviceText} 영향 가능성이 확인되어 ${context.stage} 단계로 대응 중입니다.`;

  elements.internalMessage.textContent = `${base}

- 현재 상태: ${context.stage}
- 영향 범위: ${context.impact}
- 대응 방향: ${context.runbook.objective}
- 공유 주기: ${context.severity.cadence}
- 다음 업데이트: 원인 분리 또는 우회 조치 확인 시점

민감 정보는 본문에 포함하지 않고, 세부 로그와 자산 정보는 사내 승인된 채널에서만 공유하겠습니다.`;

  elements.externalMessage.textContent = `[서비스 안내]
현재 일부 이용 환경에서 서비스 이용이 원활하지 않을 수 있어 담당 부서에서 확인 중입니다.

- 영향 범위: 확인 중
- 조치 상태: 원인 분석 및 복구 조치 진행 중
- 추가 안내: 확인되는 대로 후속 공지 예정

이용에 불편을 드려 죄송합니다.`;

  elements.executiveMessage.textContent = `[임원 보고]
현재 ${context.runbook.name} 관련 ${context.severity.label} 수준의 영향 가능성이 확인되어 인프라 구간 점검을 진행 중입니다.

- 현재 단계: ${context.stage}
- 영향 범위: ${context.impact}
- 대응 방향: ${context.runbook.objective}
- 보고 기준: ${context.severity.cadence}

영향 범위와 조치 방향이 구체화되는 즉시 추가 보고드리겠습니다.`;

  elements.recoveryMessage.textContent = `[복구 완료 공유]
${context.runbook.name} 관련 영향은 현재 복구 완료되어 정상 여부를 모니터링 중입니다.

- 복구 상태: 정상화 확인
- 후속 조치: 재발 방지 항목 정리 및 모니터링 강화
- 요청 사항: 동일 증상 재발 시 발생 시각과 화면 증상을 함께 전달 부탁드립니다.`;
}

function renderTimeline(context) {
  const timeline = [
    {
      time: "T+0 ~ 5분",
      title: "접수 및 영향 범위 확인",
      items: [
        "장애 접수 시각, 탐지 경로, 증상, 영향 범위를 기록합니다.",
        `${context.runbook.name} 기준으로 우선 ${context.impact} 영향 여부를 확인합니다.`,
        "모니터링 알람, 사용자 문의, 최근 변경 작업 여부를 함께 확인합니다."
      ]
    },
    {
      time: "T+5 ~ 15분",
      title: "1차 원인 분리",
      items: [
        context.runbook.triage[0],
        context.runbook.triage[1],
        "서비스 영향이 확정되면 내부 공유 문구로 1차 상황을 공유합니다."
      ]
    },
    {
      time: "T+15 ~ 30분",
      title: "우회/복구 판단",
      items: [
        context.runbook.verify[0],
        context.runbook.mitigate[0],
        "임시 조치가 필요하면 범위, 기간, 승인자, 제거 일정을 먼저 확정합니다."
      ]
    },
    {
      time: "T+30분 이상",
      title: "에스컬레이션 및 지속 공유",
      items: [
        context.runbook.escalation,
        `${context.severity.label} 기준으로 ${context.severity.cadence} 원칙을 유지합니다.`,
        "복구 계획, 우회 계획, 다음 업데이트 시각을 명확히 공유합니다."
      ]
    },
    {
      time: "복구 후",
      title: "검증 및 사후 기록",
      items: [
        context.runbook.post[0],
        "장애 시작/복구 시간, 영향 범위, 원인, 조치 내용, 재발 방지를 정리합니다.",
        "Runbook에서 누락된 점검 항목이 있으면 템플릿 개선 항목으로 남깁니다."
      ]
    }
  ];

  elements.timelineGrid.innerHTML = "";
  timeline.forEach((block) => {
    const item = document.createElement("article");
    item.className = "timeline-item";
    item.innerHTML = `<div class="timeline-time"></div><div class="timeline-card"><h3></h3><ol></ol></div>`;
    item.querySelector(".timeline-time").textContent = block.time;
    item.querySelector("h3").textContent = block.title;
    const list = item.querySelector("ol");
    block.items.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });
    elements.timelineGrid.appendChild(item);
  });
}

function renderCommands(context) {
  elements.commandGrid.innerHTML = "";
  context.runbook.commands.forEach((command, index) => {
    const card = document.createElement("article");
    card.className = "command-card";
    card.innerHTML = `<div class="card-title"><h3></h3><button type="button">복사</button></div><code></code><p></p>`;
    card.querySelector("h3").textContent = `Command ${index + 1}`;
    card.querySelector("code").textContent = command;
    card.querySelector("p").textContent = getCommandHint(command);
    card.querySelector("button").addEventListener("click", () => copyText(command));
    elements.commandGrid.appendChild(card);
  });
}

function getCommandHint(command) {
  if (command.includes("curl")) return "HTTP 응답 코드, TLS, redirect, upstream 반응을 빠르게 확인합니다.";
  if (command.includes("show")) return "네트워크/보안 장비의 현재 상태와 카운터를 확인합니다.";
  if (command.includes("Test-NetConnection") || command.includes("telnet")) return "TCP 포트 도달성과 방화벽 차단 가능성을 확인합니다.";
  if (command.includes("tcpdump")) return "패킷이 어느 구간까지 도달하는지 확인합니다.";
  if (command.includes("dig") || command.includes("nslookup")) return "DNS 응답과 권한/재귀 DNS 차이를 확인합니다.";
  return "상황에 맞게 민감 값을 실제 운영 환경에서만 치환해 사용합니다.";
}

function renderDiagram(context) {
  const key = elements.scenario.value;
  const flow = diagramFlows[key] || diagramFlows.network;
  elements.diagramFlow.innerHTML = "";
  flow.forEach(([title, desc], index) => {
    const node = document.createElement("div");
    node.className = "diagram-node";
    node.innerHTML = `<strong></strong><span></span>`;
    node.querySelector("strong").textContent = title;
    node.querySelector("span").textContent = desc;
    elements.diagramFlow.appendChild(node);

    if (index < flow.length - 1) {
      const arrow = document.createElement("div");
      arrow.className = "diagram-arrow";
      arrow.textContent = "→";
      elements.diagramFlow.appendChild(arrow);
    }
  });
}

function renderPostmortem(context) {
  const start = elements.incidentStart.value.trim() || "(장애 시작 시간)";
  const end = elements.incidentEnd.value.trim() || "(복구 시간)";
  const cause = elements.cause.value.trim() || `${context.runbook.name} 관련 원인 분석 결과를 기준으로 작성`;
  const action = elements.action.value.trim() || context.runbook.mitigate[0];

  elements.postmortemOutput.textContent = `[장애 종료 보고]

1. 장애 개요
- 장애 유형: ${context.runbook.name}
- 심각도: ${context.severity.label}
- 발생 시간: ${start}
- 복구 시간: ${end}
- 영향 범위: ${context.impact}

2. 원인
- ${cause}

3. 조치 내용
- 초동 확인: ${context.runbook.triage[0]}
- 임시 조치: ${action}
- 최종 복구: 정상화 확인 후 모니터링 진행

4. 재발 방지
- ${context.runbook.post[0]}
- 모니터링 기준 및 알림 임계치 보완
- 변경 작업 사전 검증 항목 강화
- Runbook 업데이트 및 담당자 공유`;
}

function switchView(view) {
  document.querySelectorAll(".tabbar button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".output-view").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${view}View`);
  });
}

function copyAll() {
  const context = getContext();
  const sections = buildSections(context);
  const text = [
    `# ${context.runbook.name} Runbook`,
    `심각도: ${context.severity.label}`,
    `단계: ${context.stage}`,
    `영향 범위: ${context.impact}`,
    "",
    ...sections.flatMap((section) => [
      section.title,
      ...section.items.map((item, index) => `${index + 1}. ${item}`),
      ""
    ])
  ].join("\n");
  copyText(text);
}

function copyCommands() {
  const context = getContext();
  copyText(context.runbook.commands.join("\n"));
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.top = "-999px";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  showToast("복사 완료");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 1700);
}

init();
