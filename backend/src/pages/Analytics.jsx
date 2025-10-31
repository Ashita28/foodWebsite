import React from 'react';
import { DetailsCard, RevenueCard, SummaryCard, TableAssign } from '../components';
import styles from './pagesStyles/analytics.module.css';
import ChefOrderTable from '../components/ChefOrderTable';
import { useAdminSearch } from '../context/AdminSearchContext';
import { useGetOrdersQuery } from '../redux/orderApi';

const normalize = (s = '') => s.toLowerCase().replace(/\s+/g, '');

const Analytics = () => {
  useGetOrdersQuery(
    { sort: '-createdAt', limit: 500 },
    { pollingInterval: 3000, refetchOnFocus: true, refetchOnReconnect: true }
  );

  const { query } = useAdminSearch();
  const nq = normalize(query);

  const shouldShow = (labelText) => {
    if (!nq) return true;
    return normalize(labelText).includes(nq);
  };

  const LABELS = {
    summary: 'Order Summary',
    revenue: 'Revenue',
    table: 'Table Assign',
  };

  return (
    <div className={styles.analyticsPage}>
      <header className={styles.heading}>
        <h1>Analytics</h1>
      </header>

      <DetailsCard />

      <section className={styles.cards}>
        <div className={`${styles.sectionWrapper} ${shouldShow(LABELS.summary) ? '' : styles.blurred}`}>
          <SummaryCard />
        </div>

        <div className={`${styles.sectionWrapper} ${shouldShow(LABELS.revenue) ? '' : styles.blurred}`}>
          <RevenueCard />
        </div>

        <div className={`${styles.sectionWrapper} ${shouldShow(LABELS.table) ? '' : styles.blurred}`}>
          <TableAssign />
        </div>
      </section>

      <ChefOrderTable />
    </div>
  );
};

export default Analytics;
