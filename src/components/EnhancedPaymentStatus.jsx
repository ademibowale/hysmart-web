
import React, { useState, useEffect } from 'react';

export default function EnhancedPaymentStatus({ payment }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);

  useEffect(() => {
    if (payment?.expires_at) {
      const expiry = new Date(payment.expires_at);
      const now = new Date();
      const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      setDaysRemaining(diff > 0 ? diff : 0);
    }
  }, [payment]);

  const retryPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/payments/retry/${payment.id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Retry failed');
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => date ? new Date(date).toDateString() : 'N/A';

  return (
    <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 10 }}>
      <h3>Subscription Details</h3>
      <p><strong>Plan:</strong> {payment.planName}</p>
      <p><strong>Price:</strong> ₦{payment.price}</p>
      <p><strong>Status:</strong> {payment.status}</p>
      <p><strong>Expires:</strong> {formatDate(payment.expires_at)}</p>
      {daysRemaining !== null && (
        <p><strong>Days Remaining:</strong> {daysRemaining} day(s)</p>
      )}

      {payment.status === 'failed' && (
        <div style={{ marginTop: 16, padding: 12, background: '#ffe6e6', borderRadius: 8 }}>
          <h4>Payment Failed</h4>
          <p>Reason: {payment.failure_reason || 'Transaction declined'}</p>
          <button onClick={retryPayment} disabled={loading}>
            {loading ? 'Retrying...' : 'Retry Payment'}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
