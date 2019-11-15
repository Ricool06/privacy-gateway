import { Stack, Construct, StackProps, CfnOutput } from '@aws-cdk/core';
import { Vpc, SubnetType, Instance, InstanceType, InstanceClass, InstanceSize, SecurityGroup, Peer, Port, Protocol, GenericLinuxImage } from '@aws-cdk/aws-ec2';
import { Asset } from "@aws-cdk/aws-s3-assets";
import { join } from 'path';
import { PolicyStatement } from '@aws-cdk/aws-iam';

export class PrivacyGatewayStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const serverAssets = new Asset(this, 'server-assets', {
      path: join(__dirname, '..', 'assets', 'server'),
    });

    const vpc = new Vpc(this, 'privacy-gateway-vpc', {
      cidr: '10.0.0.0/24',
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: 'public subnet',
          subnetType: SubnetType.PUBLIC,
        }
      ],
    });

    const securityGroup = new SecurityGroup(this, 'wireguard-only-ingress_all-egress', {
      vpc,
      securityGroupName: 'privacy-gateway',
    });

    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      new Port({
        fromPort: 51820,
        toPort: 51820,
        protocol: Protocol.TCP,
        stringRepresentation: 'wireguard-tcp'
      }));

    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      new Port({
        fromPort: 51820,
        toPort: 51820,
        protocol: Protocol.UDP,
        stringRepresentation: 'wireguard-udp'
      }));

    const machineImage =  new GenericLinuxImage({
      'eu-west-1': 'ami-0e41581acd7dedd99',
    });

    const s3AssetsBucketUrl = `s3://${serverAssets.s3BucketName}/`;
    const s3ServerAssetsUrl = `${s3AssetsBucketUrl}${serverAssets.s3ObjectKey}`;
    
    new CfnOutput(this, 's3AssetsBucketUrl', {value: s3AssetsBucketUrl});
    new CfnOutput(this, 's3ServerAssetsUrl', {value: s3ServerAssetsUrl});

    const instance = new Instance(this, 'privacy-gateway-vpn-host', {
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.NANO),
      machineImage,
      securityGroup,
      vpc,
    });

    serverAssets.bucket.grantReadWrite(instance);
    instance.addToRolePolicy(new PolicyStatement({
      actions: ['cloudformation:DescribeStacks'],
      resources: [this.stackId],
    }));

    new CfnOutput(this, 'vpnEndpoint', { value: instance.instancePublicIp });

    instance.addUserData(
      'set -euo pipefail',
      'add-apt-repository ppa:wireguard/wireguard -y',
      'apt update',
      'apt install wireguard python3-pip unzip -y',
      'pip3 install --user --upgrade awscli',
      'mkdir ~/vpn-resources',
      'cd ~/vpn-resources',

      's3ServerAssetsUrl=$(~/.local/bin/aws --region eu-west-1 \
        cloudformation describe-stacks \
        --stack-name PrivacyGatewayStack \
        --query "Stacks[0].Outputs[?OutputKey==\'s3ServerAssetsUrl\'].OutputValue" \
        --output text)',

      's3AssetsBucketUrl=$(~/.local/bin/aws --region eu-west-1 \
        cloudformation describe-stacks \
        --stack-name PrivacyGatewayStack \
        --query "Stacks[0].Outputs[?OutputKey==\'s3AssetsBucketUrl\'].OutputValue" \
        --output text)',
      
      'umask 077',
      `~/.local/bin/aws s3 cp "$s3ServerAssetsUrl" ./resources.zip`,
      'unzip resources.zip',
      'wg genkey | tee ./server-private.key | wg pubkey > ./server-public.key',
      'export CLIENT_PUBLIC_KEY=$(cat client-public.key)',
      'export DEFAULT_NIC=$(route | grep \'^default\' | grep -o \'[^ ]*$\')',
      'export SERVER_PRIVATE_KEY=$(cat server-private.key)',
      'envsubst \'$CLIENT_PUBLIC_KEY $DEFAULT_NIC $SERVER_PRIVATE_KEY\' < ./wg0-server.conf > /etc/wireguard/wg0.conf',

      'cat /etc/sysctl.conf | sed \'s/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/g\' > ./new.sysctl.conf',
      'mv ./new.sysctl.conf /etc/sysctl.conf',
      'sysctl -p',
      'wg-quick up wg0',

      '~/.local/bin/aws s3 cp server-public.key "${s3AssetsBucketUrl}server-public.key"',
    );
  }
}
