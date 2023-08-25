import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { IDL as PuppetIDL, Puppet } from "./anchor-example/puppet";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

const PUPPET_PROGRAM_ID = new PublicKey(
	"Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
);

test("anchor", async () => {
	const context = await startAnchor("tests/anchor-example", [], []);

	const provider = new BankrunProvider(context);

	const puppetProgram = new Program<Puppet>(
		PuppetIDL,
		PUPPET_PROGRAM_ID,
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

test("bankrun provider with wallet", async () => {
	const context = await startAnchor("tests/anchor-example", [], []);

	const provider = new BankrunProvider(context);

	expect(provider.publicKey.equals(context.payer.publicKey));

	// another provider from a second wallet
	const wallet = new NodeWallet(Keypair.generate());

	const newProvider = new BankrunProvider(context, wallet);

	expect(wallet.publicKey.equals(newProvider.publicKey));
});
