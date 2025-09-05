import React, { useReducer } from 'react';
import {
    FiSave,
    FiRotateCcw,
    FiAlertCircle,
    FiPlus,
} from 'react-icons/fi';
import { GiGoldBar } from 'react-icons/gi';
import { usePureExchange } from './hooks/usePureExchange';
import skinTestService from '../../services/skinTestService';
import MemoizedFormInput from './components/MemoizedFormInput';
import TableRow from './components/TableRow';
import { FormInputSkeleton, TableSkeleton, ButtonSkeleton } from './components/SkeletonLoaders';
const ThermalPrinter = React.lazy(() => import('./ThermalPrinter'));

// Suspense fallback component
const PrinterFallback = () => (
  <button
    className="disabled px-2 py-1 border border-amber-300 border-solid text-amber-700 text-sm rounded hover:bg-amber-50 transition-colors flex items-center space-x-1 h-[30px] opacity-50 cursor-not-allowed"
  >
    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-500 border-solid border-t-transparent" />
    <span>Loading Printer...</span>
  </button>
);

// Using the memoized FormInput component instead of the inline version

// Action types
const ACTIONS = {
    SET_TOKEN_NO: 'set_token_no',
    SET_POINT: 'set_point',
    SET_TABLE_DATA: 'set_table_data',
    ADD_TABLE_ROW: 'add_table_row',
    SET_ERROR: 'set_error',
    SET_LOADING: 'set_loading',
    RESET_FORM: 'reset_form'
};

// Initial state
const initialState = {
    tokenNo: '',
    point: '0.20',
    tableData: [],
    error: '',
    loading: false
};

// Reducer function
const pureExchangeReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.SET_TOKEN_NO:
            return {
                ...state,
                tokenNo: action.payload
            };
        case ACTIONS.SET_POINT:
            return {
                ...state,
                point: action.payload
            };
        case ACTIONS.SET_TABLE_DATA:
            return {
                ...state,
                tableData: action.payload
            };
        case ACTIONS.ADD_TABLE_ROW:
            return {
                ...state,
                tableData: [...state.tableData, action.payload],
                tokenNo: '' // Clear token number after adding
            };
        case ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload
            };
        case ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload
            };
        case ACTIONS.RESET_FORM:
            return {
                ...state,
                tokenNo: '',
                point: '0.20',
                tableData: [],
                error: ''
            };
        default:
            return state;
    }
};

