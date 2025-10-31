import React, { useEffect, useState } from 'react';
import { OrderCard } from '../components';
import styles from './pagesStyles/order.module.css';
import { useGetOrdersQuery } from '../redux/orderApi';

const pad2 = (n) => String(n).padStart(2, '0');
const hhmm = (iso) => {
  try { const d = new Date(iso); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
  catch { return '--:--'; }
};

const toCardShape = (ord) => {
  const items = (ord?.items || []).map((it) => ({
    name: it?.name || '',
    quntity: Number(it?.qnt || 0),
    avgPrepTime: Number(it?.avgPrepTime || 0),
  }));
  const totalPrepMin = items.reduce((sum, it) => sum + (it.avgPrepTime || 0), 0);
  return {
    orderMongoId: ord?._id,
    orderId: ord?.shortId || ord?._id?.slice(-3) || '—',
    tableNo: ord?.tableNo ?? '--',
    orderTime: hhmm(ord?.createdAt),
    createdAt: ord?.createdAt,
    orderType: (ord?.orderType || 'dine-in')
      .replace('-', '')
      .replace(/\b\w/g, (m) => m.toUpperCase())
      .replace('Dinein', 'Dine In')
      .replace('Takeaway', 'Takeaway'),
    items,
    totalPrepMin,
    orderStatus: (ord?.status || 'processing').replace(/\b\w/g, (m) => m.toUpperCase()),
  };
};

const Orders = () => {
  const { data, isLoading, isError, error } = useGetOrdersQuery({ sort: '-createdAt', limit: 50 });
  const [cards, setCards] = useState([]);
  useEffect(() => {
    const list = (data?.orders || []).map(toCardShape);
    setCards(list);
  }, [data]);

  return (
    <div className={styles.ordersPage} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      {isLoading && <p>Loading orders…</p>}
      {isError && <p style={{ color: 'crimson' }}>{error?.data?.error || 'Failed to load orders'}</p>}
      {!isLoading && !isError && cards.length === 0 && <p>No orders yet.</p>}
      {!isLoading && !isError && cards.map((od) => (
        <OrderCard key={od.orderMongoId} orderDetails={od} />
      ))}
    </div>
  );
};

export default Orders;
