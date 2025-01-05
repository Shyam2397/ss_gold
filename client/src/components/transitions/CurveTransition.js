import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { text, curve, translate } from './anim';
import './CurveTransition.css';

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

const anim = (variants) => {
    return {
        variants,
        initial: "initial",
        animate: "enter",
        exit: "exit"
    }
}

const SVG = ({ height, width }) => {
    const initialPath = `
        M0 300 
        Q${width/2} 0 ${width} 300
        L${width} ${height + 300}
        Q${width/2} ${height + 600} 0 ${height + 300}
        L0 0
    `;

    const targetPath = `
        M0 300
        Q${width/2} 0 ${width} 300
        L${width} ${height}
        Q${width/2} ${height} 0 ${height}
        L0 0
    `;

    return (
        <motion.svg {...anim(translate)}>
            <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#fbbf24' }} /> {/* amber-400 */}
                    <stop offset="100%" style={{ stopColor: '#facc15' }} /> {/* yellow-400 */}
                </linearGradient>
            </defs>
            <motion.path fill="url(#curveGradient)" {...anim(curve(initialPath, targetPath))} />
        </motion.svg>
    );
};

const CurveTransition = () => {
    const location = useLocation();
    const [dimensions, setDimensions] = useState({
        width: null,
        height: null
    });

    useEffect(() => {
        function resize() {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        }
        resize();
        window.addEventListener("resize", resize);
        return () => {
            window.removeEventListener("resize", resize);
        }
    }, []);

    return (
        <div className='curve'>
            <div 
                style={{ opacity: dimensions.width == null ? 1 : 0 }} 
                className='background'
            />
            <motion.p className='route' {...anim(text)}>
                {routes[location.pathname] || location.pathname.substring(1)}
            </motion.p>
            {dimensions.width != null && <SVG {...dimensions} />}
        </div>
    );
};

export default CurveTransition;
