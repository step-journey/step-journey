import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';


/**
 * SSL/TLS 인증서 관리를 위한 스택
 *
 * 주요 기능:
 * 1. Route53에서 기존 호스팅 영역을 조회하여 DNS 검증에 사용
 * 2. ACM 에서 'step-journey.com' 과 서브도메인을 위한 와일드카드 인증서 생성
 *    - DNS 검증 방식 사용
 *    - CloudFront 배포를 위해 반드시 us-east-1 리전에 생성
 *    - 기본 도메인과 'www', 'dev' 서브도메인 포함
 *
 * 생성된 인증서 공유:
 * - SSM Parameter Store 에 인증서 ARN 저장 (/step-journey/certificate/arn)
 *   → 다른 스택이나 AWS 계정에서 참조 가능
 * - CloudFormation Outputs 으로도 ARN 출력
 *
 * 주의사항:
 * - Route53 호스팅 영역과 이 스택은 반드시 같은 AWS 계정에 있어야 함 (shared-service 계정)
 * - 자동 DNS 레코드 생성을 위해 호스팅 영역 권한 필요
 */
export class CertificateManagerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1. 이미 존재하는 Route53 Hosted Zone 조회 (같은 계정에 있어야 DnsValidatedCertificate 자동 레코드 등록 가능)
    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'step-journey.com',
    });

    // 2. DNS 검증으로 ACM 인증서 생성 (CloudFront 사용 목적이므로 region: us-east-1 필수)
    const certificate = new acm.Certificate(this, 'StepJourneyCertificate', {
      domainName: 'step-journey.com',
      subjectAlternativeNames: [
        '*.step-journey.com',
      ],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // 3. 인증서 ARN 을 SSM Parameter Store 에 저장 (Cross-Account 참고 시 편리)
    new ssm.StringParameter(this, 'CertificateArnParameter', {
      parameterName: '/step-journey/certificate/arn',
      stringValue: certificate.certificateArn,
      description: 'ACM Certificate ARN for step-journey.com',
      tier: ssm.ParameterTier.STANDARD, // 월 10,000 개까지 무료
    });

    // 4. CloudFormation Output
    new CfnOutput(this, 'CertificateArnOutput', {
      value: certificate.certificateArn,
      description: 'ACM Certificate ARN for step-journey.com',
    });
  }
}
