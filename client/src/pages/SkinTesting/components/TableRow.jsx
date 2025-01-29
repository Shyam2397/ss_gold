import React from 'react';
import { FiEdit2, FiTrash2, FiMessageSquare } from 'react-icons/fi';

const TableRow = ({ test, onEdit, onDelete }) => {
  const handleWhatsAppShare = () => {
    const message = `
Token No: ${test.tokenNo}
Name: ${test.name}
Date: ${test.date}
Time: ${test.time}
Weight: ${test.weight}
Sample: ${test.sample}
Gold Fineness: ${test.gold_fineness}%
Karat: ${test.karat}
Remarks: ${test.remarks}`;

    const encodedMessage = encodeURIComponent(message);
    let phoneNumber = test.phoneNumber?.replace(/\\D/g, '') || '';

    // Handle Indian phone numbers
    if (phoneNumber) {
      // Remove leading zeros if any
      phoneNumber = phoneNumber.replace(/^0+/, '');

      // If number starts with 91, make sure it's not duplicated
      if (phoneNumber.startsWith('91')) {
        phoneNumber = phoneNumber.substring(2);
      }

      // Check if it's a valid Indian mobile number (10 digits)
      if (phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber;
      } else {
        alert('Invalid phone number format. Please ensure it is a 10-digit Indian mobile number.');
        return;
      }
    } else {
      alert('No phone number available for this entry');
      return;
    }

    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <tr
      className="hover:bg-amber-50 transition-colors duration-200"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(test)}
            className="text-amber-600 hover:text-amber-900 transition-colors duration-200"
          >
            <FiEdit2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(test.tokenNo)}
            className="text-red-600 hover:text-red-900 transition-colors duration-200"
          >
            <FiTrash2 className="h-5 w-5" />
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="text-green-600 hover:text-green-900 transition-colors duration-200"
            title="Share via WhatsApp"
          >
            <FiMessageSquare className="h-5 w-5" />
          </button>
        </div>
      </td>
      {Object.keys(test)
        .filter((key) => !["code", "phoneNumber"].includes(key))
        .map((key) => (
          <td
            key={key}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          >
            {test[key]}
          </td>
        ))}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {test.phoneNumber || "N/A"}
      </td>
    </tr>
  );
};

export default TableRow;
