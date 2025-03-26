import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import DesktopSidebar from './DesktopSidebar';
import MobileSidebar from './MobileSidebar';
import AddExpense from '../expenses/AddExpense';
import MasterExpense from '../expenses/MasterExpense';
import ViewExpense from '../expenses/ViewExpense';
import CashBook from '../cashbook/CashBook';

const Sidebar = ({ open = true, setOpen, animate = true, user, setLoggedIn }) => {
  const location = useLocation();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showMasterExpense, setShowMasterExpense] = useState(false);
  const [showViewExpense, setShowViewExpense] = useState(false);
  const [showCashBook, setShowCashBook] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    setLoggedIn(false);
  }, [setLoggedIn]);

  const isActive = useCallback((path) => location.pathname === path, [location]);

  return (
    <>
      <DesktopSidebar 
        open={open}
        setOpen={setOpen}
        animate={animate}
        user={user}
        handleLogout={handleLogout}
        isActive={isActive}
        setShowAddExpense={setShowAddExpense}
        setShowMasterExpense={setShowMasterExpense}
        setShowViewExpense={setShowViewExpense}
        setShowCashBook={setShowCashBook}
      />

      <div className="md:hidden fixed top-0 left-0 z-20 m-4">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50"
        >
          <FiMenu className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <MobileSidebar 
        open={open}
        setOpen={setOpen}
        user={user}
        handleLogout={handleLogout}
        isActive={isActive}
        setShowAddExpense={setShowAddExpense}
        setShowMasterExpense={setShowMasterExpense}
        setShowViewExpense={setShowViewExpense}
        setShowCashBook={setShowCashBook}
      />

      <AddExpense isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} />
      <MasterExpense isOpen={showMasterExpense} onClose={() => setShowMasterExpense(false)} />
      <ViewExpense isOpen={showViewExpense} onClose={() => setShowViewExpense(false)} />
      <CashBook isOpen={showCashBook} onClose={() => setShowCashBook(false)} />
    </>
  );
};

export default React.memo(Sidebar);
