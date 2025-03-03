export default function Spinner() {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 z-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    )
  }
  