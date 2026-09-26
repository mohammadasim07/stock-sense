"use client";

import React from "react";

export function Barcode({ value }: { value: string }) {
  // Generate deterministic bar widths based on char codes
  const bars = Array.from(value).flatMap((char, i) => {
    const code = char.charCodeAt(0);
    return [
      { width: (code % 3) + 1, isSpace: false },
      { width: ((code * 2) % 2) + 1, isSpace: true },
      { width: ((code * 3) % 3) + 1, isSpace: false },
      { width: 1, isSpace: true },
    ];
  });

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end h-7 gap-[1.5px] px-1">
        {bars.slice(0, 36).map((bar, idx) =>
          bar.isSpace ? (
            <div key={idx} style={{ width: `${bar.width * 1.5}px` }} />
          ) : (
            <div
              key={idx}
              className="bg-slate-800"
              style={{
                width: `${bar.width * 1.5}px`,
                height: idx % 6 === 0 ? "100%" : "82%",
              }}
            />
          )
        )}
      </div>
      <span className="text-[10px] font-mono tracking-wider text-slate-500 mt-0.5">
        {value}
      </span>
    </div>
  );
}
