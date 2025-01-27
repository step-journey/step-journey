#!/bin/bash

# 스크립트 실행 전제 조건
# 1. Docker 실행 중이어야 함
# 2. AWS CLI 설정 되어야함 (aws configure sso)

# 에러 발생시
# 1. 캐시 초기화: IntelliJ IDEA > File > Invalidate Caches... > Invalidate and Restart
# 2. 디스크 정리: docker system prune -a && docker builder prune
# 3. go mod tidy

set -e                                    # 에러 발생 시 즉시 종료

# 사용할 Dockerfile 경로
SCRIPT_DIR=$(cd $(dirname "$0") && pwd)
DOCKERFILE_PATH="$SCRIPT_DIR/../../core/Dockerfile"

# 푸시 스크립트에서 사용될 환경 변수
export SCRIPT_NAME=$(basename "$0")
export AWS_PROFILE="cac-sso-workloads-prod"
export AWS_REGION="ap-northeast-2"
export ECR_URL=""
export DOCKERFILE_PATH
export DOCKER_IMAGE_TAG="${ECR_URL}:latest"
export ENV_ARG="ENV=prod"
export TASK_DEFINITION_NAME="step-journey-prod-core"
export CLUSTER_NAME="step-journey-ecs-cluster"
export SERVICE_NAME="step-journey-prod-service-core"

# 시작 시간 기록
CURRENT_TIME=$(date "+%Y-%m-%d %H:%M:%S")
echo "[$SCRIPT_NAME] StepJourney 운영 환경 core 서버 푸시 시작 at $CURRENT_TIME"

# 푸시 스크립트 실행
chmod +x ../../_deploy/local-push.sh
../../_deploy/local-push.sh
echo "[$SCRIPT_NAME] local-push.sh 스크립트 실행 완료"

# 실행 완료
CURRENT_TIME=$(date "+%Y-%m-%d %H:%M:%S")
echo "[$SCRIPT_NAME] StepJourney 운영 환경 core 서버 푸시 완료 at $CURRENT_TIME"