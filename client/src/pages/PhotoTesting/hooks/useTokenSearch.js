import { useCallback } from 'react';
import skinTestService from '../../../services/skinTestService';

export const useTokenSearch = (dispatch) => {
  const handleTokenSearch = useCallback(async (tokenNo) => {
    const query = String(tokenNo ?? '').trim();
    if (!query) return;

    try {
      // Token records and skin-test results live in separate tables, so either
      // may be missing. Look both up directly by token number instead of
      // downloading the whole skin-test table to filter client-side.
      const [tokenData, skinTestData] = await Promise.all([
        skinTestService.getTokenData(query),
        skinTestService.getSkinTestByTokenNo(query)
      ]);

      if (tokenData || skinTestData) {
        dispatch({
          type: 'UPDATE_FORM_DATA',
          payload: {
            tokenNo: tokenData?.tokenNo || skinTestData?.tokenNo || skinTestData?.token_no || query,
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
            remarks: tokenData?.remarks || skinTestData?.remarks || '',
            photoUrl: null
          }
        });
      } else {
        // Nothing found - clear any fields left from a previous search so the
        // card reflects only the searched token number.
        dispatch({ type: 'RESET_FORM_DATA' });
        dispatch({ type: 'UPDATE_FORM_DATA', payload: { tokenNo: query } });
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
