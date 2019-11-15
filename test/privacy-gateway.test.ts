import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import PrivacyGateway = require('../lib/privacy-gateway-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new PrivacyGateway.PrivacyGatewayStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});