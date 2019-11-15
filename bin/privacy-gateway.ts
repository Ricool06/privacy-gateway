#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { PrivacyGatewayStack } from '../lib/privacy-gateway-stack';
import { Aws } from '@aws-cdk/core';



const app = new cdk.App();
new PrivacyGatewayStack(app, 'PrivacyGatewayStack', {env: { region: 'eu-west-1'}});
