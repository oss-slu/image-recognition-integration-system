"use client";

export default function Spinner() {
  return (
    <div
      role="status"
      /* display → size → border-width → border-color → border-radius → animation */
      className="inline-block size-6 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}
