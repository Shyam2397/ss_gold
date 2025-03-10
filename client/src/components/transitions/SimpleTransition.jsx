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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
                duration: 0.4,
                ease: [0.43, 0.13, 0.23, 0.96],
                staggerChildren: 0.1
            }}
        >
            
        </motion.div>
    );
};

export default SimpleTransition;
