import { pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

export default {
	preset: "ts-jest",
	testEnvironment: "node",
	moduleDirectories: ["node_modules", "./src"],
	moduleFileExtensions: ["js", "ts"],
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
		prefix: "<rootDir>/src",
	}),
	transform: {
		"^.+\\.{ts|tsx}?$": [
			"ts-jest",
			{
				tsConfig: "tsconfig.json",
			},
		],
	},
};
