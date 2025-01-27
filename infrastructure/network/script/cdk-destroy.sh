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
echo -e "어느 환경 스택을 삭제(destroy)하시겠습니까? (main/shared/dev/prod)"
read -r ENVIRONMENT

# 2) 환경별 AWS_PROFILE, STACK_NAME 설정
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

    # 운영환경 삭제 재확인
    echo -e "\033[31m정말 운영환경(prod)을 삭제하시겠습니까? (yes/no): \033[0m"
    read -r confirm
    if [[ "$confirm" != "yes" ]]; then
        log "스택 파괴가 취소되었습니다."
        exit 0
    fi
    ;;
  *)
    log "잘못된 환경입니다: $ENVIRONMENT (main/shared/dev/prod)"
    exit 1
    ;;
esac

start_time=$(date +%s)
log "선택된 환경: $ENVIRONMENT, PROFILE: $AWS_PROFILE, STACK_NAME: $STACK_NAME"

# 사용자에게 최종 파괴 의사를 묻기
echo -e "\033[31m정말 스택($STACK_NAME)을 파괴(destroy) 하시겠습니까?\033[0m"
echo -e "확인을 위해 '\033[31mdestroy $STACK_NAME stack\033[0m' 을 입력하세요."
read -r final_confirm

if [[ "$final_confirm" != "destroy $STACK_NAME stack" ]]; then
    log "스택 파괴가 취소되었습니다."
    exit 0
fi

LOG_FILE=$(mktemp)
log "스택 파괴(destroy) 로그: $LOG_FILE"

# CDK 스택 파괴 시작
log "CDK Destroy 시작 (profile=$AWS_PROFILE)"
destroy_start_time=$(date +%s)

if ! cdk destroy \
    "$STACK_NAME" \
    --profile "$AWS_PROFILE" \
    --force \
    >> "$LOG_FILE" 2>&1; then
    log "에러: CDK Destroy 실패"
    cat "$LOG_FILE"
    exit 1
fi

destroy_end_time=$(date +%s)
log "CDK Destroy 완료"

# CloudFormation Stack 존재 여부 확인
if aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$AWS_PROFILE" \
    --query "Stacks[0].StackId" \
    --output text >> /dev/null 2>&1; then
    log "경고: 스택이 아직 삭제되지 않았거나 잔류 리소스가 남아있을 수 있습니다."
else
    log "정상적으로 스택이 삭제되었거나 이미 존재하지 않습니다."
fi

# 파괴에 걸린 시간 및 전체 실행 시간 계산
destroy_time=$((destroy_end_time - destroy_start_time))
total_time=$((destroy_end_time - start_time))
log "CDK Destroy 소요 시간: ${destroy_time}초"
log "스크립트 전체 실행 시간: ${total_time}초"

rm "$LOG_FILE"
