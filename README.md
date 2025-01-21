# anchor-litesvm

`anchor-litesvm` is a small extension to [LiteSVM](https://github.com/LiteSVM/litesvm)
that enables using both Anchor and LiteSVM with minimal code changes. It does this by exporting a `LitesvmProvider` class that can be used as a replacement for `AnchorProvider` during testing.

## Async note

`litesvm` is synchronous because it is entirely compute-bound. However, `anchor-litesvm` uses async because
it implements interfaces that require async. If you would like to avoid async tests, you can simply
use regular `litesvm` without `anchor-litesvm`.

## Usage

Here's an example using `LitesvmProvider` to test an Anchor program:

```typescript
import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN, Program, Wallet } from "@coral-xyz/anchor";
import { Puppet } from "./anchor-example/puppet";
const IDL = require("./anchor-example/puppet.json");

test("anchor", async () => {
	const client = fromWorkspace("tests/anchor-example");
	const provider = new LiteSVMProvider(client);
	const puppetProgram = new Program<Puppet>(IDL, provider);
	const puppetKeypair = Keypair.generate();
	await puppetProgram.methods
		.initialize()
		.accounts({
			puppet: puppetKeypair.publicKey,
		})
		.signers([puppetKeypair])
		.rpc();

	const data = new BN(123456);
	await puppetProgram.methods
		.setData(data)
		.accounts({
			puppet: puppetKeypair.publicKey,
		})
		.rpc();

	const dataAccount = await puppetProgram.account.data.fetch(
		puppetKeypair.publicKey,
	);
	expect(dataAccount.data.eq(new BN(123456)));
});
```

## Installation

```
yarn add anchor-litesvm
```
