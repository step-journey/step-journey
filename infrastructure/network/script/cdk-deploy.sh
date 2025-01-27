#!/bin/bash

set -e  # 에러 발생 시 즉시 종료

cd "$(dirname "$0")"  # script 폴더로 이동
cd ..                 # network 루트 폴더로 이동

THIS_SCRIPT_NAME=$(basename "$0")
STACK_NAME="NetworkStack"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%S')][$THIS_SCRIPT_NAME] $1"
}

# 1) 환경 입력 받기
echo -e "배포하실 환경을 입력하세요 (main/shared/dev/prod)"
read -r ENVIRONMENT

# 2) 환경에 따라 AWS_PROFILE 설정
case "$ENVIRONMENT" in
  "main")
    AWS_PROFILE="cac-sso-main"
    export AWS_PROFILE
    ;;
  "shared")
    AWS_PROFILE="cac-sso-shared-service"
    export AWS_PROFILE
    ;;
  "dev")
    AWS_PROFILE="cac-sso-workloads-dev"
    export AWS_PROFILE
    ;;
  "prod")
    AWS_PROFILE="cac-sso-workloads-prod"
    export AWS_PROFILE

    # 운영 배포 재확인
    echo -e "\033[31m정말 운영환경(prod)에 배포하시겠습니까? (yes/no): \033[0m"
    read -r confirm
    if [[ "$confirm" != "yes" ]]; then
        log "배포가 취소되었습니다."
        exit 0
    fi
    ;;
  *)
    log "잘못된 환경입니다: $ENVIRONMENT (main/shared/dev/prod)"
    exit 1
    ;;
esac

start_time=$(date +%s)

LOG_FILE=$(mktemp)
log "CDK 배포 로그: $LOG_FILE"
log "선택된 환경: $ENVIRONMENT, PROFILE: $AWS_PROFILE, STACK_NAME: $STACK_NAME"

# CDK 배포 시작
log "CDK 배포 시작 (profile=$AWS_PROFILE)"
deploy_start_time=$(date +%s)

if ! cdk deploy \
    "$STACK_NAME" \
    --profile "$AWS_PROFILE" \
    --require-approval never \
    >> "$LOG_FILE" 2>&1; then
    log "에러: CDK 배포 실패"
    cat "$LOG_FILE"
    exit 1
fi

deploy_end_time=$(date +%s)
log "CDK 배포 완료"

# CloudFormation Stack ID 조회
STACK_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$AWS_PROFILE" \
    --query "Stacks[0].StackId" \
    --output text 2>>"$LOG_FILE")

if [[ -z "$STACK_ID" ]]; then
    log "Stack ID를 가져올 수 없습니다. Stack이 존재하지 않거나 권한 문제가 있을 수 있습니다."
    cat "$LOG_FILE"
    exit 1
fi

# Stack URL 인코딩
ENCODED_STACK_ID=$(echo "$STACK_ID" | sed 's/\//%2F/g' | sed 's/:/%3A/g')
STACK_URL="https://ap-northeast-2.console.aws.amazon.com/cloudformation/home?region=ap-northeast-2#/stacks/events?stackId=${ENCODED_STACK_ID}"

log "CloudFormation Stack ID: $STACK_ID"
log "CloudFormation Stack URL: $STACK_URL"

# 배포 시간 및 전체 실행 시간 계산
deploy_time=$((deploy_end_time - deploy_start_time))
total_time=$((deploy_end_time - start_time))
log "CDK 배포 소요 시간: ${deploy_time}초"
log "스크립트 전체 실행 시간: ${total_time}초"

rm "$LOG_FILE"
