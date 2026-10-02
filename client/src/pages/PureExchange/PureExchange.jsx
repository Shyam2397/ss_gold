import React, { useReducer, useRef, useCallback, useEffect } from 'react';
import {
    FiSave,
    FiRotateCcw,
    FiAlertCircle,
    FiPlus,
    FiDatabase,
    FiPrinter
} from 'react-icons/fi';
import { GiGoldBar } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import { usePureExchange } from './hooks/usePureExchange';
import skinTestService from '../../services/skinTestService';
import MemoizedFormInput from './components/MemoizedFormInput';
import TableRow from './components/TableRow';
import { FormInputSkeleton, TableSkeleton, ButtonSkeleton } from './components/SkeletonLoaders';
import { printPureExchange } from './utils/printUtils';
import { toStorageDate, toStorageTime } from '../../utils/dateUtils';
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
    const { checkExists, createPureExchangeAsync: createExchange, isCreating } = usePureExchange();
    const navigate = useNavigate();
    
    // Combine local loading state with API creating state for UI feedback
    const isLoading = loading || isCreating;

    const tokenNoInputRef = useRef(null);

    // `disabled={isLoading}` only takes effect after React re-renders, so a fast
    // double-click can fire a submit handler twice before that happens. This ref
    // is set synchronously to close that window.
    const isBusyRef = useRef(false);

    const runGuarded = async (task) => {
        if (isBusyRef.current) return;
        isBusyRef.current = true;
        try {
            await task();
        } finally {
            isBusyRef.current = false;
        }
    };

    // Focus and select the token number input so the next token can be typed straight away
    const focusTokenInput = useCallback(() => {
        const input = tokenNoInputRef.current;
        if (input) {
            input.focus();
            input.select();
        }
    }, []);

    // Keep the token number input ready once any async action finishes
    useEffect(() => {
        if (!isLoading) {
            focusTokenInput();
        }
    }, [isLoading, focusTokenInput]);

    // Function to set error with auto-clear timeout.
    // The pending timer is tracked so a later message cannot be wiped early by an
    // earlier one's timeout firing.
    const errorTimerRef = useRef(null);

    const setErrorWithTimeout = useCallback((message) => {
        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
        }
        dispatch({ type: ACTIONS.SET_ERROR, payload: message });
        errorTimerRef.current = setTimeout(() => {
            dispatch({ type: ACTIONS.SET_ERROR, payload: '' });
            errorTimerRef.current = null;
        }, 3000); // Clear after 3 seconds
    }, []);

    // Drop the pending timer on unmount so it cannot dispatch into a dead component
    useEffect(() => {
        return () => {
            if (errorTimerRef.current) {
                clearTimeout(errorTimerRef.current);
            }
        };
    }, []);

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
            focusTokenInput();
            return;
        }

        if (!point || isNaN(parseFloat(point))) {
            setErrorWithTimeout('Please enter a valid point value');
            focusTokenInput();
            return;
        }

        const tokenExists = tableData.some(row => row.tokenNo === tokenNo.trim());
        if (tokenExists) {
            setErrorWithTimeout(`Token number ${tokenNo} is already added to the table`);
            focusTokenInput();
            return;
        }

        dispatch({ type: ACTIONS.SET_LOADING, payload: true });

        try {
            // Check if token already exists in the database
            try {
                const exists = await checkExists(tokenNo.trim());
                if (exists) {
                    setErrorWithTimeout(`Token ${tokenNo} already exists in Pure Exchange database`);
                    return;
                }
            } catch (error) {
                console.error('Error checking token existence:', error);
                // Continue with the process even if check fails
            }

            // Fetch skin testing data
            const skinTestData = await fetchSkinTestData(tokenNo);

            // fetchSkinTestData reports the specific reason (missing token, missing
            // fields, network error), so don't overwrite it with a generic message
            if (!skinTestData) return;

            // One receipt is headed with a single customer name, so a batch that
            // mixes customers would print the wrong name over everyone else's
            // tokens. Refuse to stage it instead.
            const stagedName = tableData.length ? tableData[0].name : null;
            const incomingName = skinTestData.name;
            const normalizeName = (value) => (value || '').toString().trim().toLowerCase();
            if (stagedName && normalizeName(stagedName) !== normalizeName(incomingName)) {
                setErrorWithTimeout(
                    `This exchange already contains tokens for ${stagedName}. Reset to start a new customer's exchange.`
                );
                return;
            }

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

            // One capture per batch, so every row in a receipt is stamped with the
            // same wall-clock instant. Sent as ISO/24h because the DB parses those
            // the same way regardless of session DateStyle.
            const capturedAt = new Date();

            const newRow = {
                id: tableData.length + 1,
                tokenNo: tokenNo,
                name: name, 
                date: toStorageDate(capturedAt),
                time: toStorageTime(capturedAt),
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
        } catch (error) {
            console.error('Error adding token to the table:', error);
            setErrorWithTimeout('Error adding this token. Please try again.');
        } finally {
            dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        }
    };

    // Shared persistence used by both the Save and the Save & Print actions.
    // Records are independent, so they are saved in parallel (Promise.allSettled)
    // instead of one-by-one to cut latency on multi-row saves.
    //
    // Returns a per-record breakdown rather than a single boolean. A partially
    // successful save is the interesting case: the rows that did persist must be
    // identified so the caller can drop them from the staged table. Keeping them
    // staged is what used to deadlock the form - retrying would re-POST them,
    // come back 409, and never succeed.
    const persistRecords = async (records) => {
        const results = await Promise.allSettled(
            records.map((record) => createExchange(record))
        );

        const savedIndices = [];
        const duplicates = [];
        const failures = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                savedIndices.push(index);
            } else if (result.reason?.response?.status === 409) {
                duplicates.push(records[index]);
            } else {
                failures.push(records[index]);
            }
        });

        return {
            allSaved: savedIndices.length === records.length,
            savedIndices,
            duplicates,
            failures
        };
    };

    // Turn a partial-save breakdown into one message that names the tokens at
    // fault, so the user knows which rows to deal with instead of guessing.
    const describePartialSave = ({ duplicates, failures }) => {
        const MAX_LISTED = 3;
        const listTokens = (records) => {
            const tokens = records.map((record) => record.tokenNo);
            if (tokens.length <= MAX_LISTED) return tokens.join(', ');
            return `${tokens.slice(0, MAX_LISTED).join(', ')} and ${tokens.length - MAX_LISTED} more`;
        };

        const parts = [];
        if (duplicates.length) {
            parts.push(`Already saved: ${listTokens(duplicates)}`);
        }
        if (failures.length) {
            parts.push(`Could not save: ${listTokens(failures)}`);
        }

        return `${parts.join('. ')}. Rows that saved were removed - press Save to retry the rest.`;
    };

    const handleSave = () =>
        runGuarded(async () => {
            try {
                if (tableData.length === 0) {
                    setErrorWithTimeout('Please add at least one entry before saving.');
                    focusTokenInput();
                    return;
                }

                dispatch({ type: ACTIONS.SET_LOADING, payload: true });
                dispatch({ type: ACTIONS.SET_ERROR, payload: '' });

                // Prepare data for saving (excluding id field). Indices line up
                // 1:1 with tableData so outcomes can be mapped back to rows.
                const dataToSave = tableData.map(({ id, ...rest }) => rest);

                const outcome = await persistRecords(dataToSave);

                if (!outcome.allSaved) {
                    // Keep only the rows that did not persist, so a retry cannot
                    // re-send them and hit 409 forever.
                    const savedIndexSet = new Set(outcome.savedIndices);
                    dispatch({
                        type: ACTIONS.SET_TABLE_DATA,
                        payload: tableData.filter((_, index) => !savedIndexSet.has(index))
                    });
                    setErrorWithTimeout(describePartialSave(outcome));
                    return;
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
                focusTokenInput();
            }
        });

    const handleSaveAndPrint = () =>
        runGuarded(async () => {
            if (tableData.length === 0) {
                setErrorWithTimeout('Please add at least one entry before saving and printing.');
                focusTokenInput();
                return;
            }

            // Snapshot the rows so the receipt can be printed after the table is cleared
            const rowsToPrint = [...tableData];
            const dataToSave = rowsToPrint.map(({ id, ...rest }) => rest);

            dispatch({ type: ACTIONS.SET_LOADING, payload: true });
            dispatch({ type: ACTIONS.SET_ERROR, payload: '' });

            let outcome = null;
            try {
                outcome = await persistRecords(dataToSave);

                if (outcome.allSaved) {
                    // Clear the table after successful save
                    dispatch({ type: ACTIONS.SET_TABLE_DATA, payload: [] });
                } else {
                    // Drop the rows that did persist, leaving only the failures
                    // staged so a retry can't re-send them into a 409 loop.
                    const savedIndexSet = new Set(outcome.savedIndices);
                    dispatch({
                        type: ACTIONS.SET_TABLE_DATA,
                        payload: rowsToPrint.filter((_, index) => !savedIndexSet.has(index))
                    });
                }
            } catch (error) {
                console.error('Error saving data:', error);
                const errorMessage = error.response?.data?.error || 'Error saving data. Please try again.';
                setErrorWithTimeout(errorMessage);
            } finally {
                // Release the UI before printing so the form is usable while the job spools
                dispatch({ type: ACTIONS.SET_LOADING, payload: false });
                focusTokenInput();
            }

            // Printing only makes sense once every row is persisted - a receipt
            // listing rows the server rejected would misrepresent the exchange.
            if (!outcome || !outcome.allSaved) {
                if (outcome) setErrorWithTimeout(describePartialSave(outcome));
                return;
            }

            try {
                const printOutcome = await printPureExchange(rowsToPrint);
                // The save is confirmed either way; the print only counts as
                // done when the spooler took the job.
                setErrorWithTimeout(
                    printOutcome?.confirmed
                        ? 'Data saved and printed successfully!'
                        : 'Data saved. Check the print dialog produced the receipt.'
                );
            } catch (error) {
                console.error('Error printing data:', error);
                setErrorWithTimeout('Data saved, but printing failed.');
            }
        });

    const handleReset = () => {
        dispatch({ type: ACTIONS.RESET_FORM });
        focusTokenInput();
    };

    const handleNavigateToExchangeData = () => {
        navigate('/exchange-data');
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
                                inputRef={tokenNoInputRef}
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
                            <ButtonSkeleton width="w-28" />
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={handleNavigateToExchangeData}
                                className="px-2 py-1 border border-amber-300 border-solid text-amber-700 text-sm rounded hover:bg-amber-50 transition-colors flex items-center space-x-1 h-[30px] rounded-xl"
                            >
                                <FiDatabase className="w-3.5 h-3.5" />
                                <span>Exchange Data</span>
                            </button>
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
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-500 border-solid border-t-transparent" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="w-3.5 h-3.5" />
                                        <span>Save</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleSaveAndPrint}
                                className="px-2 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors flex items-center space-x-1 h-[30px] rounded-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-solid border-t-transparent" />
                                        <span>Saving &amp; Printing...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiPrinter className="w-3.5 h-3.5" />
                                        <span>Save &amp; Print</span>
                                    </>
                                )}
                            </button>
                            {/* Thermal Printer Component */}
                            <React.Suspense fallback={<PrinterFallback />}>
                                <ThermalPrinter
                                    tableData={tableData}
                                    onEmpty={() => {
                                        setErrorWithTimeout('Please add at least one entry before printing.');
                                        focusTokenInput();
                                    }}
                                    onPrinted={(outcome) =>
                                        setErrorWithTimeout(
                                            outcome?.confirmed
                                                ? 'Printed successfully!'
                                                : 'Print dialog opened - check the receipt actually printed.'
                                        )
                                    }
                                    onError={() => {
                                        setErrorWithTimeout('Printing failed. Please try again.');
                                        focusTokenInput();
                                    }}
                                />
                            </React.Suspense>
                        </>
                    )}
                </div>
            </div>
            
            
        </div>
    );
};

export default PureExchange;
