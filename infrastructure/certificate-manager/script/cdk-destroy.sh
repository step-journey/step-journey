#!/bin/bash

set -e  # 에러 발생 시 즉시 종료

THIS_SCRIPT_NAME=$(basename "$0")

STACK_NAME="CertificateManagerStack"
AWS_PROFILE="cac-sso-shared-service"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%S')][$THIS_SCRIPT_NAME] $1"
}

start_time=$(date +%s)

echo -e "\033[31m스택($STACK_NAME)을 파괴(destroy) 하시겠습니까?\033[0m"
echo -e "정말 삭제하려면 '\033[31mdestroy $STACK_NAME stack\033[0m' 을 입력하세요."
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
