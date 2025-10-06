import Link from "next/link";

const BottomNav = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex w-full justify-around border-t bg-white py-2 shadow-md">
      <Link href="/">
        <div className="flex cursor-pointer flex-col items-center text-gray-700">
          <div className="size-6 rounded-full bg-gray/500"></div>
          <span className="text-xs">Home</span>
        </div>
      </Link>

      <Link href="/profile">
        <div className="flex cursor-pointer flex-col items-center text-gray-700">
          <div className="size-6 rounded-full bg-gray/500"></div>
          <span className="text-xs">Profile</span>
        </div>
      </Link>

      <Link href="/about">
        <div className="flex cursor-pointer flex-col items-center text-gray-700">
          <div className="size-6 rounded-full bg-gray/500"></div>
          <span className="text-xs">About</span>
        </div>
      </Link>

      <Link href="/previousImages">
        <div className="flex cursor-pointer flex-col items-center text-gray-700">
          <div className="size-6 rounded-full bg-gray/500"></div>
          <span className="text-xs">Previous Images</span>
        </div>
      </Link>
    </nav>
  );
};

export default BottomNav;
