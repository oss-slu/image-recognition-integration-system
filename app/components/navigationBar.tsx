import Link from "next/link";

const BottomNav = () => {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex w-full justify-around border-t bg-white py-2 shadow-md"
      aria-label="Primary"
    >
      <Link href="/" className="flex flex-col items-center text-gray-700" aria-label="Home">
        <div className="size-6 rounded-full bg-gray-500" aria-hidden="true"></div>
        <span className="text-xs">Home</span>
      </Link>

      <Link href="/profile" className="flex flex-col items-center text-gray-700" aria-label="Profile">
        <div className="size-6 rounded-full bg-gray-500" aria-hidden="true"></div>
        <span className="text-xs">Profile</span>
      </Link>

      <Link href="/about" className="flex flex-col items-center text-gray-700" aria-label="About">
        <div className="size-6 rounded-full bg-gray-500" aria-hidden="true"></div>
        <span className="text-xs">About</span>
      </Link>

      <Link href="/previousImages" className="flex flex-col items-center text-gray-700" aria-label="Previous Images">
        <div className="size-6 rounded-full bg-gray-500" aria-hidden="true"></div>
        <span className="text-xs">Previous Images</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
