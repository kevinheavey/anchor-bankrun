export type Puppet = {
	version: "0.1.0";
	name: "puppet";
	instructions: [
		{
			name: "initialize";
			accounts: [
				{
					name: "puppet";
					isMut: true;
					isSigner: true;
				},
				{
					name: "user";
					isMut: true;
					isSigner: true;
				},
				{
					name: "systemProgram";
					isMut: false;
					isSigner: false;
				},
			];
			args: [];
		},
		{
			name: "setData";
			accounts: [
				{
					name: "puppet";
					isMut: true;
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
	accounts: [
		{
			name: "data";
			type: {
				kind: "struct";
				fields: [
					{
						name: "data";
						type: "u64";
					},
				];
			};
		},
	];
};

export const IDL: Puppet = {
	version: "0.1.0",
	name: "puppet",
	instructions: [
		{
			name: "initialize",
			accounts: [
				{
					name: "puppet",
					isMut: true,
					isSigner: true,
				},
				{
					name: "user",
					isMut: true,
					isSigner: true,
				},
				{
					name: "systemProgram",
					isMut: false,
					isSigner: false,
				},
			],
			args: [],
		},
		{
			name: "setData",
			accounts: [
				{
					name: "puppet",
					isMut: true,
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
	accounts: [
		{
			name: "data",
			type: {
				kind: "struct",
				fields: [
					{
						name: "data",
						type: "u64",
					},
				],
			},
		},
	],
};
