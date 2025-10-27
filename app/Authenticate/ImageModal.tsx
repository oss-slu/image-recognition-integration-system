"use client";

import React from "react";

interface ImageModalProps {
  image: {
    id: string;
    data: string;
    timestamp: string;
  };
  onClose: () => void;
}

export default function ImageModal({ image, onClose }: ImageModalProps) {
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusable = closeButtonRef.current ? [closeButtonRef.current] : [];
        if (focusable.length === 1) {
          e.preventDefault();
          focusable[0].focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      aria-hidden={false}
    >
      <div
        className="mx-auto max-w-md rounded-lg bg-white p-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Image details"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.data} alt="Expanded" className="mb-4 rounded-md" />
        <div className="text-sm text-gray-700">
          <p>
            <strong>ID:</strong> {image.id}
          </p>
          <p>
            <strong>Timestamp:</strong>{" "}
            {new Date(image.timestamp).toLocaleString()}
          </p>
        </div>
        <button
          ref={closeButtonRef}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
          onClick={onClose}
          aria-label="Close image dialog"
        >
          Close
        </button>
      </div>
    </div>
  );
}
