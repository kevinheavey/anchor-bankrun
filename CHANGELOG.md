# Changelog

## [0.5.0] - 2024-10-18

- Re-export `startAnchor` from `solana-bankrun`
- Require `solana/web3.js` >1.92.0 and fix SendTransactionError construction

## [0.4.1] - 2024-09-12

- Restrict solana/web3.js to <1.92 to avoid breaking change they introduced

## [0.4.0] - 2024-06-29

- BREAKING: Update to Anchor v0.30 [(#15)](https://github.com/kevinheavey/anchor-bankrun/pull/15)

## [0.3.0] - 2023-12-02

- Make `@solana/web3.js` a peer dependency [(#5)](https://github.com/kevinheavey/anchor-bankrun/pull/5)
- Correctly handle missing transaction logs [(#10)](https://github.com/kevinheavey/anchor-bankrun/pull/10)

## [0.2.0] - 2023-09-08

- Add better support for Anchor-like errors [(#6)](https://github.com/kevinheavey/anchor-bankrun/pull/6)
- Expose publicKey and add wallet to provider constructor [(#3)](https://github.com/kevinheavey/anchor-bankrun/pull/3)

## [0.1.0] - 2023-08-13

First release 🚀
