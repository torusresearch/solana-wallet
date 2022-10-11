# Solana Wallet (by Web3Auth)

Solana Torus Wallet for end-user.

> [Web3Auth](https://web3auth.io) is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

## 🌐 Live Demo

Checkout the [Solana Wallet](https://solana.tor.us/) to see how `Solana Wallet` looks in production.

## 💬 Troubleshooting and Discussions

- Have a look at our [GitHub Discussions](https://github.com/Web3Auth/Web3Auth/discussions?discussions_q=sort%3Atop) to see if anyone has any questions or issues you might be having.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions
- Join our [Discord](https://discord.gg/web3auth) to join our community and get private integration support or help with your integration.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/)

- Install recommended extensions when first open the project in VSCode.

## NPM Scripts

| Script       | Description                                             |
| ------------ | ------------------------------------------------------- |
| `npm install`   | Install dependencies in your project directory          |
| `npm run serve` | Start dev server locally                                |      |
| `npm run build` | Build for production                                    |
| `npm run lint`  | Check for code issues (automatically run on pre-commit) |

# Use local Controller Workaround
Change the `@toruslabs/solana-controllers` dependency in the `packages.json` to local path to solana controller
Change the `@toruslabs/base-controllers` resolution in the `packages.json` to local path to base controller

```bash
npm install
npm run serve
```
