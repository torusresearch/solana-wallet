# User guide to Solana Wallet

<br>
<br>

Solana wallet is a non custodial crypto wallet built for [Solana Blockchain](https://solana.com/) with a seamless & secure login mechanism powered by [web3auth](https://web3auth.io/).
This document is composed to help
-  Crypto noobs.
-  Anyone forking this repo.
-  Anyone who wants to explore the functionalities of the wallet without creating an account.

<br>
<br>

## Features

- Generate and manage private key public key pair for interacting with Solana blockchain.
- Seamless signups powered by [web3auth](https://web3auth.io/).
- Send and receive SOL tokens and SPL Tokens.
- Discover and interact with Solana DApps.
- Buy solana tokens from Moonpay.
- Store frequently used addresses and domains in the address book.
- Connect to Solana Mainnet, Testnet or Devnet.
- Built in dark mode 😆

<br>
<br>

## Below are the views available in the wallet

Go the the respective page below for more information.


- [Login](login.md) - Solana Wallet login page.

- [Home](home.md) - Landing page post login to Solana Wallet.

- [NFTs](nfts.md) - Page displaying NFT's liked to the Solana Wallet.

- [Activity](activity.md) - Activity window displays transactions history in the Solana Wallet.

- [Settings](settings.md) - Landing page post login to Solana Wallet.

- [Discover](discover.md) - Discover page helps you discover popular DApps on Solana.

<br>
<br>

## How to fork the repo (We encourage non-commercial use and distribution of this software)

>Developers who which to fork this repo may please go through our license agreement [here](https://github.com/torusresearch/solana-wallet/blob/develop/LICENSE.md).

>Please contact hello@tor.us for any questions.

Mandatory changes required:

- 1. Get your Client ID from Web3Auth [Dashboard](https://dashboard.web3auth.io/) by creating a new project. [Readmore](https://web3auth.io/docs/quick-start)

- 2. In config.ts file on line number 58 replace the current value with your project Client ID.

- 3. On line number 78 replace current key with your own moonpay api_key.

- 4. Generate your own sentry and google analytics credentials and use them in .env files.




<br>
<br>
