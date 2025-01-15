#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CertificateManagerStack } from '../lib/certificate-manager-stack';

// 환경 설정
const envVars: cdk.Environment = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',  // CloudFront 인증서는 반드시 us-east-1에 생성
};

// 공통 태그 설정
const tags: { [key: string]: string } = {
    ManagedBy: 'CDK',
};

// CDK 앱 초기화
const app = new cdk.App();

// 스택 생성
const certificateManagerStack = new CertificateManagerStack(app, 'StepJourneyCertificateStack', {
    env: envVars,
    description: 'SSL/TLS certificates for step-journey.com (DNS validated in us-east-1)',
    tags,
    terminationProtection: true,
});

// 모든 스택에 공통 태그 적용
Object.entries(tags).forEach(([key, value]) => {
    cdk.Tags.of(app).add(key, value);
});

app.synth();
console.log('\nDone. Check your ACM/Route53 settings...\n');
