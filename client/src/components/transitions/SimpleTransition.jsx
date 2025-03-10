import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const routes = {
    "/": "Login",
    "/dashboard": "Dashboard",
    "/entries": "New Entries",
    "/token": "Token",
    "/skin-testing": "Skin Testing",
    "/photo-testing": "Photo Testing",
    "/customer-data": "Customer Data",
    "/token-data": "Token Data",
    "/skintest-data": "Skin Test Data",
    "/pure-exchange": "Pure Exchange",
    "/exchange-data": "Exchange Data"
};

const SimpleTransition = () => {
    const location = useLocation();

    return (
        <motion.div
            className='page-transition'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
        >
        </motion.div>
    );
};

export default SimpleTransition;
