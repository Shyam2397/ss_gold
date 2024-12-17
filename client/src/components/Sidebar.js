import React from "react";
import { Link } from "react-router-dom";
import { IoMenu } from "react-icons/io5";
import { BiMenuAltRight } from "react-icons/bi";
import { LuLayoutDashboard } from "react-icons/lu";
import { BsPersonAdd } from "react-icons/bs";
import { GrVirtualMachine } from "react-icons/gr";
import { MdMonochromePhotos } from "react-icons/md";
import { MdOutlineGeneratingTokens } from "react-icons/md";
import { IoChevronForwardSharp } from "react-icons/io5";

const SidebarLink = ({ to, icon: Icon, label, isOpen }) => (
  <li>
    <Link
      to={to}
      className="block px-1 mt-4 py-2 transition ease-in-out delay-150 bg-[#E4E7D4] hover:-translate-y-1 hover:scale-110 hover:translate-x-5 hover:bg-[#FF7E69] duration-500 hover:text-white rounded-full"
      aria-label={label}
    >
      {isOpen ? (
        <div className="flex items-center w-full">
          <Icon fontSize={25} />
          <div className="pl-3">{label}</div>
        </div>
      ) : (
        <div className="w-fit pl-2">
          <Icon fontSize={25} />
        </div>
      )}
    </Link>
  </li>
);

const Submenu = ({ label, links, isOpen, isSubmenuOpen, toggleSubmenu }) => (
  <li className="mt-4">
    <div
      className="flex items-center px-1 py-2 transition ease-in-out delay-150 bg-[#E4E7D4] hover:-translate-y-1 hover:scale-110 hover:translate-x-5 hover:bg-[#FF7E69] duration-500 hover:text-white rounded-full cursor-pointer"
      onClick={toggleSubmenu}
    >
      {isOpen ? (
        <>
          <IoChevronForwardSharp
            className={`transition-transform ${
              isSubmenuOpen ? "rotate-90" : ""
            }`}
            fontSize={25}
          />
          <div className="pl-3">{label}</div>
        </>
      ) : (
        <IoChevronForwardSharp
          className={`w-fit pl-2 transition-transform ${
            isSubmenuOpen ? "rotate-90" : ""
          }`}
          fontSize={25}
        />
      )}
    </div>
    {isSubmenuOpen && (
      <ul className={`${isOpen ? "pl-6" : "pl-0"} transition-all duration-300`}>
        {links.map((link) => (
          <SidebarLink
            key={link.to}
            to={link.to}
            icon={link.icon}
            label={link.label}
            isOpen={isOpen}
          />
        ))}
      </ul>
    )}
  </li>
);

const Sidebar = ({ isOpen, toggleSidebar, links }) => {
  const [isSubmenuOpen, setIsSubmenuOpen] = React.useState(false);

  const toggleSubmenu = () => setIsSubmenuOpen(!isSubmenuOpen);

  return (
    <div
      className={`${
        isOpen ? "w-56" : "w-16"
      } bg-[#E4E7D4] flex-col my-3 ml-3 rounded-xl text-[#554333] md:flex hidden`}
    >
      <button
        onClick={toggleSidebar}
        className="text-left p-2 ml-2 m-1 mt-6 rounded-full w-fit  transition ease-in-out delay-150 bg-[#E4E7D4] hover:-translate-y-1 hover:translate-x-3 hover:scale-110 hover:bg-[#FF7E69] duration-500 hover:text-white "
        aria-label="Toggle Sidebar"
      >
        {isOpen ? (
          <div>
            <BiMenuAltRight fontSize={25} />
          </div>
        ) : (
          <div className="pl-1 pr-2 w-fit">
            <IoMenu fontSize={25} />
          </div>
        )}
      </button>
      <nav className="flex-grow pl-2">
        <ul>
          {links.map((link) => {
            if (link.submenu) {
              return (
                <Submenu
                  key={link.label}
                  label={link.label}
                  links={link.submenu}
                  isOpen={isOpen}
                  isSubmenuOpen={isSubmenuOpen}
                  toggleSubmenu={toggleSubmenu}
                />
              );
            }
            return (
              <SidebarLink
                key={link.to}
                to={link.to}
                icon={link.icon}
                label={link.label}
                isOpen={isOpen}
              />
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

// Example usage of the Sidebar component with dynamic links and submenu
const links = [
  { to: "/dashboard", icon: LuLayoutDashboard, label: "Dashboard" },
  { to: "/entries", icon: BsPersonAdd, label: "New Entries" },
  { to: "/token", icon: MdOutlineGeneratingTokens, label: "Token" },
  { to: "/skin-testing", icon: GrVirtualMachine, label: "Skin Testing" },
  { to: "/photo-testing", icon: MdMonochromePhotos, label: "Photo Testing" },
  {
    label: "Datas",
    submenu: [
      { to: "/customer-data", icon: BsPersonAdd, label: "Customer Data" },
      {
        to: "/token-data",
        icon: MdOutlineGeneratingTokens,
        label: "Token Data",
      },
      {
        to: "/skintest-data",
        icon: GrVirtualMachine,
        label: "Skin Test Data",
      },
    ],
  },
];

export default function App() {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} links={links} />
  );
}
