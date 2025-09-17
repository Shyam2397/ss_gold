import { useCallback } from 'react';
import skinTestService from '../../../services/skinTestService';

export const useTokenSearch = (dispatch) => {
  const handleTokenSearch = useCallback(async (tokenNo) => {
    if (!tokenNo) return;
    
    try {
      // First try to get the token data
      const tokenData = await skinTestService.getTokenData(tokenNo);
      
      // Then get the skin test data for this token
      const skinTests = await skinTestService.getSkinTests();
      const skinTestData = skinTests.find(test => 
        (test.tokenNo === tokenNo || test.token_no === tokenNo)
      );

      if (tokenData || skinTestData) {
        dispatch({
          type: 'UPDATE_FORM_DATA',
          payload: {
            tokenNo: tokenData?.tokenNo || skinTestData?.tokenNo || skinTestData?.token_no || '',
            date: tokenData?.date || skinTestData?.date || '',
            name: tokenData?.name || skinTestData?.name || '',
            sample: tokenData?.sample || skinTestData?.sample || '',
            weight: tokenData?.weight || skinTestData?.weight || '',
            goldFineness: tokenData?.gold_fineness || tokenData?.goldFineness || 
                          skinTestData?.gold_fineness || skinTestData?.goldFineness || '',
            karat: tokenData?.karat || skinTestData?.karat || '',
            silver: tokenData?.silver || skinTestData?.silver || '0.00',
            copper: tokenData?.copper || skinTestData?.copper || '0.00',
            zinc: tokenData?.zinc || skinTestData?.zinc || '0.00',
            cadmium: tokenData?.cadmium || skinTestData?.cadmium || '0.00',
            remarks: tokenData?.remarks || skinTestData?.remarks || ''
          }
        });
      } else {
        // If no data found, update just the token number
        dispatch({
          type: 'UPDATE_FORM_DATA',
          payload: { tokenNo: tokenNo }
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error (e.g., show error message to user)
    }
  }, [dispatch]);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM_DATA' });
  }, [dispatch]);

  return {
    handleTokenSearch,
    resetForm
  };
};
