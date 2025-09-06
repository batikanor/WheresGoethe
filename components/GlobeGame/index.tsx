"use client";

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

  const current = QUIZ[questionIdx];

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
    el.style.pointerEvents = "none";
    return el;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-base font-semibold mt-2">
        Q{questionIdx + 1}/{QUIZ.length}
      </div>
      <div className="text-lg font-semibold text-center px-4">
        {current.prompt}
      </div>
      <div className="text-sm text-gray-600 mb-2">
        Tap the globe to place your guess.
      </div>

      <div className="w-full" style={{ maxWidth: 640 }}>
        <div className="w-full" style={{ height: 360 }}>
          <Globe
            // Use OpenStreetMap as tile engine
            globeTileEngineUrl={(x: number, y: number, l: number) =>
              `https://tile.openstreetmap.org/${l}/${x}/${y}.png`
            }
            showAtmosphere={true}
            onGlobeClick={({ lat, lng }) => {
              setGuess({ lat, lng });
              setSubmitted(false);
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
          />
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <div className="mx-auto w-full max-w-[640px] px-4 pb-4 pt-2 bg-gradient-to-t from-white/95 via-white/80 to-transparent backdrop-blur">
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
                  if (next < QUIZ.length) {
                    setQuestionIdx(next);
                    setGuess(null);
                    setSubmitted(false);
                  } else {
                    setQuestionIdx(0);
                    setGuess(null);
                    setSubmitted(false);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow"
              >
                {questionIdx + 1 < QUIZ.length ? "Next question" : "Restart"}
              </button>
            )}
          </div>
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
        </div>
      </div>
    </div>
  );
}
