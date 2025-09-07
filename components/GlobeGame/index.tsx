"use client";

import DebugPanel from "@/components/DebugPanel";
import { env } from "@/lib/env";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

// Dynamically import to avoid SSR issues with three.js
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type LatLng = { lat: number; lng: number };

type QuizItem = {
  id: string;
  prompt: string;
  answer: LatLng;
};

// 7-question dataset (approximate precise building coordinates)
const QUIZ: QuizItem[] = [
  {
    id: "goethe",
    prompt: "Guess where Goethe was born",
    // Goethe-Haus, Großer Hirschgraben 23-25, Frankfurt
    answer: { lat: 50.1108, lng: 8.6733 },
  },
  {
    id: "leonardo",
    prompt: "Guess where Leonardo da Vinci was born",
    // Casa Natale di Leonardo, Anchiano (Vinci)
    answer: { lat: 43.7935, lng: 10.9236 },
  },
  {
    id: "newton",
    prompt: "Guess where Isaac Newton was born",
    // Woolsthorpe Manor, Lincolnshire
    answer: { lat: 52.8096, lng: -0.6126 },
  },
  {
    id: "curie",
    prompt: "Guess where Marie Curie was born",
    // 16 Freta Street (Maria Skłodowska-Curie Museum), Warsaw
    answer: { lat: 52.2511, lng: 21.008 },
  },
  {
    id: "shakespeare",
    prompt: "Guess where William Shakespeare was born",
    // Henley Street, Stratford-upon-Avon
    answer: { lat: 52.1935, lng: -1.7072 },
  },
  {
    id: "einstein",
    prompt: "Guess where Albert Einstein was born",
    // Bahnhofstraße 20, Ulm
    answer: { lat: 48.3987, lng: 9.9933 },
  },
  {
    id: "tesla",
    prompt: "Guess where Nikola Tesla was born",
    // Smiljan, Croatia (Memorial Center)
    answer: { lat: 44.5723, lng: 15.3886 },
  },
];

