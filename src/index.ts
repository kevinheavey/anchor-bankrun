import {
	AccountInfo,
	Commitment,
	ConfirmOptions,
	Connection,
	GetAccountInfoConfig,
	GetLatestBlockhashConfig,
	PublicKey,
	RpcResponseAndContext,
	SendOptions,
	Signer,
	Transaction,
	TransactionSignature,
	VersionedTransaction,
} from "@solana/web3.js";
import { Provider, Wallet } from "@coral-xyz/anchor";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import bs58 from "bs58";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { SuccessfulTxSimulationResponse } from "@coral-xyz/anchor/dist/cjs/utils/rpc";

interface ConnectionInterface {
	getAccountInfoAndContext: Connection["getAccountInfoAndContext"];
	getLatestBlockhash: Connection["getLatestBlockhash"];
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
	async getLatestBlockhash(
		commitmentOrConfig?: Commitment | GetLatestBlockhashConfig | undefined,
	): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
		const result = await this.banksClient.getLatestBlockhash();
		if (!result) throw new Error("Could not get latest blockhash");
		const [blockhash, lastValidBlockHeight] = result;
		return {
			blockhash,
			lastValidBlockHeight: Number(lastValidBlockHeight),
		};
	}
}
export class BankrunProvider implements Provider {
	connection: Connection;
	wallet: Wallet;

	constructor(private context: ProgramTestContext) {
		this.wallet = new NodeWallet(context.payer);
		this.connection = new BankrunConnectionProxy(
			context.banksClient,
		) as any as Connection; // uh
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
				await this.connection.getLatestBlockhash()
			).blockhash;

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
				await this.connection.getLatestBlockhash()
			).blockhash;

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
		await this.context.banksClient.processTransaction(tx);
		return signature;
	}
	async sendAll<T extends Transaction | VersionedTransaction>(
		txWithSigners: { tx: T; signers?: Signer[] | undefined }[],
		opts?: ConfirmOptions | undefined,
	): Promise<string[]> {
		const recentBlockhash = (await this.connection.getLatestBlockhash())
			.blockhash;

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
			await this.context.banksClient.processTransaction(tx);

			return sigs;
		}
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
				await this.connection.getLatestBlockhash()
			).blockhash;

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