#!/usr/bin/env ts-node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';

// 프로필 상수
const PROFILE_MAIN = 'cac-sso-main';
const PROFILE_SHARED = 'cac-sso-shared-service';
const PROFILE_DEV = 'cac-sso-workloads-dev';
const PROFILE_PROD = 'cac-sso-workloads-prod';

// 짧은 이름 + CIDR 매핑
const profileMap: Record<string, { shortEnvName: string; cidr: string }> = {
    [PROFILE_MAIN]:   { shortEnvName: 'main',   cidr: '10.0.0.0/16' },
    [PROFILE_SHARED]: { shortEnvName: 'shared', cidr: '10.1.0.0/16' },
    [PROFILE_DEV]:    { shortEnvName: 'dev',    cidr: '10.2.0.0/16' },
    [PROFILE_PROD]:   { shortEnvName: 'prod',   cidr: '10.3.0.0/16' },
};

// 기본 리전
const DEFAULT_REGION = 'ap-northeast-2';

const app = new cdk.App();

// AWS_PROFILE 확인
const currentProfile = process.env.AWS_PROFILE;
if (!currentProfile) {
    throw new Error('AWS_PROFILE 이 설정되지 않았습니다.');
}
if (!profileMap[currentProfile]) {
    throw new Error(`알 수 없는 프로필입니다: ${currentProfile}`);
}

// shortEnvName, cidr 가져오기
const { shortEnvName, cidr } = profileMap[currentProfile];

// 스택 이름 (고정)
const stackName = 'NetworkStack';

// 배포 환경(계정, 리전)
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: DEFAULT_REGION,
};

new NetworkStack(app, stackName, {
    env,
    envName: shortEnvName,
    cidrBlock: cidr,
});
