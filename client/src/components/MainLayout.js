import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Logo from "../asset/logo.png";

const MainLayout = ({ setLoggedIn }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const user = {
    name: "John Doe",
    profileImage:
      "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp",
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col md:flex-row md:h-screen sm:h-fit bg-[#D6E0D5]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col flex-grow">
        <Navbar
          setLoggedIn={setLoggedIn}
          user={user}
          toggleSidebar={toggleSidebar}
        />
        {location.pathname === "/" && (
          <div className="flex justify-center items-center bg-[#FFFCF5] m-3 max-[767px]:h-screen h-full rounded-xl">
            <img
              src={Logo} // Replace with the actual path to your logo
              alt="Company Logo"
              className="h-64" // Adjust the size as needed
            />
          </div>
        )}
        <main className="flex-grow px-6 py-3 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
