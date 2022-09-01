## How to fork the repo

Developers who wish to fork this repo may please go through our license agreement [here](https://github.com/torusresearch/solana-wallet/blob/develop/LICENSE.md).

Please contact hello@tor.us for any questions.

Mandatory changes required:

- 1. Get your Client ID from Web3Auth [Dashboard](https://dashboard.web3auth.io/) by creating a new project ([ How to generate a clientId from Web3Auth dashboard ](howToClientId.md)). [Readmore](https://web3auth.io/docs/quick-start)

- 2. In config.ts file on line number 58 replace the current value with your project Client ID.

- 3. On line number 78 replace current key with your own moonpay api_key.

- 4. Generate your own sentry and google analytics credentials and use them in .env files.

- 5. Api calls to https://solana-api.tor.us is restricted / prohibited and contact our team for help.

- 6. Generate a different sentry dsn for your fork and never use the one available in the current env.
