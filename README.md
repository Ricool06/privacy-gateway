# Privacy Gateway
This project is used to deploy a simple, WireGuard VPN.

## Dependencies
- WireGuard and resolvconf must be installed on your local machine.
- Node & NPM must be installed on your machine.
- You must create an AWS credentials profile called privacy-gateway using the AWS CLI.
- You must, of course, have an AWS account.
  - This may be vastly cheaper than 3rd-party VPN providers, but AWS will still charge you some pennies for your EC2 instance.

## Give me a VPN!
- Chillax.
- Run `npm run deploy`.
- Accept the prompts.
- Wait for the `server-public.key` file to appear in the `cdktoolkit-staginbucket` bucket in S3.
- Run `npm run finish:assets`
- Run `wg-quick up ./assets/client/wg0-client.conf`
- GCHQ now thinks you're Irish.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
