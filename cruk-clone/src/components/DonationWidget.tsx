import React, { useState } from 'react';
import './DonationWidget.css';

interface DonationWidgetProps {
  totalDonations: number;
  donationCount: number;
}

export const DonationWidget: React.FC<DonationWidgetProps> = ({ 
  totalDonations, 
  donationCount 
}) => {
  const [customAmount, setCustomAmount] = useState('');
  const [isMonthly, setIsMonthly] = useState(false);

  // Calculate suggested amounts based on previous donations
  const averageDonation = donationCount > 0 ? totalDonations / donationCount : 15;
  const suggestedAmounts = [
    Math.round(averageDonation * 0.8),
    Math.round(averageDonation * 1.2),
  ];

  const handleDonate = (amount: number) => {
    console.log(`Donating £${amount}${isMonthly ? ' monthly' : ''}`);
    // In production, this would redirect to payment page
    alert(`Thank you for your donation of £${amount}${isMonthly ? ' per month' : ''}!`);
  };

  const handleCustomDonate = () => {
    const amount = parseFloat(customAmount);
    if (amount && amount > 0) {
      handleDonate(amount);
      setCustomAmount('');
    }
  };

  return (
    <div className="donation-widget">
      <div className="donation-buttons">
        {suggestedAmounts.map((amount) => (
          <button
            key={amount}
            className="btn-donate-amount primary"
            onClick={() => handleDonate(amount)}
          >
            Donate £{amount}
          </button>
        ))}
      </div>
      
      <div className="custom-amount">
        <span className="currency-symbol">£</span>
        <input
          type="number"
          placeholder="Other amount"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleCustomDonate();
            }
          }}
          min="1"
          step="1"
        />
      </div>

      <label className="monthly-checkbox">
        <input
          type="checkbox"
          checked={isMonthly}
          onChange={(e) => setIsMonthly(e.target.checked)}
        />
        <span>Make it monthly</span>
      </label>
    </div>
  );
};
