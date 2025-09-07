export const MESSAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30; // 30 day

// GolemDB L2 (ETHWarsaw testnet) and Kaolin L3 (Golem Base L3) network params
export const GOLEMDB_L2 = {
  chainIdDecimal: 60138453033, // 0xe0087f829
  chainIdHex: "0xe0087f829",
  name: "GolemDB L2 (ETHWarsaw)",
  currencySymbol: "ETH",
  rpcUrl: "https://ethwarsaw.holesky.golemdb.io/rpc",
};

export const KAOLIN_L3 = {
  chainIdDecimal: 60138453025, // 0xe0087f821
  chainIdHex: "0xe0087f821",
  name: "Kaolin (Golem Base L3 Testnet)",
  currencySymbol: "ETH",
  rpcUrl: "https://kaolin.holesky.golem-base.io/rpc",
};

export const KAOLIN_L3_BRIDGE_CONTRACT =
  "0x816EE14da473B7f644D244895F6D98D2Bdb3eeac" as const;
