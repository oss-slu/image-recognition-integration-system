const BottomNav = () => {
    return (
      <nav className="absolute bottom-0 w-full bg-white border-t flex justify-around py-2 shadow-md">
        <button className="flex flex-col items-center text-gray-700">
          <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center text-gray-700">
          <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
          <span className="text-xs">Search</span>
        </button>
        <button className="flex flex-col items-center text-gray-700" >
          <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
          <span className="text-xs">Profile</span>
        </button>
      </nav>
    );
  };
  
  export default BottomNav;
  