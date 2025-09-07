"use client";

import {
  GOLEMDB_L2,
  KAOLIN_L3,
  KAOLIN_L3_BRIDGE_CONTRACT,
} from "@/lib/constants";
import { useCallback, useMemo, useState } from "react";
import { parseEther } from "viem";

type EthereumProvider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
};

export default function Bridge() {
  const [amountEth, setAmountEth] = useState<string>("0.01");
  const [status, setStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");

  const ethereum = useMemo(
    () =>
      typeof window !== "undefined"
        ? ((window as any).ethereum as EthereumProvider)
        : undefined,
    []
  );

  const ensureNetwork = useCallback(
    async (chain: typeof GOLEMDB_L2 | typeof KAOLIN_L3) => {
      if (!ethereum) throw new Error("MetaMask not found");
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chain.chainIdHex }],
        });
      } catch (switchError: any) {
        // 4902 = chain not added
        if (switchError?.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chain.chainIdHex,
                chainName: chain.name,
                nativeCurrency: {
                  name: chain.currencySymbol,
                  symbol: chain.currencySymbol,
                  decimals: 18,
                },
                rpcUrls: [chain.rpcUrl],
              },
            ],
          });
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chain.chainIdHex }],
          });
        } else {
          throw switchError;
        }
      }
    },
    [ethereum]
  );

  const bridgeToL3 = useCallback(async () => {
    try {
      setStatus("Preparing transaction...");
      setTxHash("");
      if (!ethereum) throw new Error("MetaMask not found");

      // Ensure we're on L2 first
      await ensureNetwork(GOLEMDB_L2);

      const [from] = await ethereum.request({ method: "eth_requestAccounts" });
      const valueWei = parseEther(amountEth);
      const valueHex = `0x${valueWei.toString(16)}`;

      // Preflight: get balance and estimate gas
      const balanceHex = await ethereum.request({
        method: "eth_getBalance",
        params: [from, "latest"],
      });
      const balanceWei = BigInt(balanceHex);

      // Manually set EIP-1559 fees to avoid zero-fee estimation issues
      // 1) Get baseFee via feeHistory; fallback to gasPrice if needed
      let baseFeeHex = "0x0";
      try {
        const feeHist = await ethereum.request({
          method: "eth_feeHistory",
          params: [1, "latest", []],
        });
        baseFeeHex =
          feeHist?.baseFeePerGas?.[1] || feeHist?.baseFeePerGas?.[0] || "0x0";
      } catch (_) {
        try {
          const gp = await ethereum.request({ method: "eth_gasPrice" });
          baseFeeHex = gp || "0x0";
        } catch (_) {}
      }
      const oneGwei = BigInt(1e9);
      const baseFeeWei = BigInt(parseInt(baseFeeHex, 16) || 1e9); // default 1 gwei
      const priorityWei = oneGwei; // 1 gwei tip
      const maxFeeWei = baseFeeWei * BigInt(2) + priorityWei;
      const maxFeeHex = `0x${maxFeeWei.toString(16)}`;
      const maxPriorityHex = `0x${priorityWei.toString(16)}`;

      // try to estimate gas; fallback to 21000
      let gasLimitHex = "0x5208"; // 21000
      try {
        const est = await ethereum.request({
          method: "eth_estimateGas",
          params: [
            {
              from,
              to: KAOLIN_L3_BRIDGE_CONTRACT,
              value: valueHex,
            },
          ],
        });
        if (typeof est === "string" && est.startsWith("0x")) {
          gasLimitHex = est;
        }
      } catch (e: any) {
        // expose estimate error details if any
        console.warn("estimateGas failed", e);
      }

      // rough funds check
      const gasLimitWei = BigInt(gasLimitHex);
      const needed = valueWei + gasLimitWei * maxFeeWei;
      if (balanceWei < needed) {
        setStatus(
          `Insufficient funds on L2. Balance ${balanceWei.toString()} wei, need ~${needed.toString()} wei`
        );
        return;
      }

      setStatus("Sending transaction...");
      let hash: string;
      try {
        hash = await ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from,
              to: KAOLIN_L3_BRIDGE_CONTRACT,
              value: valueHex,
              gas: gasLimitHex,
              maxFeePerGas: maxFeeHex,
              maxPriorityFeePerGas: maxPriorityHex,
            },
          ],
        });
      } catch (e1559: any) {
        // Fallback: legacy tx with gasPrice
        console.warn("EIP-1559 send failed, trying legacy gasPrice", e1559);
        let gasPriceHex = "0x3b9aca00"; // 1 gwei
        try {
          const gp = await ethereum.request({ method: "eth_gasPrice" });
          if (typeof gp === "string" && gp.startsWith("0x")) gasPriceHex = gp;
        } catch (_) {}
        hash = await ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from,
              to: KAOLIN_L3_BRIDGE_CONTRACT,
              value: valueHex,
              gas: gasLimitHex,
              gasPrice: gasPriceHex,
            },
          ],
        });
      }
      setTxHash(hash as string);
      setStatus("Bridge tx submitted. Switch to Kaolin to check balance.");
    } catch (err: any) {
      try {
        const msg = typeof err === "object" ? JSON.stringify(err) : String(err);
        setStatus(msg);
      } catch (_) {
        setStatus(err?.message || "Failed to send transaction");
      }
    }
  }, [amountEth, ensureNetwork, ethereum]);

  const addKaolin = useCallback(async () => {
    try {
      setStatus("Adding Kaolin network...");
      await ensureNetwork(KAOLIN_L3);
      setStatus("Kaolin added/switched.");
    } catch (err: any) {
      setStatus(err?.message || "Failed to add/switch Kaolin");
    }
  }, [ensureNetwork]);

  const addL2 = useCallback(async () => {
    try {
      setStatus("Adding L2 network...");
      await ensureNetwork(GOLEMDB_L2);
      setStatus("L2 added/switched.");
    } catch (err: any) {
      setStatus(err?.message || "Failed to add/switch L2");
    }
  }, [ensureNetwork]);

  return (
    <div className="w-full max-w-xl mx-auto mt-10 p-4 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-2">Bridge to Kaolin (L3)</h2>
      <p className="text-sm text-gray-600 mb-4">
        1) Make sure you have faucet ETH on L2. 2) Click "Bridge to L3" to send
        ETH to the bridge contract.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={addL2} className="px-3 py-2 bg-gray-200 rounded">
          Add/Switch L2
        </button>
        <button onClick={addKaolin} className="px-3 py-2 bg-gray-200 rounded">
          Add/Switch Kaolin
        </button>
      </div>

      <label className="block text-sm font-medium mb-1">
        Amount (ETH on L2)
      </label>
      <input
        type="number"
        min="0"
        step="0.0001"
        value={amountEth}
        onChange={(e) => setAmountEth(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3 text-black"
      />
      <button
        onClick={bridgeToL3}
        className="px-4 py-2 bg-purple-600 text-white rounded"
      >
        Bridge to L3
      </button>

      {txHash && (
        <div className="mt-3 text-sm break-all">Tx Hash: {txHash}</div>
      )}
      {status && <div className="mt-2 text-sm text-gray-700">{status}</div>}
    </div>
  );
}
