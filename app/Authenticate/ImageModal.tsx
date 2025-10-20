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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-md rounded-lg bg-white p-4"
        onClick={(e) => e.stopPropagation()}
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
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
