/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/puppet_master.json`.
 */
export type PuppetMaster = {
	address: "HmbTLCmaGvZhKnn1Zfa1JVnp7vkMV4DYVxPLWBVoN65L";
	metadata: {
		name: "puppetMaster";
		version: "0.1.0";
		spec: "0.1.0";
		description: "Created with Anchor";
	};
	instructions: [
		{
			name: "pullStrings";
			discriminator: [13, 252, 243, 149, 120, 132, 189, 145];
			accounts: [
				{
					name: "puppet";
					writable: true;
				},
				{
					name: "puppetProgram";
					address: "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS";
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
			discriminator: [206, 156, 59, 188, 18, 79, 240, 232];
		},
	];
	types: [
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
