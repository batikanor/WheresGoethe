"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";

// Dynamically import to avoid SSR issues with three.js
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type LatLng = { lat: number; lng: number };

// Goethe birthplace (Frankfurt am Main, Goethe-Haus vicinity)
const GOETHE_BIRTHPLACE: LatLng = { lat: 50.1109, lng: 8.6821 };

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
  const globeRef = useRef<any>(null);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const pathData = useMemo(() => {
    if (!submitted || !guess) return [] as { path: [number, number][] }[];
    return [
      {
        path: [
          [guess.lat, guess.lng],
          [GOETHE_BIRTHPLACE.lat, GOETHE_BIRTHPLACE.lng],
        ],
      },
    ];
  }, [guess, submitted]);

  const distanceKm = useMemo(() => {
    if (!submitted || !guess) return null as number | null;
    return haversineKm(guess, GOETHE_BIRTHPLACE);
  }, [guess, submitted]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-lg font-semibold mt-2">
        Guess where Goethe was born
      </div>
      <div className="text-sm text-gray-600 mb-2">
        Tap the globe to place your guess, then submit.
      </div>

      <div className="w-full" style={{ maxWidth: 640 }}>
        <div className="w-full" style={{ height: 360 }}>
          <Globe
            ref={globeRef}
            // Use OpenStreetMap as tile engine
            globeTileEngineUrl={(x: number, y: number, l: number) =>
              `https://tile.openstreetmap.org/${l}/${x}/${y}.png`
            }
            globeTileEngineMaxLevel={7}
            showAtmosphere={true}
            onGlobeClick={({ lat, lng }) => {
              setGuess({ lat, lng });
              setSubmitted(false);
            }}
            // Draw the line between guess and birthplace after submit
            pathsData={pathData}
            pathPoints={(d: any) => d.path}
            pathColor={() => "#ef4444"}
            pathStroke={0.6}
            pathDashLength={1}
            pathDashGap={0}
            pathDashAnimateTime={0}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setSubmitted(true)}
          disabled={!guess}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit guess
        </button>
        <button
          onClick={() => {
            setGuess(null);
            setSubmitted(false);
          }}
          className="px-4 py-2 bg-gray-200 text-gray-900 font-medium rounded-md"
        >
          Reset
        </button>
      </div>

      {guess && !submitted && (
        <div className="text-sm text-gray-700 mt-2">
          Selected: {guess.lat.toFixed(3)}°, {guess.lng.toFixed(3)}°
        </div>
      )}

      {submitted && distanceKm !== null && (
        <div className="mt-3 text-base">
          You were{" "}
          <span className="font-semibold">{distanceKm.toFixed(1)} km</span> off.
        </div>
      )}
    </div>
  );
}
