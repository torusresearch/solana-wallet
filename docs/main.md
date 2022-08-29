# User guide to Solana Wallet

<br>
<br>

Solana wallet is a non custodial crypto wallet built for [Solana Blockchain](https://solana.com/) with a seamless & secure login mechanism powered by [web3auth](https://web3auth.io/).
This document is composed to help
-  Crypto enthusiasts
-  Anyone forking this repo.
-  Anyone who wants to explore the functionalities of the wallet without creating an account.

<br>
<br>

## Features

- Generate and manage private key public key pair for interacting with Solana blockchain.
- Key management powered by [web3auth](https://web3auth.io/).
- Buy SOL tokens from Moonpay.
- Send and receive SOL and SPL Tokens.
- Store frequently used addresses and domains in the address book.
- Connect to Solana Mainnet, Testnet or Devnet.
- Discover and interact with Solana DApps.
- Built in dark mode 😆

<br>
<br>

## Below are the views available in the wallet

Go the the respective page below for more information.


- [Login](login.md) - Solana Wallet login page.

- [Home](home.md) - Landing page.

- [NFTs](nfts.md) - NFTs in your wallet.

- [Activity](activity.md) - Activity across all dapps (including wallet)

- [Settings](settings.md) - Change networks, theme, error reporting, etc.

- [Discover](discover.md) - Discover popular DApps on Solana.

<br>
<br>

## How to fork the repo

>Developers who which to fork this repo may please go through our license agreement [here](https://github.com/torusresearch/solana-wallet/blob/develop/LICENSE.md).

>Please contact hello@tor.us for any questions.

Mandatory changes required:

- 1. Get your Client ID from Web3Auth [Dashboard](https://dashboard.web3auth.io/) by creating a new project. [Readmore](https://web3auth.io/docs/quick-start)

- 2. In config.ts file on line number 58 replace the current value with your project Client ID.

- 3. On line number 78 replace current key with your own moonpay api_key.

- 4. Generate your own sentry and google analytics credentials and use them in .env files.




<br>
<br>
