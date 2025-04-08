import Link from "next/link";

const BottomNav = () => {
  return (
    <nav className="absolute bottom-0 w-full bg-white border-t flex justify-around py-2 shadow-md">
      <Link href="/">
        <div className="flex flex-col items-center text-gray-700 cursor-pointer">
          <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
          <span className="text-xs">Home</span>
        </div>
      </Link>

      <Link href="/profile">
        <div className="flex flex-col items-center text-gray-700 cursor-pointer">
          <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
          <span className="text-xs">Profile</span>
        </div>
      </Link>

      <Link href="/about">
        <div className="flex flex-col items-center text-gray-700 cursor-pointer">
          <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
          <span className="text-xs">About</span>
        </div>
      </Link>

      <Link href="/previousImages">
        <div className="flex flex-col items-center text-gray-700 cursor-pointer">
          <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
          <span className="text-xs">Previous Images</span>
        </div>
      </Link>
    </nav>
  );
};

export default BottomNav;
