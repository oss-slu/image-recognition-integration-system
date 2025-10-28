import Link from "next/link";

const BottomNav = () => {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex w-full justify-around border-t bg-white py-2 shadow-md"
      aria-label="Primary"
    >
      <Link href="/">
        <a className="flex flex-col items-center text-gray-700" aria-label="Home">
          <div className="w-6 h-6 rounded-full bg-gray-500" aria-hidden="true"></div>
          <span className="text-xs">Home</span>
        </a>
      </Link>

      <Link href="/profile">
        <a className="flex flex-col items-center text-gray-700" aria-label="Profile">
          <div className="w-6 h-6 rounded-full bg-gray-500" aria-hidden="true"></div>
          <span className="text-xs">Profile</span>
        </a>
      </Link>

      <Link href="/about">
        <a className="flex flex-col items-center text-gray-700" aria-label="About">
          <div className="w-6 h-6 rounded-full bg-gray-500" aria-hidden="true"></div>
          <span className="text-xs">About</span>
        </a>
      </Link>

      <Link href="/previousImages">
        <a className="flex flex-col items-center text-gray-700" aria-label="Previous Images">
          <div className="w-6 h-6 rounded-full bg-gray-500" aria-hidden="true"></div>
          <span className="text-xs">Previous Images</span>
        </a>
      </Link>
    </nav>
  );
};

export default BottomNav;
