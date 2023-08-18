// module.exports = {
//     preset: "ts-jest",
//     testEnvironment: "node",
//     testPathIgnorePatterns: ["/node_modules/", "/dist/"],
// };

import type { Config } from "@jest/types";
// Sync object
const config: Config.InitialOptions = {
    verbose: true,
    testEnvironment: "node",
    testPathIgnorePatterns: [],
};
export default config;