// Marker SVG for HTML markers
const MARKER_SVG = `<svg viewBox="-4 0 36 36">
  <path fill="currentColor" d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"></path>
  <circle fill="black" cx="14" cy="14" r="7"></circle>
</svg>`;

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function GlobeGame() {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [markerTapped, setMarkerTapped] = useState<null | "guess" | "answer">(
    null
  );
  const [results, setResults] = useState<
    Array<{ id: string; guess: LatLng; answer: LatLng; distanceKm: number }>
  >([]);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [lockedResults, setLockedResults] = useState<Array<{
    id: string;
    guess: LatLng;
    answer: LatLng;
    distanceKm: number;
  }> | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedTxHash, setSharedTxHash] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<
    Array<{ entityKey: string; address?: string; totalScore?: number }>
  >([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean>(false);
  const [showBridge, setShowBridge] = useState<boolean>(false);

  const QUIZ3 = useMemo(() => {
    // Build from env when provided, else fallback to compiled defaults
    const q: { prompt: string; lat?: number; lng?: number }[] = [];
    const e = env;
    const eNum = (s?: string) => (s ? parseFloat(s) : NaN);
    if (e.NEXT_PUBLIC_QUIZ_Q1_PROMPT) {
      q.push({
        prompt: e.NEXT_PUBLIC_QUIZ_Q1_PROMPT,
        lat: eNum(e.NEXT_PUBLIC_QUIZ_Q1_LAT),
        lng: eNum(e.NEXT_PUBLIC_QUIZ_Q1_LNG),
      });
    }
    if (e.NEXT_PUBLIC_QUIZ_Q2_PROMPT) {
      q.push({
        prompt: e.NEXT_PUBLIC_QUIZ_Q2_PROMPT,
        lat: eNum(e.NEXT_PUBLIC_QUIZ_Q2_LAT),
        lng: eNum(e.NEXT_PUBLIC_QUIZ_Q2_LNG),
      });
    }
    if (e.NEXT_PUBLIC_QUIZ_Q3_PROMPT) {
      q.push({
        prompt: e.NEXT_PUBLIC_QUIZ_Q3_PROMPT,
        lat: eNum(e.NEXT_PUBLIC_QUIZ_Q3_LAT),
        lng: eNum(e.NEXT_PUBLIC_QUIZ_Q3_LNG),
      });
    }
    if (
      q.length === 3 &&
      q.every((it) => Number.isFinite(it.lat) && Number.isFinite(it.lng))
    ) {
      return q.map((it, idx) => ({
        id: `env-${idx + 1}`,
        prompt: it.prompt,
        answer: { lat: it.lat as number, lng: it.lng as number },
      }));
    }
    return QUIZ.slice(0, 3);
  }, []);
  const current = QUIZ3[questionIdx];

  // Quiz completion state (local and persisted)
  const localFinished = results.length === QUIZ3.length;
  const alreadyFinished = lockedResults !== null;
  const isFinished = localFinished || alreadyFinished;

  // Animated arc between guess and correct answer when submitted
  const arcsData = useMemo(() => {
    if (!submitted || !guess) return [] as any[];
    return [
      {
        startLat: guess.lat,
        startLng: guess.lng,
        endLat: current.answer.lat,
        endLng: current.answer.lng,
      },
    ];
  }, [guess, submitted, current.answer.lat, current.answer.lng]);

  const distanceKm = useMemo(() => {
    if (!submitted || !guess) return null as number | null;
    return haversineKm(guess, current.answer);
  }, [guess, submitted, current.answer]);

  // Score: 0km => 100, >= 20000km => 0, linear in between
  const scorePct = useMemo(() => {
    if (distanceKm == null) return null as number | null;
    const d = Math.max(0, Math.min(20000, distanceKm));
    return Math.round((1 - d / 20000) * 100);
  }, [distanceKm]);

  // HTML markers for guess and correct answer
  const htmlMarkers = useMemo(() => {
    const data: Array<LatLng & { type: "guess" | "answer" }> = [];
    if (guess) data.push({ ...guess, type: "guess" });
    if (submitted && guess) data.push({ ...current.answer, type: "answer" });
    return data;
  }, [guess, submitted, current.answer]);

  const renderMarker = (d: { type: "guess" | "answer" }) => {
    const el = document.createElement("div");
    el.innerHTML = MARKER_SVG;
    el.style.color = d.type === "guess" ? "#fb923c" : "#22c55e"; // orange vs green
    el.style.width = "24px";
    el.style.transform = "translate(-12px, -24px)"; // center tip
    el.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";
    el.style.pointerEvents = "auto";
    el.style.cursor = "pointer";
    el.onclick = () => setMarkerTapped(d.type);
    return el;
  };

  // Geographic midpoint for the distance label
  function midpoint(a: LatLng, b: LatLng): LatLng {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    const lat1 = toRad(a.lat);
    const lon1 = toRad(a.lng);
    const lat2 = toRad(b.lat);
    const lon2 = toRad(b.lng);
    const dLon = lon2 - lon1;
    const Bx = Math.cos(lat2) * Math.cos(dLon);
    const By = Math.cos(lat2) * Math.sin(dLon);
    const lat3 = Math.atan2(
      Math.sin(lat1) + Math.sin(lat2),
      Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By)
    );
    const lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
    return { lat: toDeg(lat3), lng: toDeg(lon3) };
  }

  // Distance label positioned at path midpoint when submitted
  const distanceLabels = useMemo(() => {
    if (!submitted || !guess || distanceKm == null) return [] as any[];
    const mid = midpoint(guess, current.answer);
    return [
      { lat: mid.lat, lng: mid.lng, text: `${distanceKm.toFixed(1)} km` },
    ];
  }, [submitted, guess, current.answer, distanceKm]);

  // Check persisted completion on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/quiz/state", { credentials: "include" });
        const data = await res.json();
        if (res.ok && Array.isArray(data?.results)) {
          setLockedResults(data.results);
        }
      } catch (_) {}
      try {
        const me = await fetch("/api/auth/me", { credentials: "include" });
        setAuthed(me.ok);
      } catch (_) {
        setAuthed(false);
      }
    })();
  }, []);

  // Helpers for GolemDB
  function computeScore(distance: number): number {
    const d = Math.max(0, Math.min(20000, distance));
    return Math.round((1 - d / 20000) * 100);
  }
  function buildSharePayload() {
    const final = alreadyFinished ? lockedResults ?? [] : results;
    const perQuestion = final.map((r) => ({
      distanceKm: r.distanceKm,
      scorePct: computeScore(r.distanceKm),
    }));
    const totalScore = Math.round(
      perQuestion.reduce((a, b) => a + b.scorePct, 0) /
        Math.max(1, perQuestion.length)
    );
    return {
      version: env.NEXT_PUBLIC_QUIZ_VERSION || "1",
      totalScore,
      perQuestion,
      timestamp: Date.now(),
    };
  }
  async function shareToGolemDB() {
    try {
      const rpc = env.NEXT_PUBLIC_GOLEMDB_RPC_URL;
      const addr = env.NEXT_PUBLIC_GOLEMDB_CONTRACT_ADDRESS;
      if (!rpc || !addr) {
        alert("GolemDB RPC/contract not configured.");
        return;
      }
      if (!authed) {
        alert("Please sign in first to share your score.");
        return;
      }
      setIsSharing(true);
      setSharedTxHash(null);
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      // Optional: ensure chain id
      if (env.NEXT_PUBLIC_GOLEMDB_CHAIN_ID) {
        const targetHex =
          "0x" + parseInt(env.NEXT_PUBLIC_GOLEMDB_CHAIN_ID, 10).toString(16);
        try {
          await (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetHex }],
          });
        } catch (switchErr: any) {
          // if chain not added
          if (switchErr?.code === 4902 && env.NEXT_PUBLIC_GOLEMDB_RPC_URL) {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: targetHex,
                  chainName:
                    env.NEXT_PUBLIC_GOLEMDB_CHAIN_NAME || "Golem Base L3",
                  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                  rpcUrls: [env.NEXT_PUBLIC_GOLEMDB_RPC_URL],
                },
              ],
            });
          }
        }
      }
      const signer = await provider.getSigner();
      const abi = [
        "function createEntity(bytes data, uint256 btl, tuple(string key, string value)[] stringAnnotations) returns (bytes32)",
        "function getEntity(bytes32 entityKey) view returns (bytes, uint256, tuple(string,string)[])",
        "event EntityCreated(bytes32 indexed entityKey, address indexed owner, uint256 expirationBlock)",
      ];
      const contract = new (await import("ethers")).ethers.Contract(
        addr,
        abi,
        signer
      );
      const payload = buildSharePayload();
      const dataBytes = (await import("ethers")).ethers.toUtf8Bytes(
        JSON.stringify(payload)
      );
      const btl = Number(env.NEXT_PUBLIC_GOLEMDB_BTL || "300");
      const annotations = [
        { key: "type", value: "wheres-goethe-score" },
        { key: "version", value: String(payload.version) },
      ];
      const tx = await contract.createEntity(dataBytes, btl, annotations);
      const receipt = await tx.wait();
      setSharedTxHash(receipt?.hash || tx.hash);
      alert("Shared to GolemDB: " + (receipt?.hash || tx.hash));
    } catch (err: any) {
      console.error(err);
      alert("Share failed: " + (err?.message || String(err)));
    } finally {
      setIsSharing(false);
    }
  }
  async function loadLeaderboard() {
    try {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      setLeaderboard([]);
      const rpc = env.NEXT_PUBLIC_GOLEMDB_RPC_URL;
      const addr = env.NEXT_PUBLIC_GOLEMDB_CONTRACT_ADDRESS;
      if (!rpc || !addr) {
        setLeaderboardError("GolemDB RPC/contract not configured.");
        return;
      }
      const { ethers } = await import("ethers");
      const provider = new ethers.JsonRpcProvider(rpc);
      const abi = [
        "function createEntity(bytes data, uint256 btl, tuple(string key, string value)[] stringAnnotations) returns (bytes32)",
        "function getEntity(bytes32 entityKey) view returns (bytes, uint256, tuple(string,string)[])",
        "event EntityCreated(bytes32 indexed entityKey, address indexed owner, uint256 expirationBlock)",
      ];
      const contract = new ethers.Contract(addr, abi, provider);
      const fromBlock = env.NEXT_PUBLIC_GOLEMDB_FROM_BLOCK
        ? Number(env.NEXT_PUBLIC_GOLEMDB_FROM_BLOCK)
        : 0;
      const filter = contract.filters.EntityCreated();
      const logs = await contract.queryFilter(filter, fromBlock);
      const rows: Array<{
        entityKey: string;
        address?: string;
        totalScore?: number;
      }> = [];
      for (const log of logs) {
        const ev = log as any; // ethers v6 EventLog has args array
        const key = (ev.args && ev.args[0]) as string;
        const entity = await contract.getEntity(key);
        const raw = entity?.[0] as string;
        let totalScore: number | undefined;
        try {
          const json = JSON.parse(
            (await import("ethers")).ethers.toUtf8String(raw)
          );
          if (json && typeof json.totalScore === "number")
            totalScore = json.totalScore;
        } catch (_) {}
        rows.push({
          entityKey: key,
          address: (ev.args && ev.args[1]) as string | undefined,
          totalScore,
        });
      }
      rows.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
      setLeaderboard(rows);
    } catch (err: any) {
      setLeaderboardError(err?.message || String(err));
    } finally {
      setLeaderboardLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top sticky header (card) */}
      {!isFinished && (
        <div className="fixed top-3 left-0 right-0 z-10">
          <div className="mx-auto w-full max-w-[640px] px-4 py-3 bg-white/95 text-gray-900 rounded-lg shadow-md border border-black/5">
            <div className="text-xs text-gray-600">
              Q{questionIdx + 1}/{QUIZ3.length}
            </div>
            <div className="text-base font-semibold leading-snug">
              {current.prompt}
            </div>
            <div className="text-xs text-gray-600">
              Tap the globe to place your guess.
            </div>
          </div>
        </div>
      )}

      <div className="w-full" style={{ maxWidth: 640 }}>
        <div className="w-full" style={{ height: "100vh" }}>
          <Globe
            // Use OpenStreetMap as tile engine
            globeTileEngineUrl={(x: number, y: number, l: number) =>
              `https://tile.openstreetmap.org/${l}/${x}/${y}.png`
            }
            showAtmosphere={true}
            onGlobeClick={({ lat, lng }) => {
              if (!submitted && !isFinished) {
                setGuess({ lat, lng });
              }
            }}
            // Animated arc between guess and correct
            arcsData={arcsData}
            arcStartLat={(d: any) => d.startLat}
            arcStartLng={(d: any) => d.startLng}
            arcEndLat={(d: any) => d.endLat}
            arcEndLng={(d: any) => d.endLng}
            arcDashLength={0.5}
            arcDashGap={0.2}
            arcDashAnimateTime={1500}
            arcColor={() => ["rgba(59,130,246,0.9)", "rgba(239,68,68,0.9)"]}
            // HTML markers for guess (orange) and answer (green)
            htmlElementsData={htmlMarkers}
            htmlLat={(d: any) => d.lat}
            htmlLng={(d: any) => d.lng}
            htmlElement={(d: any) => renderMarker(d)}
            // Distance text label on path midpoint
            labelsData={distanceLabels}
            labelLat={(d: any) => d.lat}
            labelLng={(d: any) => d.lng}
            labelText={(d: any) => d.text}
            labelSize={1.2}
            labelColor={() => "#111827"}
            labelIncludeDot={false}
          />
        </div>
      </div>

      {/* Sticky bottom action bar (card) */}
      {!isFinished && (
        <div className="fixed bottom-3 left-0 right-0 z-10">
          <div className="mx-auto w-full max-w-[640px] px-4 py-3 bg-white/95 text-gray-900 rounded-lg shadow-lg border border-black/5">
            {submitted && distanceKm !== null ? (
              <div className="mb-2 text-center text-base">
                You were{" "}
                <span className="font-semibold">
                  {distanceKm.toFixed(1)} km
                </span>{" "}
                off.
                {scorePct !== null && (
                  <span className="ml-2 text-sm text-gray-700">
                    Score: {scorePct}%
                  </span>
                )}
              </div>
            ) : guess ? (
              <div className="mb-2 text-center text-sm text-gray-700">
                Selected: {guess.lat.toFixed(3)}°, {guess.lng.toFixed(3)}°
              </div>
            ) : (
              <div className="mb-2 text-center text-sm text-gray-500">
                Tap the globe to select a location
              </div>
            )}

            <div className="flex gap-3">
              {!submitted ? (
                <button
                  onClick={() => setSubmitted(true)}
                  disabled={!guess}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 shadow"
                >
                  Submit guess
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Next question or finish
                    const next = questionIdx + 1;
                    let newResults = results;
                    if (distanceKm != null && guess) {
                      const entry = {
                        id: current.id,
                        guess,
                        answer: current.answer,
                        distanceKm,
                      };
                      newResults = [...results, entry];
                      setResults(newResults);
                    }
                    if (next < QUIZ3.length) {
                      setQuestionIdx(next);
                      setGuess(null);
                      setSubmitted(false);
                      setMarkerTapped(null);
                    } else {
                      // Persist results and lock this version
                      fetch("/api/quiz/state", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify(newResults),
                      }).catch(() => {});
                      // Lock UI
                      setLockedResults(newResults);
                      setSubmitted(false);
                      setMarkerTapped(null);
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow"
                >
                  {questionIdx + 1 < QUIZ3.length ? "Next question" : "Finish"}
                </button>
              )}
            </div>
            <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      )}

      {/* Summary at the end when results contain all entries */}
      {(results.length === QUIZ3.length || alreadyFinished) && (
        <div className="fixed inset-0 z-20 flex items-center justify-center px-4">
          <div className="w-full max-w-[640px] bg-white text-gray-900 rounded-xl shadow-2xl border border-black/5 p-5">
            <div className="text-lg font-semibold mb-2">Your results</div>
            <ul className="space-y-1 text-sm mb-4">
              {(alreadyFinished ? lockedResults ?? [] : results).map((r, i) => (
                <li
                  key={`${r.id}-${i}`}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium">Q{i + 1}</span>
                  <span>{r.distanceKm.toFixed(1)} km off</span>
                </li>
              ))}
            </ul>
            <div className="text-sm text-gray-700 mb-4">
              Share to GolemDB or view the public leaderboard for this version.
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await shareToGolemDB();
                }}
                disabled={isSharing || !authed}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow disabled:opacity-50"
              >
                {isSharing
                  ? "Sharing..."
                  : authed
                  ? "Share to GolemDB"
                  : "Sign in to share"}
              </button>
              <button
                onClick={async () => {
                  setShowLeaderboard(true);
                  await loadLeaderboard();
                }}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow"
              >
                See leaderboard
              </button>
              <button
                onClick={() => setShowBridge(true)}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow"
              >
                Bridge to L3
              </button>
            </div>
            {sharedTxHash && (
              <div className="mt-3 text-xs text-gray-600 break-all">
                TX: {sharedTxHash}
              </div>
            )}
            {showLeaderboard && (
              <div className="mt-4 border-t border-black/5 pt-4">
                <div className="text-base font-semibold mb-2">Leaderboard</div>
                {leaderboardLoading ? (
                  <div className="text-sm text-gray-600">Loading...</div>
                ) : leaderboardError ? (
                  <div className="text-sm text-red-600">{leaderboardError}</div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-sm text-gray-600">No entries yet.</div>
                ) : (
                  <ul className="text-sm space-y-1">
                    {leaderboard.map((row, idx) => (
                      <li
                        key={row.entityKey}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-700">#{idx + 1}</span>
                        <span className="truncate max-w-[55%] text-gray-900">
                          {row.address || row.entityKey}
                        </span>
                        <span className="font-semibold">
                          {row.totalScore ?? "-"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="mt-4 border-t border-black/5 pt-4">
              <button
                onClick={() => setShowDebug((v) => !v)}
                className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-gray-800 hover:bg-gray-900 shadow"
              >
                {showDebug ? "Hide Debug" : "Debug"}
              </button>
              {showDebug && (
                <div className="mt-4">
                  <DebugPanel />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showBridge && (
        <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center px-4">
          <div className="w-full max-w-[640px] bg-white text-gray-900 rounded-xl shadow-2xl border border-black/5 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Bridge to Kaolin (L3)</div>
              <button
                onClick={() => setShowBridge(false)}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
            <div className="mt-2">
              {(() => {
                const Bridge = dynamic(() => import("@/components/Bridge"), {
                  ssr: false,
                });
                return <Bridge />;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
