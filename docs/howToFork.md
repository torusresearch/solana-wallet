## How to fork the repo

Developers who wish to fork this repo may please go through our license agreement [here](https://github.com/torusresearch/solana-wallet/blob/develop/LICENSE.md).

Please contact hello@tor.us for any questions.

Mandatory changes required:

- 1. Get your Client ID from Web3Auth [Dashboard](https://dashboard.web3auth.io/) by creating a new project ([ How to generate a clientId from Web3Auth dashboard ](howToClientId.md)). [Readmore](https://web3auth.io/docs/quick-start)

- 2. In config.ts file, replace the clientId with your Client ID

- 3. Generate your own sentry and google analytics credentials and use them in .env files.

- 4. API calls to https://solana-api.tor.us are restricted. Please contact our team for help.

- 5. Generate a different sentry dsn for your fork. All your error logs will be lost if dsn value in the current env file is reused.
