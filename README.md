# Solana Wallet

Solana Wallet end-user web application.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/)

- Install recommended extensions when first open the project in VSCode.

## NPM Scripts

| Script       | Description                                             |
| ------------ | ------------------------------------------------------- |
| `yarn serve` | Start dev server                                        |
| `yarn build` | Build for production                                    |
| `yarn lint`  | Check for code issues (automatically run on pre-commit) |

# Use local Controller Workaround
Change the "@toruslabs/solana-controllers" dependency in the packages.json to local path to solana controller
Change the "@toruslabs/base-controllers" resolution in the packages.json to local path to base controller

yarn
yarn serve
