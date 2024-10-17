# anchor-bankrun

`anchor-bankrun` is a small but powerful extension to [solana-bankrun](https://github.com/kevinheavey/solana-bankrun)
that enables using both Anchor and Bankrun with only a one-line code change. It does this by exporting a `BankrunProvider` class that can be used as a drop-in replacement for `AnchorProvider` during testing.

## Anchor version note

Recent versions of `anchor-bankrun` use the Anchor v0.30 IDL, which is not backwards compatible with older Anchor IDLs.
If you have an older IDL, use `anchor-bankrun` v0.3.0.

## Usage

Here's an example using `BankrunProvider` to test an Anchor program:

```typescript
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { Puppet } from "./anchor-example/puppet";
const IDL = require("./anchor-example/puppet.json");

test("anchor", async () => {
	const context = await startAnchor("tests/anchor-example", [], []);

	const provider = new BankrunProvider(context);

	const puppetProgram = new Program<Puppet>(
		IDL,
		provider,
	);

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
yarn add anchor-bankrun
```

## Why is this a separate package?

I want to keep the Bankrun dependencies light.