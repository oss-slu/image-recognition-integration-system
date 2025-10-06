"use client";

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
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={image.data} alt="Expanded" className="rounded-md mb-4" />
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
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
