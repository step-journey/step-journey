import * as cdk from 'aws-cdk-lib';
import {
  CfnVPC,
  CfnInternetGateway,
  CfnVPCGatewayAttachment,
  CfnRouteTable,
  CfnRoute,
  CfnSubnet,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

//-----------------------------
// 상수 정의
//-----------------------------

// 가용영역(Availability Zone)
const AZ_A = 'ap-northeast-2a';
const AZ_B = 'ap-northeast-2b';

// 서브넷: CIDR 파편 (기본적으로 "baseCidr + 이 값" 형태로 구성)
const SUBNET_PUBLIC_A_CIDR = '.10.0/24';   // (ex: 10.x.10.0/24)
const SUBNET_PUBLIC_B_CIDR = '.11.0/24';
const SUBNET_RDB_A_CIDR    = '.20.0/24';
const SUBNET_RDB_B_CIDR    = '.21.0/24';
const SUBNET_CACHE_A_CIDR  = '.30.0/24';
const SUBNET_CACHE_B_CIDR  = '.31.0/24';
const SUBNET_APP_A_CIDR    = '.112.0/20';
const SUBNET_APP_B_CIDR    = '.128.0/20';

// 기타 리소스
const INTERNET_GATEWAY_SUFFIX = 'internet-gateway';
const PUBLIC_RT_SUFFIX_2A     = '2a-public-rt';
const PUBLIC_RT_SUFFIX_2B     = '2b-public-rt';
const PRIVATE_RT_SUFFIX_2A    = '2a-private-rt';
const PRIVATE_RT_SUFFIX_2B    = '2b-private-rt';

//-----------------------------
// 인터페이스
//-----------------------------
export interface NetworkStackProps extends cdk.StackProps {
  envName: string;
  cidrBlock: string;
}

//-----------------------------
// NetworkStack
//-----------------------------
export class NetworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { envName, cidrBlock } = props;

    // VPC 생성
    const vpc = new CfnVPC(this, 'VPC', {
      cidrBlock,
      tags: [
        { key: 'Name', value: `vpc-${envName}` },
      ],
    });

    // Internet Gateway
    const igw = new CfnInternetGateway(this, 'InternetGateway', {
      tags: [
        { key: 'Name', value: `${envName}-${INTERNET_GATEWAY_SUFFIX}` },
      ],
    });

    new CfnVPCGatewayAttachment(this, 'InternetGatewayAttachment', {
      vpcId: vpc.ref,
      internetGatewayId: igw.ref,
    });

    // -----------------------------
    // RouteTables (Public / Private, AZ별)
    // -----------------------------

    // Public RT 2a
    const publicRouteTable2a = new CfnRouteTable(this, 'RouteTablePublic2a', {
      vpcId: vpc.ref,
      tags: [
        { key: 'Name', value: `${envName}-${PUBLIC_RT_SUFFIX_2A}` },
      ],
    });
    // Public RT 2b
    const publicRouteTable2b = new CfnRouteTable(this, 'RouteTablePublic2b', {
      vpcId: vpc.ref,
      tags: [
        { key: 'Name', value: `${envName}-${PUBLIC_RT_SUFFIX_2B}` },
      ],
    });

    // Public RT → IGW default route
    new CfnRoute(this, 'DefaultRoutePublic2a', {
      routeTableId: publicRouteTable2a.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    });
    new CfnRoute(this, 'DefaultRoutePublic2b', {
      routeTableId: publicRouteTable2b.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    });

    // Private RT 2a
    const privateRouteTable2a = new CfnRouteTable(this, 'RouteTablePrivate2a', {
      vpcId: vpc.ref,
      tags: [
        { key: 'Name', value: `${envName}-${PRIVATE_RT_SUFFIX_2A}` },
      ],
    });
    // Private RT 2b
    const privateRouteTable2b = new CfnRouteTable(this, 'RouteTablePrivate2b', {
      vpcId: vpc.ref,
      tags: [
        { key: 'Name', value: `${envName}-${PRIVATE_RT_SUFFIX_2B}` },
      ],
    });

    // -----------------------------
    // Subnets
    // -----------------------------
    // baseCidr => "10.0" / "10.1" 등
    const baseCidr = cidrBlock.split('.')[0] + '.' + cidrBlock.split('.')[1];

    // =========== Public Subnet A ===========
    const publicSubnetA = new CfnSubnet(this, 'PublicSubnet2a', {
      vpcId: vpc.ref,
      cidrBlock: `${baseCidr}${SUBNET_PUBLIC_A_CIDR}`,  // "10.0" + ".10.0/24" => "10.0.10.0/24"
      availabilityZone: AZ_A,
      mapPublicIpOnLaunch: true,
      tags: [
        { key: 'Name', value: `${envName}-2a-public` },
      ],
    });
    // =========== Public Subnet B ===========
    const publicSubnetB = new CfnSubnet(this, 'PublicSubnet2b', {
      vpcId: vpc.ref,
      cidrBlock: `${baseCidr}${SUBNET_PUBLIC_B_CIDR}`,
      availabilityZone: AZ_B,
      mapPublicIpOnLaunch: true,
      tags: [
        { key: 'Name', value: `${envName}-2b-public` },
      ],
    });
    // RT Association (Public)
    new cdk.CfnResource(this, 'PublicSubnet2aRtAssoc', {
      type: 'AWS::EC2::SubnetRouteTableAssociation',
      properties: {
        SubnetId: publicSubnetA.ref,
        RouteTableId: publicRouteTable2a.ref,
      },
    });
    new cdk.CfnResource(this, 'PublicSubnet2bRtAssoc', {
      type: 'AWS::EC2::SubnetRouteTableAssociation',
      properties: {
        SubnetId: publicSubnetB.ref,
        RouteTableId: publicRouteTable2b.ref,
      },
    });

    // =========== Private DB Subnet A ===========
    const privateDbSubnet2a = new CfnSubnet(this, 'PrivateDbSubnet2a', {
      vpcId: vpc.ref,
      cidrBlock: `${baseCidr}${SUBNET_RDB_A_CIDR}`,
      availabilityZone: AZ_A,
      mapPublicIpOnLaunch: false,
      tags: [
        { key: 'Name', value: `${envName}-2a-private-rdb` },
      ],
    });
    // =========== Private DB Subnet B ===========
    const privateDbSubnet2b = new CfnSubnet(this, 'PrivateDbSubnet2b', {
      vpcId: vpc.ref,
      cidrBlock: `${baseCidr}${SUBNET_RDB_B_CIDR}`,
      availabilityZone: AZ_B,
      mapPublicIpOnLaunch: false,
      tags: [
        { key: 'Name', value: `${envName}-2b-private-rdb` },
      ],
    });
    // RT Association (RDB)
    new cdk.CfnResource(this, 'PrivateDbSubnet2aRtAssoc', {
      type: 'AWS::EC2::SubnetRouteTableAssociation',
      properties: {
        SubnetId: privateDbSubnet2a.ref,
        RouteTableId: privateRouteTable2a.ref,
      },
    });
    new cdk.CfnResource(this, 'PrivateDbSubnet2bRtAssoc', {
      type: 'AWS::EC2::SubnetRouteTableAssociation',
      properties: {
        SubnetId: privateDbSubnet2b.ref,
        RouteTableId: privateRouteTable2b.ref,
      },
    });

    // =========== Private Cache Subnet A ===========
    const privateCacheSubnet2a = new CfnSubnet(this, 'PrivateCacheSubnet2a', {
      vpcId: vpc.ref,
      cidrBlock: `${baseCidr}${SUBNET_CACHE_A_CIDR}`,
      availabilityZone: AZ_A,
      mapPublicIpOnLaunch: false,
      tags: [
        { key: 'Name', value: `${envName}-2a-private-cache` },
      ],
    });
    // =========== Private Cache Subnet B ===========
    const privateCacheSubnet2b = new CfnSubnet(this, 'PrivateCacheSubnet2b', {
      vpcId: vpc.ref,
      cidrBlock: `${baseCidr}${SUBNET_CACHE_B_CIDR}`,
      availabilityZone: AZ_B,
      mapPublicIpOnLaunch: false,
      tags: [
        { key: 'Name', value: `${envName}-2b-private-cache` },
      ],
    });
    // RT Association (Cache)
    new cdk.CfnResource(this, 'PrivateCacheSubnet2aRtAssoc', {
      type: 'AWS::EC2::SubnetRouteTableAssociation',
      properties: {
        SubnetId: privateCacheSubnet2a.ref,
        RouteTableId: privateRouteTable2a.ref,
      },
    });
    new cdk.CfnResource(this, 'PrivateCacheSubnet2bRtAssoc', {
      type: 'AWS::EC2::SubnetRouteTableAssociation',
      properties: {
        SubnetId: privateCacheSubnet2b.ref,
        RouteTableId: privateRouteTable2b.ref,
      },
    });

    // =========== Private App Subnet A ===========
    const privateAppSubnet2a = new CfnSubnet(this, 'PrivateAppSubnet2a', {
      vpcId: vpc.ref,
      cidrBlock: `${baseCidr}${SUBNET_APP_A_CIDR}`,
      availabilityZone: AZ_A,
      mapPublicIpOnLaunch: false,
      tags: [
        { key: 'Name', value: `${envName}-2a-private-application-server` },
      ],
    });
    // =========== Private App Subnet B ===========
    const privateAppSubnet2b = new CfnSubnet(this, 'PrivateAppSubnet2b', {
      vpcId: vpc.ref,
      cidrBlock: `${baseCidr}${SUBNET_APP_B_CIDR}`,
      availabilityZone: AZ_B,
      mapPublicIpOnLaunch: false,
      tags: [
        { key: 'Name', value: `${envName}-2b-private-application-server` },
      ],
    });
    // RT Association (App)
    new cdk.CfnResource(this, 'PrivateAppSubnet2aRtAssoc', {
      type: 'AWS::EC2::SubnetRouteTableAssociation',
      properties: {
        SubnetId: privateAppSubnet2a.ref,
        RouteTableId: privateRouteTable2a.ref,
      },
    });
    new cdk.CfnResource(this, 'PrivateAppSubnet2bRtAssoc', {
      type: 'AWS::EC2::SubnetRouteTableAssociation',
      properties: {
        SubnetId: privateAppSubnet2b.ref,
        RouteTableId: privateRouteTable2b.ref,
      },
    });

    // -----------------------------
    // 최종 출력
    // -----------------------------
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.ref,
      description: `VPC for ${envName}`,
    });
  }
}
