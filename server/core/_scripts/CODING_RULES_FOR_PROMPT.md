### 1. 에러 처리

- `github.com/pkg/errors`나 Go 1.20+의 `errors` wrapping을 사용해 스택 추적이 가능하도록 에러를 감싼다.
- 에러 메시지는 소문자로 시작하고, 마침표 없이 간결하게 작성한다.
- 최초 에러 발생 지점에서 한 번만 스택을 쌓는 것이 원칙이며, 그 밖에서는 필요한 맥락만 추가한다.
- 에러 로깅은 가능하면 상위 레이어(미들웨어 등)에서 일괄 처리해 중복 로깅을 피한다.
- `defer`에서 발생하는 에러도 무시하지 않고 로깅한다.
- 특별한 분기 처리가 필요한 경우에만 Sentinel Error를 사용하고, 그렇지 않을 때는 `errors.Is`, `errors.As` 등을 통해 에러를 식별한다.
- 에러 메시지는 소문자로 시작하고, 마침표나 "failed to" 같은 접두어 없이 간결하게 작성한다(예: `"connect db"`).
- Sentinel Error는 특별한 분기 처리가 필요한 경우에만 사용하고, 그렇지 않으면 단순 wrapping이나 반환으로 처리한다.

### 2. Panic / Recover / must

- 프로덕션 환경에선 `panic`이나 `fatal`을 사용하지 않도록 하고, 서버 초기화(main) 시점에서만 필요할 때 제한적으로 사용한다.
- `panic` 가능성이 있는 함수는 `MustXxx()`처럼 이름에 `must`를 포함해 의도적으로 구분한다(주로 초기화 단계에서만 호출).
- 고루틴 내에서 발생하는 `panic`을 상위로 전파하지 않도록 `recover`를 사용하는 `panic safe goroutine` 패턴을 고려한다.
- 여러 고루틴의 에러를 모아야 할 때는 `sync.WaitGroup`이나 `errgroup`을 사용한다.
- Named return은 가독성을 해칠 수 있으므로 지양한다.

### 3. 전역 변수 지양 / 의존성 주입(DI)

- DB 클라이언트 등 공용 자원을 전역 변수로 두기보다 생성자나 함수 파라미터를 통해 주입한다.
- 인터페이스와 생성자 함수를 사용해 의존성을 주입하면 테스트와 확장에 유리하다.
- 싱글턴 패턴은 가급적 지양하고, 필요한 경우에도 가능한 한 명시적으로 주입 과정을 보이도록 한다.
- 전역 싱글톤 패턴보다는 인터페이스 기반 설계로 확장성 있는 구조를 권장한다.

### 3. DB & SQL

- DB 커넥션 풀 설정을 최적화하고, 트랜잭션 처리나 커넥션 종료 등의 자원 관리를 체계적으로 한다.
- `golang-migrate` 같은 툴을 사용해 마이그레이션과 롤백 스크립트를 함께 작성한다.
- DB 접근 로직은 Repository(`internal/repository`)에 집중시키고, 인터페이스와 구현체를 분리해 확장성을 높인다.
- **간단한 쿼리, 복잡한 동적 쿼리 작성 방법 적어야함**
- SQL 쿼리는 `sqlc` 등을 이용해 타입 세이프하게 관리하거나 별도 디렉토리에 모아서 유지한다.
    - SQL 쿼리를 모듈화하거나 별도 디렉토리(`internal/db/queries` 등)에 분리해 관리하고, 트랜잭션 경계를 명확히 한다.

### 4. HTTP 핸들러 / 라우팅 / 외부 호출

- `net/http`의 `ServeMux` 사용해 엔드포인트를 명확히 분리한다.
    - Go 1.21부터 net/http의 ServeMux가 "/api/{version}/tickets/{id}" 같은 패턴 매칭을 지원함
- `/health`, `/metrics` 같은 상태 체크용 API는 별도로 분리해 관리한다.
- 핸들러 로직에는 비즈니스 로직을 최소화하고, 주로 요청 파싱·응답 처리만 담당하도록 설계한다.
- 외부/내부 HTTP 호출 시에는 `http.Client`를 재사용하고, `MaxIdleConns`, `MaxIdleConnsPerHost` 등 커넥션 풀 설정을 최적화한다.
- HTTP 응답의 `Body`는 사용 후 `io.Copy(io.Discard, resp.Body)`로 버퍼를 비운 뒤 반드시 `resp.Body.Close()`를 호출해 커넥션을 재활용 가능하게 한다.
- 미들웨어를 통해 panic 복구, 로깅, 인증 등의 공통 처리를 체인 형태로 구성한다.

### 5. 컨텍스트(Context) 사용

- DB 접근, 외부 API 호출 등 블로킹 연산이 포함된 함수는 반드시 `context.Context`를 파라미터로 받아 타임아웃/취소 처리에 대응한다.
- `context.TODO()`보다 `context.Background()`를 우선적으로 사용하고, 필요한 경우 명시적으로 타임아웃·데드라인을 설정한다.
- 함수 시그니처에서는 `ctx`를 최우선 파라미터로 둔다.
- 무한 대기나 고루틴 누수를 방지하기 위해 타임아웃이나 `cancel` 함수를 적절히 사용한다.

### 6. 시간 / 타임존 / Duration 처리

- 시간 관련 상수는`int` 대신 `time.Duration` 타입(`5 * time.Second` 등)으로 명시적으로 관리한다.
- 타임존 처리는 `time.LoadLocation` 등을 통해 명시적으로 UTC나 KST 등을 설정하고 사용한다.

### 7. 문자열 처리 (rune, UTF-8)

- 문자열을 순회할 때는 `for i, r := range s`를 사용해 UTF-8 멀티바이트를 올바르게 처리한다.
- 문자열 길이를 구할 때는 `len(str)` 대신 `utf8.RuneCountInString(str)`를 사용해 실제 문자 수를 센다.

### 8. 네이밍 컨벤션(함수, 인터페이스, etc.)

- Named return은 함수 추적을 복잡하게 만들 수 있으므로 되도록 사용하지 않는다.
- 조건문이 복잡해질 때는 에러나 특정 조건을 빠르게 반환(Early Return)해 중첩을 최소화한다.
- `import`는 표준 라이브러리, 서드파티 라이브러리, 내부 패키지 순으로 그룹화한다.
- 함수에 옵션 파라미터가 많다면 `Functional Options` 패턴을 사용해 확장성을 높인다(예: `WithXxx()` 함수로 설정).
- 함수 시그니처에서 `context.Context`는 항상 맨 앞에 두고, 그다음 무거운 파라미터(DB, client 등), 마지막에 경량 타입을 배치한다.
- 공개 구조체·함수는 PascalCase, 비공개·지역 변수·메서드 리시버는 camelCase를 사용한다.
- 인터페이스는 동사+"er" 형태(`Reader`, `Logger` 등)로 짓는다.
- 단일 조회는 `Get`, 복수 조회는 `List` 접두사를 사용한다(`GetUser`, `ListUsers` 등).
- `information`, `details`, `summary` 등 모호한 단어 대신 구체적이고 일관된 명칭을 사용한다.
- 상수(const)는 CamelCase로 선언하고, `DEFAULT_PAGE_SIZE`처럼 대문자 스네이크 케이스는 지양한다.