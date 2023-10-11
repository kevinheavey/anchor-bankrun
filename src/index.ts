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
} from "@solana/web3.js";
import { Provider, Wallet } from "@coral-xyz/anchor";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import bs58 from "bs58";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { SuccessfulTxSimulationResponse } from "@coral-xyz/anchor/dist/cjs/utils/rpc";

interface ConnectionInterface {
	getAccountInfo: Connection["getAccountInfo"];
	getAccountInfoAndContext: Connection["getAccountInfoAndContext"];
	getMinimumBalanceForRentExemption: Connection["getMinimumBalanceForRentExemption"];
}

class BankrunConnectionProxy implements ConnectionInterface {
	constructor(private banksClient: BanksClient) {}
	async getAccountInfoAndContext(
		publicKey: PublicKey,
		commitmentOrConfig?: Commitment | GetAccountInfoConfig | undefined,
	): Promise<RpcResponseAndContext<AccountInfo<Buffer>>> {
		const accountInfoBytes = await this.banksClient.getAccount(publicKey);
		if (!accountInfoBytes)
			throw new Error(`Could not find ${publicKey.toBase58()}`);
		return {
			context: { slot: Number(await this.banksClient.getSlot()) },
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
		const accountInfoBytes = await this.banksClient.getAccount(publicKey);
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
		const rent = await this.banksClient.getRent();
		return Number(rent.minimumBalance(BigInt(dataLength)));
	}
}

async function sendWithErr(
	tx: Transaction | VersionedTransaction,
	client: BanksClient,
) {
	const res = await client.tryProcessTransaction(tx);
	const maybeMeta = res.meta;
	const errMsg = res.result;
	if (errMsg !== null) {
		if (maybeMeta !== null) {
			const logs = maybeMeta.logMessages;
			throw new SendTransactionError(errMsg, logs);
		} else {
			throw new SendTransactionError(errMsg);
		}
	}
}

export class BankrunProvider implements Provider {
	wallet: Wallet;
	connection: Connection;
	publicKey: PublicKey;

	constructor(public context: ProgramTestContext, wallet?: Wallet) {
		this.wallet = wallet || new NodeWallet(context.payer);
		this.connection = new BankrunConnectionProxy(
			context.banksClient,
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
			tx.recentBlockhash = (
				await this.context.banksClient.getLatestBlockhash()
			)[0];

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
		await this.context.banksClient.sendTransaction(tx);
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
			tx.recentBlockhash = (
				await this.context.banksClient.getLatestBlockhash()
			)[0];

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
		await sendWithErr(tx, this.context.banksClient);
		return signature;
	}
	async sendAll<T extends Transaction | VersionedTransaction>(
		txWithSigners: { tx: T; signers?: Signer[] | undefined }[],
		opts?: ConfirmOptions | undefined,
	): Promise<string[]> {
		const recentBlockhash = (
			await this.context.banksClient.getLatestBlockhash()
		)[0];

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
			const rawTx = tx.serialize();
			if ("version" in tx) {
				sigs.push(bs58.encode(tx.signatures[0]));
			} else {
				sigs.push(bs58.encode(tx.signature));
			}
			await sendWithErr(tx, this.context.banksClient);
		}
		return sigs;
	}
	async simulate(
		tx: Transaction | VersionedTransaction,
		signers?: Signer[] | undefined,
		commitment?: Commitment | undefined,
		includeAccounts?: boolean | PublicKey[] | undefined,
	): Promise<SuccessfulTxSimulationResponse> {
		if (includeAccounts !== undefined) {
			throw new Error("includeAccounts cannot be used with BankrunProvider");
		}
		if ("version" in tx) {
			signers?.forEach((signer) => tx.sign([signer]));
		} else {
			tx.feePayer = tx.feePayer ?? this.wallet.publicKey;
			tx.recentBlockhash = (
				await this.context.banksClient.getLatestBlockhash()
			)[0];

			signers?.forEach((signer) => tx.partialSign(signer));
		}
		const rawResult = await this.context.banksClient.simulateTransaction(
			tx,
			commitment,
		);
		const returnDataRaw = rawResult.meta.returnData;
		const b64 = Buffer.from(returnDataRaw.data).toString("base64");
		const data: [string, "base64"] = [b64, "base64"];
		const returnData = {
			programId: returnDataRaw.programId.toString(),
			data,
		};
		return {
			logs: rawResult.meta.logMessages,
			unitsConsumed: Number(rawResult.meta.computeUnitsConsumed),
			returnData,
		};
	}
}
