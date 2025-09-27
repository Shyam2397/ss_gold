import tokenService from './tokenService';
import entryService from './entryService';

/**
 * Fetches all unpaid customers from the tokens data
 * @returns {Promise<Array>} Array of customer objects with unpaid tokens
 */
export const getUnpaidCustomers = async () => {
  try {
    // Get all tokens and entries in parallel
    const [tokens, entries] = await Promise.all([
      tokenService.getTokens(),
      entryService.getEntries()
    ]);
    
    // Create a map of code to entry for quick lookup
    const entryMap = new Map();
    entries.forEach(entry => {
      if (entry.code) {
        entryMap.set(entry.code, entry);
      }
    });
    
    // Filter for unpaid tokens and map to customer data
    const unpaidCustomers = [];
    
    for (const token of tokens) {
      if (token.isPaid) continue; // Skip paid tokens
      
      // Find matching entry by code
      const entry = token.code ? entryMap.get(token.code) : null;
      
      // Get phone number from entry or use default
      const phoneNumber = entry?.phoneNumber || 'N/A';
      
      unpaidCustomers.push({
        id: token.id,
        name: token.name || 'N/A',
        phone: phoneNumber,
        code: token.code || 'N/A',
        address: token.address || 'N/A',
        outstandingBalance: token.amount || 0,
        lastPaymentDate: token.updatedAt || token.updated_at || 'N/A',
        tokenNo: token.tokenNo || token.token_no || 'N/A',
        test: token.test || 'N/A',
        weight: token.weight || 'N/A',
        date: token.date || 'N/A',
        time: token.time || 'N/A',
        // Include any other relevant fields from token
        ...token
      });
    }

    return unpaidCustomers;
  } catch (error) {
    console.error('Error fetching unpaid customers:', error);
    throw error;
  }
};

// For backward compatibility
export const getCustomers = async () => {
  return []; // Not implemented as we're using token data
};

export default {
  getCustomers,
  getUnpaidCustomers,
};