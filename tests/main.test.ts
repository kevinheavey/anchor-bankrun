import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Keypair, PublicKey, SendTransactionError } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { Puppet } from "./anchor-example/puppet";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

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

test("error test", async () => {
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
	const expectedMsg =
		"AnchorError caused by account: puppet. Error Code: AccountNotInitialized. \
Error Number: 3012. Error Message: \
The program expected this account to be already initialized.";
	const expectedLogs = [
		"Program Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS invoke [1]",
		"Program log: Instruction: SetData",
		"Program log: AnchorError caused by account: puppet. Error Code: AccountNotInitialized. Error Number: 3012. Error Message: The program expected this account to be already initialized.",
		"Program Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS consumed 3621 of 200000 compute units",
		"Program Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS failed: custom program error: 0xbc4",
	];
	const wrap = async () => {
		await puppetProgram.methods
			.setData(data)
			.accounts({
				puppet: PublicKey.unique(),
			})
			.rpc();
	};
	await expect(wrap).rejects.toThrow(new SendTransactionError(expectedMsg));
	await expect(wrap).rejects.toHaveProperty("logs", expectedLogs);
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
