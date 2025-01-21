import {
	AccountInfo,
	Commitment,
	ConfirmOptions,
	Connection,
	GetAccountInfoConfig,
	PublicKey,
	RpcResponseAndContext,
	SendOptions,
	Signer,
	Transaction,
	TransactionSignature,
	VersionedTransaction,
	SendTransactionError,
	Keypair,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Provider, Wallet } from "@coral-xyz/anchor";
import { FailedTransactionMetadata, LiteSVM } from "litesvm";
import bs58 from "bs58";
import { SuccessfulTxSimulationResponse } from "@coral-xyz/anchor/dist/cjs/utils/rpc";
import * as path from "path";
import { readFileSync } from "fs";
import * as TOML from "@iarna/toml";

interface ConnectionInterface {
	getAccountInfo: Connection["getAccountInfo"];
	getAccountInfoAndContext: Connection["getAccountInfoAndContext"];
	getMinimumBalanceForRentExemption: Connection["getMinimumBalanceForRentExemption"];
}

class LiteSVMConnectionProxy implements ConnectionInterface {
	constructor(private client: LiteSVM) {}
	async getAccountInfoAndContext(
		publicKey: PublicKey,
		commitmentOrConfig?: Commitment | GetAccountInfoConfig | undefined,
	): Promise<RpcResponseAndContext<AccountInfo<Buffer>>> {
		const accountInfoBytes = this.client.getAccount(publicKey);
		if (!accountInfoBytes)
			throw new Error(`Could not find ${publicKey.toBase58()}`);
		return {
			context: { slot: Number(this.client.getClock().slot) },
			value: {
				...accountInfoBytes,
				data: Buffer.from(accountInfoBytes.data),
			},
		};
	}
	async getAccountInfo(
		publicKey: PublicKey,
		commitmentOrConfig?: Commitment | GetAccountInfoConfig | undefined,
	): Promise<AccountInfo<Buffer>> {
		const accountInfoBytes = this.client.getAccount(publicKey);
		if (!accountInfoBytes)
			throw new Error(`Could not find ${publicKey.toBase58()}`);
		return {
			...accountInfoBytes,
			data: Buffer.from(accountInfoBytes.data),
		};
	}
	async getMinimumBalanceForRentExemption(
		dataLength: number,
		commitment?: Commitment,
	): Promise<number> {
		const rent = this.client.getRent();
		return Number(rent.minimumBalance(BigInt(dataLength)));
	}
}

function sendWithErr(tx: Transaction | VersionedTransaction, client: LiteSVM) {
	const res = client.sendTransaction(tx);
	if (res instanceof FailedTransactionMetadata) {
		let sigRaw = tx instanceof Transaction ? tx.signature : tx.signatures[0];
		let signature = bs58.encode(sigRaw);
		throw new SendTransactionError({
			action: "send",
			signature,
			transactionMessage: res.err().toString(),
			logs: res.meta().logs(),
		});
	}
}

export class LiteSVMProvider implements Provider {
	wallet: Wallet;
	connection: Connection;
	publicKey: PublicKey;

