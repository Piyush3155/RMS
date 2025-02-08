import React from 'react';

const Header = () => {
  return (
    <div className="flex justify-between items-center bg-blue-700 p-4 text-white">
      <a href="/" className="text-2xl font-bold">PLAY△TECH</a>
      <nav className="flex gap-x-6 items-center">
        <a href="#" className="hover:text-gray-300">Home</a>
        <a href="#" className="hover:text-gray-300">About</a>
        <a href="#" className="hover:text-gray-300">Contact</a>
        </nav>
      </div>
    
  );
};

export default Header;
