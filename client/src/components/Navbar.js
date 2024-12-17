import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";
import Logo from "../asset/logo.png";
import { LuLayoutDashboard } from "react-icons/lu";
import { BsPersonAdd } from "react-icons/bs";
import { GrVirtualMachine } from "react-icons/gr";
import { MdMonochromePhotos, MdOutlineGeneratingTokens } from "react-icons/md";
import { IoChevronDownSharp, IoChevronForwardSharp } from "react-icons/io5";

const SidebarLink = ({ to, label, onClick }) => (
  <li>
    <Link
      to={to}
      className="mt-4 py-2 px-4 transition ease-in-out delay-150 bg-[#FF7E69] hover:-translate-y-1 hover:scale-110 hover:translate-x-2 hover:bg-[#F9F3F1] duration-500 hover:text-[#FF7E69] rounded-full flex items-center"
      aria-label={label}
      onClick={onClick}
    >
      <div className="pl-3">{label}</div>
    </Link>
  </li>
);

SidebarLink.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

const DataSubmenu = ({ isOpen, toggleOpen, onLinkClick }) => (
  <li className="relative">
    <div
      className="mt-4 py-2 px-4 cursor-pointer transition ease-in-out delay-150 bg-[#FF7E69] hover:-translate-y-1 hover:scale-110 hover:translate-x-2 hover:bg-[#F9F3F1] duration-500 hover:text-[#FF7E69] rounded-full flex items-center justify-between"
      onClick={toggleOpen}
    >
      <span className="pl-3">Data</span>
      {isOpen ? <IoChevronDownSharp /> : <IoChevronForwardSharp />}
    </div>
    {isOpen && (
      <ul className="absolute left-full top-0 mt-1 w-48 bg-[#FF7E69] text-[#F9F3F1] rounded-xl shadow-lg p-2 z-10">
        <SidebarLink
          to="/customer-data"
          label="Customer Data"
          onClick={onLinkClick}
        />
        <SidebarLink
          to="/token-data"
          label="Token Data"
          onClick={onLinkClick}
        />
        <SidebarLink
          to="/skintest-data"
          label="Skin Test Data"
          onClick={onLinkClick}
        />
      </ul>
    )}
  </li>
);

DataSubmenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleOpen: PropTypes.func.isRequired,
  onLinkClick: PropTypes.func.isRequired,
};

const Navbar = ({ setLoggedIn, user }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dataDropdownOpen, setDataDropdownOpen] = useState(false);

  const links = [
    { to: "/dashboard", icon: LuLayoutDashboard, label: "Dashboard" },
    { to: "/entries", icon: BsPersonAdd, label: "New Entries" },
    { to: "/token", icon: MdOutlineGeneratingTokens, label: "Token" },
    { to: "/skin-testing", icon: GrVirtualMachine, label: "Skin Testing" },
    { to: "/photo-testing", icon: MdMonochromePhotos, label: "Photo Testing" },
  ];

  const handleLogout = () => {
    setLoggedIn(false);
    navigate("/"); // Redirect to the login page
  };

  const handleLinkClick = () => {
    setDropdownOpen(false);
    setDataDropdownOpen(false); // Close data dropdown when navigating
  };

  return (
    <div className="navbar bg-[#E4E7D4] rounded-xl m-3 p-2 flex flex-wrap items-center justify-between w-auto">
      <div className="flex items-center pb-2">
        <div className="dropdown">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost transition ease-in-out delay-150 bg-[#E4E7D4] hover:-translate-y-1 hover:scale-110 hover:bg-[#FF7E69] duration-500 hover:text-white rounded-full text-[#554333] md:hidden"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          {dropdownOpen && (
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-[#FF7E69] rounded-box z-[2] mt-3 w-52 p-2 shadow text-white"
            >
              {links.map((link) => (
                <SidebarLink
                  key={link.to}
                  to={link.to}
                  label={link.label}
                  onClick={handleLinkClick}
                />
              ))}
              <DataSubmenu
                isOpen={dataDropdownOpen}
                toggleOpen={() => setDataDropdownOpen(!dataDropdownOpen)}
                onLinkClick={handleLinkClick}
              />
            </ul>
          )}
        </div>
        <img
          src={Logo}
          alt="Company Logo"
          className="h-11 pl-5 max-[450px]:pl-0 max-[450px]:h-9"
        />
        <div className="bg-[#FFFCF5] pr-3 rounded-full">
          <div
            className="pl-3 max-[450px]:text-4xl text-5xl font-bold"
            style={{
              background:
                "linear-gradient(90deg, rgba(224,170,62,1) 0%, rgba(255,215,0,1) 67%, rgba(224,170,62,1) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SS GOLD
          </div>
        </div>
      </div>
      <div className="flex-none gap-2">
        <div className="dropdown dropdown-end pr-5">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
            aria-label="User menu"
          >
            <div className="w-10 max-[450px]:w-9 rounded-full">
              <img alt={`${user.name}'s Profile`} src={user.profileImage} />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-[#FF7E69] rounded-box z-[1] mt-3 w-52 p-2 text-white shadow"
          >
            <li>
              <button className="w-full text-left">
                Profile
                <span className="badge text-[#FF7E69] bg-slate-50 border-none">
                  New
                </span>
              </button>
            </li>
            <li>
              <button className="w-full text-left">Settings</button>
            </li>
            <li>
              <button onClick={handleLogout} className="w-full text-left">
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

Navbar.propTypes = {
  setLoggedIn: PropTypes.func.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    profileImage: PropTypes.string.isRequired,
  }).isRequired,
};

export default Navbar;
