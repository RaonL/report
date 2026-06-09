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
  referenceGrid: document.querySelector("#referenceGrid"),
  internalMessage: document.querySelector("#internalMessage"),
  externalMessage: document.querySelector("#externalMessage"),
  recoveryMessage: document.querySelector("#recoveryMessage"),
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
  renderMessages(context);
  renderReference(context);
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

  elements.recoveryMessage.textContent = `[복구 완료 공유]
${context.runbook.name} 관련 영향은 현재 복구 완료되어 정상 여부를 모니터링 중입니다.

- 복구 상태: 정상화 확인
- 후속 조치: 재발 방지 항목 정리 및 모니터링 강화
- 요청 사항: 동일 증상 재발 시 발생 시각과 화면 증상을 함께 전달 부탁드립니다.`;
}

function renderReference(context) {
  const cards = [
    {
      title: "민감 정보 취급 기준",
      body: "Runbook에는 실제 IP, 도메인, 장비명, 계정, 고객명, 로그 원문을 입력하지 않습니다. 외부 배포 도구는 절차 템플릿과 일반 점검 기준만 다룹니다.",
      tags: ["No IP", "No Account", "No Raw Log"]
    },
    {
      title: "상황 공유 원칙",
      body: `${context.severity.label} 상황은 ${context.severity.cadence}를 기준으로 공유합니다. 원인 미확정 상태에서는 단정 표현을 피하고 현재 확인된 사실, 진행 중인 조치, 다음 업데이트 기준만 전달합니다.`,
      tags: ["Fact Only", "Cadence", "Timeline"]
    },
    {
      title: "임시 조치 원칙",
      body: "방화벽 허용, WAF 예외, NAC 예외, 인증 우회 같은 임시 조치는 범위, 기간, 승인자, 제거 일정을 반드시 기록합니다.",
      tags: ["Scope", "Expiry", "Approval"]
    },
    {
      title: "사후 정리 기준",
      body: "장애 종료 후에는 타임라인, 원인, 사용자 영향, 복구 조치, 재발 방지, 모니터링 개선 항목을 분리하여 정리합니다.",
      tags: ["Timeline", "RCA", "Action Items"]
    },
    {
      title: "현재 Runbook 태그",
      body: context.runbook.tags.join(", "),
      tags: context.runbook.tags
    }
  ];

  elements.referenceGrid.innerHTML = "";
  cards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "reference-card";
    article.innerHTML = `<strong></strong><p></p><div class="tag-row"></div>`;
    article.querySelector("strong").textContent = card.title;
    article.querySelector("p").textContent = card.body;
    const tagRow = article.querySelector(".tag-row");
    card.tags.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className = "tag";
      tagElement.textContent = tag;
      tagRow.appendChild(tagElement);
    });
    elements.referenceGrid.appendChild(article);
  });
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
