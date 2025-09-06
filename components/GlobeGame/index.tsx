"use client";

import DebugPanel from "@/components/DebugPanel";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

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

  const QUIZ3 = useMemo(() => QUIZ.slice(0, 3), []);
  const current = QUIZ3[questionIdx];

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

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top sticky header (card) */}
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

      <div className="w-full" style={{ maxWidth: 640 }}>
        <div className="w-full" style={{ height: "100vh" }}>
          <Globe
            // Use OpenStreetMap as tile engine
            globeTileEngineUrl={(x: number, y: number, l: number) =>
              `https://tile.openstreetmap.org/${l}/${x}/${y}.png`
            }
            showAtmosphere={true}
            onGlobeClick={({ lat, lng }) => {
              if (!submitted) {
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
      <div className="fixed bottom-3 left-0 right-0 z-10">
        <div className="mx-auto w-full max-w-[640px] px-4 py-3 bg-white/95 text-gray-900 rounded-lg shadow-lg border border-black/5">
          {submitted && distanceKm !== null ? (
            <div className="mb-2 text-center text-base">
              You were{" "}
              <span className="font-semibold">{distanceKm.toFixed(1)} km</span>{" "}
              off.
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
                  // Next question or restart
                  const next = questionIdx + 1;
                  if (distanceKm != null && guess) {
                    setResults((prev) => [
                      ...prev,
                      {
                        id: current.id,
                        guess,
                        answer: current.answer,
                        distanceKm,
                      },
                    ]);
                  }
                  if (next < QUIZ3.length) {
                    setQuestionIdx(next);
                    setGuess(null);
                    setSubmitted(false);
                    setMarkerTapped(null);
                  } else {
                    // End of quiz - keep submitted state and show summary in place of button
                    setQuestionIdx(0);
                    setGuess(null);
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

      {/* Summary at the end when results contain all entries */}
      {results.length === QUIZ3.length && (
        <div className="fixed inset-0 z-20 flex items-center justify-center px-4">
          <div className="w-full max-w-[640px] bg-white text-gray-900 rounded-xl shadow-2xl border border-black/5 p-5">
            <div className="text-lg font-semibold mb-2">Your results</div>
            <ul className="space-y-1 text-sm mb-4">
              {results.map((r, i) => (
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
              Stored on-chain. Want to see how your friends performed?
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Placeholder CTA - can link to leaderboard route later
                  alert("Coming soon: friends leaderboard");
                }}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow"
              >
                View friends
              </button>
              <button
                onClick={() => setShowDebug((v) => !v)}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-gray-800 hover:bg-gray-900 shadow"
              >
                Debug
              </button>
            </div>
            {showDebug && (
              <div className="mt-4 border-t border-black/5 pt-4">
                <DebugPanel />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
