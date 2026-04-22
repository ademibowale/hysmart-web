import EnhancedPaymentStatus from '../components/EnhancedPaymentStatus';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    axios.get('/api/admin/payments')
      .then(res => setPayments(res.data));
  }, []);

  return (
    <div>
      <h2>Pending Payments</h2>
      {payments.map(p => (
        <div key={p.reference}>
          {p.user_id} - {p.plan} - {p.status}
        </div>
      ))}
    </div>
  );
}


// Auto-wired Payment Status
<EnhancedPaymentStatus payment={payment} />
