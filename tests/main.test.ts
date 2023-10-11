import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Keypair, PublicKey, SendTransactionError, SystemProgram } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { IDL as PuppetIDL, Puppet } from "./anchor-example/puppet";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Callee, IDL as CalleeIDL } from "./cpi-returns/callee";
import { Caller, IDL as CallerIDL } from "./cpi-returns/caller";

const PUPPET_PROGRAM_ID = new PublicKey(
	"Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
);
const CALLER_PROGRAM_ID = new PublicKey(
	"HmbTLCmaGvZhKnn1Zfa1JVnp7vkMV4DYVxPLWBVoN65L",
);
const CALLEE_PROGRAM_ID = new PublicKey(
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

test("error test", async () => {
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


test("CPI return", async () => {
	console.log("calling startAnchor");
	const context = await startAnchor("tests/cpi-returns", [], []);
	console.log("creating provider");
	const provider = new BankrunProvider(context);
	const callerProgram = new Program<Caller>(
		CallerIDL,
		CALLER_PROGRAM_ID,
		provider,
	);
	const calleeProgram = new Program<Callee>(
		CalleeIDL,
		CALLEE_PROGRAM_ID,
		provider,
	);
	const cpiReturn = Keypair.generate();
  

	  await calleeProgram.methods
		  .initialize()
		  .accounts({
		  account: cpiReturn.publicKey,
		  user: provider.wallet.publicKey,
		  systemProgram: SystemProgram.programId,
		  })
		  .signers([cpiReturn])
		  .rpc();
  
	  await callerProgram.methods
		.cpiCallReturnU64()
		.accounts({
		  cpiReturn: cpiReturn.publicKey,
		  cpiReturnProgram: calleeProgram.programId,
		})
		.rpc();
	  const viewRes = await callerProgram.methods.returnU64().view();
	  expect(viewRes.eq(new BN(99)));
  });
  