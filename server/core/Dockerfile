# -----------------------
# (1) 빌드 스테이지: builder
#     - Go 컴파일러가 포함된 공식 이미지(golang:1.23.5-alpine)를 사용
#     - 앱을 빌드하고 결과물(myapp 바이너리)을 산출
# -----------------------
FROM golang:1.23.5-alpine AS builder

ARG ENV

# 빌드 시 필요한 환경 변수들
ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=arm64

# 작업 디렉토리 생성/이동
WORKDIR /app

# go.mod, go.sum 만 먼저 복사해서 의존성 다운로드 (레이어 캐시 활용)
COPY go.mod go.sum ./
RUN go mod download

# 나머지 소스 파일 복사
COPY . .

# 실제 빌드 (myapp 바이너리 생성)
RUN go build -o myapp -ldflags "-X main.env=${ENV}" ./cmd/api

# -----------------------
# (2) 런타임 스테이지: 최종 이미지
#     - Alpine 리눅스 기반의 최소 환경에, 빌드 산출물(myapp)과
#       필요한 리소스(configs, migrations)를 복사해서 완성
# -----------------------
FROM alpine:3.18

# UTC로 심볼릭 링크 지정
RUN ln -snf /usr/share/zoneinfo/UTC /etc/localtime && echo "UTC" > /etc/timezone

# 빌드 결과 및 설정, 데이터 폴더 복사
COPY --from=builder /app/myapp /myapp
COPY --from=builder /app/configs /configs
COPY --from=builder /app/migrations /migrations

# 컨테이너 시작 시 실행될 기본 명령
ENTRYPOINT ["/myapp"]
CMD ["serve"]