	constructor(public client: LiteSVM, wallet?: Wallet) {
		if (wallet == null) {
			const payer = new Keypair();
			client.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));
			this.wallet = new Wallet(payer);
		} else {
			this.wallet = wallet;
		}
		this.connection = new LiteSVMConnectionProxy(
			client,
		) as unknown as Connection; // uh
		this.publicKey = this.wallet.publicKey;
	}

	async send?(
		tx: Transaction | VersionedTransaction,
		signers?: Signer[] | undefined,
		opts?: SendOptions | undefined,
	): Promise<string> {
		if ("version" in tx) {
			signers?.forEach((signer) => tx.sign([signer]));
		} else {
			tx.feePayer = tx.feePayer ?? this.wallet.publicKey;
			tx.recentBlockhash = this.client.latestBlockhash();

			signers?.forEach((signer) => tx.partialSign(signer));
		}
		this.wallet.signTransaction(tx);

		let signature: string;
		if ("version" in tx) {
			signature = bs58.encode(tx.signatures[0]);
		} else {
			if (!tx.signature) throw new Error("Missing fee payer signature");
			signature = bs58.encode(tx.signature);
		}
		this.client.sendTransaction(tx);
		return signature;
	}
	async sendAndConfirm?(
		tx: Transaction | VersionedTransaction,
		signers?: Signer[] | undefined,
		opts?: ConfirmOptions | undefined,
	): Promise<string> {
		if ("version" in tx) {
			signers?.forEach((signer) => tx.sign([signer]));
		} else {
			tx.feePayer = tx.feePayer ?? this.wallet.publicKey;
			tx.recentBlockhash = this.client.latestBlockhash();

			signers?.forEach((signer) => tx.partialSign(signer));
		}
		this.wallet.signTransaction(tx);

		let signature: string;
		if ("version" in tx) {
			signature = bs58.encode(tx.signatures[0]);
		} else {
			if (!tx.signature) throw new Error("Missing fee payer signature");
			signature = bs58.encode(tx.signature);
		}
		sendWithErr(tx, this.client);
		return signature;
	}
	async sendAll<T extends Transaction | VersionedTransaction>(
		txWithSigners: { tx: T; signers?: Signer[] | undefined }[],
		opts?: ConfirmOptions | undefined,
	): Promise<string[]> {
		const recentBlockhash = this.client.latestBlockhash();

		const txs = txWithSigners.map((r) => {
			if ("version" in r.tx) {
				const tx: VersionedTransaction = r.tx;
				if (r.signers) {
					tx.sign(r.signers);
				}
				return tx;
			} else {
				const tx: Transaction = r.tx;
				const signers = r.signers ?? [];

				tx.feePayer = tx.feePayer ?? this.wallet.publicKey;
				tx.recentBlockhash = recentBlockhash;

				signers.forEach((kp) => {
					tx.partialSign(kp);
				});
				return tx;
			}
		});

		const signedTxs = await this.wallet.signAllTransactions(txs);
		const sigs: TransactionSignature[] = [];

		for (let k = 0; k < txs.length; k += 1) {
			const tx = signedTxs[k];
			if ("version" in tx) {
				sigs.push(bs58.encode(tx.signatures[0]));
			} else {
				sigs.push(bs58.encode(tx.signature));
			}
			sendWithErr(tx, this.client);
		}
		return Promise.resolve(sigs);
	}
	async simulate(
		tx: Transaction | VersionedTransaction,
		signers?: Signer[] | undefined,
		commitment?: Commitment | undefined,
		includeAccounts?: boolean | PublicKey[] | undefined,
	): Promise<SuccessfulTxSimulationResponse> {
		if (includeAccounts !== undefined) {
			throw new Error("includeAccounts cannot be used with LiteSVMProvider");
		}
		if ("version" in tx) {
			signers?.forEach((signer) => tx.sign([signer]));
		} else {
			tx.feePayer = tx.feePayer ?? this.wallet.publicKey;
			tx.recentBlockhash = this.client.latestBlockhash();

			signers?.forEach((signer) => tx.partialSign(signer));
		}
		const rawResult = this.client.simulateTransaction(tx);
		if (rawResult instanceof FailedTransactionMetadata) {
			let sigRaw = tx instanceof Transaction ? tx.signature : tx.signatures[0];
			let signature = bs58.encode(sigRaw);
			throw new SendTransactionError({
				action: "simulate",
				signature,
				transactionMessage: rawResult.err().toString(),
				logs: rawResult.meta().logs(),
			});
		}
		const returnDataRaw = rawResult.meta().returnData();
		const b64 = Buffer.from(returnDataRaw.data()).toString("base64");
		const data: [string, "base64"] = [b64, "base64"];
		const returnData = {
			programId: returnDataRaw.programId.toString(),
			data,
		};
		return {
			logs: rawResult.meta().logs(),
			unitsConsumed: Number(rawResult.meta().computeUnitsConsumed),
			returnData,
		};
	}
}

export function fromWorkspace(workspacePath: string): LiteSVM {
	const sbfOutDir = path.join(workspacePath, "target/deploy");
	const anchorTomlPath = path.join(workspacePath, "Anchor.toml");
	const tomlStr = readFileSync(anchorTomlPath).toString();
	const parsedToml = TOML.parse(tomlStr);
	const programs = (parsedToml["programs"] as TOML.JsonMap)[
		"localnet"
	] as TOML.JsonMap;
	const svm = new LiteSVM();
	Object.keys(programs).forEach((key) => {
		const id = programs[key] as string;
		const programPath = path.join(sbfOutDir, `${key}.so`);
		svm.addProgramFromFile(new PublicKey(id), programPath);
	});
	return svm;
}
