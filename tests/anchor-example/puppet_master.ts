export type PuppetMaster = {
	version: "0.1.0";
	name: "puppet_master";
	instructions: [
		{
			name: "pullStrings";
			accounts: [
				{
					name: "puppet";
					isMut: true;
					isSigner: false;
				},
				{
					name: "puppetProgram";
					isMut: false;
					isSigner: false;
				},
			];
			args: [
				{
					name: "data";
					type: "u64";
				},
			];
		},
	];
};

export const IDL: PuppetMaster = {
	version: "0.1.0",
	name: "puppet_master",
	instructions: [
		{
			name: "pullStrings",
			accounts: [
				{
					name: "puppet",
					isMut: true,
					isSigner: false,
				},
				{
					name: "puppetProgram",
					isMut: false,
					isSigner: false,
				},
			],
			args: [
				{
					name: "data",
					type: "u64",
				},
			],
		},
	],
};