const PureExchange = () => {
    const [state, dispatch] = useReducer(pureExchangeReducer, initialState);
    const { tokenNo, point, tableData, error, loading } = state;
    const { checkExists, createPureExchange: createExchange, isCreating } = usePureExchange();
    
    // Combine local loading state with API creating state for UI feedback
    const isLoading = loading || isCreating;

    // Function to set error with auto-clear timeout
    const setErrorWithTimeout = (message) => {
        dispatch({ type: ACTIONS.SET_ERROR, payload: message });
        setTimeout(() => {
            dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
        }, 3000); // Clear after 3 seconds
    };

    const fetchSkinTestData = async (tokenNo) => {
        try {
            const skinTests = await skinTestService.getSkinTests();
            
            if (!skinTests || skinTests.length === 0) {
                setErrorWithTimeout('No skin testing data available');
                return null;
            }

            const skinTest = skinTests.find(test => {
                // Check for both token_no and tokenNo for backward compatibility
                const testTokenNo = (test.token_no || test.tokenNo || '').toString().trim();
                return testTokenNo === tokenNo.toString().trim();
            });
            
            if (!skinTest) {
                setErrorWithTimeout(`Token number ${tokenNo} not found in skin testing records`);
                return null;
            }
            
            // Validate required fields
            const requiredFields = ['weight', 'highest', 'average', 'gold_fineness', 'name'];
            const missingFields = requiredFields.filter(field => !skinTest[field]);
            
            if (missingFields.length > 0) {
                setErrorWithTimeout(`Missing required data: ${missingFields.join(', ')}`);
                return null;
            }
            
            return skinTest;
        } catch (error) {
            console.error('Error fetching skin test data:', error);
            setErrorWithTimeout('Network error while fetching skin test data. Please try again.');
            return null;
        }
    };

    const handleAdd = async () => {
        if (!tokenNo.trim()) {
            setErrorWithTimeout('Please enter a token number');
            return;
        }

        if (!point || isNaN(parseFloat(point))) {
            setErrorWithTimeout('Please enter a valid point value');
            return;
        }

        const tokenExists = tableData.some(row => row.tokenNo === tokenNo.trim());
        if (tokenExists) {
            setErrorWithTimeout(`Token number ${tokenNo} is already added to the table`);
            return;
        }

        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        
        // Check if token already exists in the database
        try {
            const exists = await checkExists(tokenNo.trim());
            if (exists) {
                dispatch({ type: ACTIONS.SET_LOADING, payload: false });
                setErrorWithTimeout(`Token ${tokenNo} already exists in Pure Exchange database`);
                return;
            }
        } catch (error) {
            console.error('Error checking token existence:', error);
            // Continue with the process even if check fails
        }
        
        // Fetch skin testing data
        const skinTestData = await fetchSkinTestData(tokenNo);
        
        if (!skinTestData) {
            dispatch({ type: ACTIONS.SET_LOADING, payload: false });
            setErrorWithTimeout('The skin test report does not exist for this token number');
            return;
        }
        
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        dispatch({ type: ACTIONS.SET_ERROR, payload: '' }); // Clear any existing error message
        
        // Extract required values
        const { weight, highest, average, gold_fineness, name } = skinTestData;

        const AfterScrapWeight = weight - 0.010;

        // Calculate values based on the logic
        const hWeight = (parseFloat(AfterScrapWeight) * parseFloat(highest)) / 100;
        const aWeight = (parseFloat(AfterScrapWeight) * parseFloat(average)) / 100;
        const gWeight = (parseFloat(AfterScrapWeight) * parseFloat(gold_fineness)) / 100;
        const exGold = parseFloat(gold_fineness) - parseFloat(point);
        const exWeight = (parseFloat(AfterScrapWeight) * exGold)/100;

        const newRow = {
            id: tableData.length + 1,
            tokenNo: tokenNo,
            name: name, 
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\/+/g, '-'),
            time: new Date().toLocaleTimeString(),
            weight: parseFloat(AfterScrapWeight).toFixed(3),
            highest: parseFloat(highest).toFixed(2),
            hWeight: hWeight.toFixed(3),
            average: parseFloat(average).toFixed(2),
            aWeight: aWeight.toFixed(3),
            goldFineness: parseFloat(gold_fineness).toFixed(2),
            gWeight: gWeight.toFixed(3),
            exGold: parseFloat(exGold).toFixed(2),
            exWeight: exWeight.toFixed(3)
        };

        dispatch({ type: ACTIONS.ADD_TABLE_ROW, payload: newRow });
    };

    const handleSave = async () => {
        try {
            if (tableData.length === 0) {
                setErrorWithTimeout('Please add at least one entry before saving.');
                return;
            }

            dispatch({ type: ACTIONS.SET_LOADING, payload: true });
            dispatch({ type: ACTIONS.SET_ERROR, payload: '' });

            // Prepare data for saving (excluding id field)
            const dataToSave = tableData.map(({ id, ...rest }) => rest);

            // Save each record
            for (const record of dataToSave) {
                try {
                    await createExchange(record);
                } catch (error) {
                    if (error.response?.status === 409) {
                        setErrorWithTimeout(`Token ${record.tokenNo} already exists in Pure Exchange data.`);
                        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
                        return;
                    }
                    throw error; // Re-throw other errors
                }
            }

            // Clear the table after successful save
            dispatch({ type: ACTIONS.SET_TABLE_DATA, payload: [] });
            setErrorWithTimeout('Data saved successfully!');
        } catch (error) {
            console.error('Error saving data:', error);
            const errorMessage = error.response?.data?.error || 'Error saving data. Please try again.';
            setErrorWithTimeout(errorMessage);
        } finally {
            dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        }
    };

    const handleReset = () => {
        dispatch({ type: ACTIONS.RESET_FORM });
    };

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8">
            
            {/* Form Section */}
            <div className="bg-white rounded-lg shadow-sm p-3 border border-amber-100 border-solid">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div
                            className="mr-2"
                        >
                            <GiGoldBar className="w-6 h-6 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-amber-900">Pure Exchange</h2>
                    </div>
                    {error && (
                <div className={`p-1 rounded-md ${error.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center">
                        <FiAlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium ml-2">{error}</p>
                    </div>
                </div>
            )}
                </div>

                {/* Input Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2 bg-amber-50/50 rounded mb-3">
                    <div className="flex items-end space-x-2">
                    {isLoading ? (
                        <>
                            <FormInputSkeleton className="flex-1" />
                            <FormInputSkeleton className="w-20" />
                            <ButtonSkeleton />
                        </>
                    ) : (
                        <>
                            <MemoizedFormInput
                                label="Token Number"
                                name="tokenNo"
                                value={tokenNo}
                                onChange={(e) => dispatch({ type: ACTIONS.SET_TOKEN_NO, payload: e.target.value })}
                                className="flex-1"
                            />
                            <MemoizedFormInput
                                label="Point"
                                name="point"
                                value={point}
                                onChange={(e) => dispatch({ type: ACTIONS.SET_POINT, payload: e.target.value })}
                                className="w-20"
                            />
                            <button
                                onClick={handleAdd}
                                className="px-2 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 transition-colors flex items-center space-x-1 h-[30px] rounded-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-solid border-t-transparent" />
                                        <span>Adding...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiPlus className="w-3.5 h-3.5" />
                                        <span>Add</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-xl border border-amber-100 border-solid mt-2">
                    <div className="overflow-x-auto">
                        <div className="flex flex-col h-[calc(100vh-280px)]">
                            <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
                                <table className="min-w-full divide-y divide-amber-200">
                                <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                                        <tr>
                                        {[
                                            'S.no', 'Token-no', 'Name', 'Date', 'Time', 'Weight',
                                            'Highest', 'H.Weight', 'Average', 'A.Weight',
                                            'Gold Fineness', 'G.Weight', 'Ex.Gold', 'Ex.Weight'
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                        </tr>
                                    </thead>
                                <tbody className="bg-white divide-y divide-amber-100">
                                    {isLoading ? (
                                        <TableSkeleton rowCount={3} />
                                    ) : (
                                        tableData.map((row, index) => (
                                            <TableRow 
                                                key={row.tokenNo} 
                                                row={row} 
                                                index={index} 
                                            />
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 mt-2">
                    {isLoading ? (
                        <div className="flex space-x-2">
                            <ButtonSkeleton width="w-16" />
                            <ButtonSkeleton width="w-16" />
                            <ButtonSkeleton width="w-24" />
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={handleReset}
                                className="px-2 py-1 border border-amber-300 border-solid text-amber-700 text-sm rounded hover:bg-amber-50 transition-colors flex items-center space-x-1 h-[30px] rounded-xl"
                                disabled={isLoading}
                            >
                                <FiRotateCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-2 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 transition-colors flex items-center space-x-1 h-[30px] rounded-xl"
                                disabled={isLoading || tableData.length === 0}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-solid border-t-transparent" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="w-3.5 h-3.5" />
                                        <span>Save</span>
                                    </>
                                )}
                            </button>
                            {/* Thermal Printer Component */}
                            <React.Suspense fallback={<PrinterFallback />}>
                                <ThermalPrinter tableData={tableData} />
                            </React.Suspense>
                        </>
                    )}
                </div>
            </div>
            
            
        </div>
    );
};

export default PureExchange;
