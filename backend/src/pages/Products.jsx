import React, { useMemo, useState, useEffect } from 'react';
import { ProductCard } from '../components';
import styles from './pagesStyles/products.module.css';
import { useGetFoodsQuery } from '../redux/foodApi';
import { useAdminSearch } from '../context/AdminSearchContext';

const Products = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const { query } = useAdminSearch();
  const hasQuery = !!query?.trim();

  useEffect(() => {
    setPage(1);
  }, [query]);

  const fetchPage = hasQuery ? 1 : page;
  const fetchLimit = hasQuery ? 1000 : limit;

  const queryArgs = useMemo(
    () => ({
      page: fetchPage,
      limit: fetchLimit,
      sort: '-createdAt',
    }),
    [fetchPage, fetchLimit]
  );

  const { data, isLoading, isFetching, isError, error } = useGetFoodsQuery(queryArgs);

  const allItems = data?.items || [];

  const filteredItems = useMemo(() => {
    if (!hasQuery) return allItems;
    const q = query.trim().toLowerCase();
    return allItems.filter((p) => {
      const fields = [
        p?.name,
        p?.description,
        p?.category,
        typeof p?.price === 'number' ? String(p.price) : p?.price,
        typeof p?.avgPrepTime === 'number' ? String(p.avgPrepTime) : p?.avgPrepTime,
      ];
      return fields.some((v) => (v ?? '').toString().toLowerCase().includes(q));
    });
  }, [allItems, hasQuery, query]);

  const usingClientPaging = hasQuery; 
  const effectiveItems = usingClientPaging ? filteredItems : allItems;

  const serverTotal =
    data?.total ??
    data?.totalCount ??
    data?.count ??
    undefined;

  const totalItems = usingClientPaging
    ? filteredItems.length
    : (typeof serverTotal === 'number' ? serverTotal : effectiveItems.length);

  const totalPages = usingClientPaging
    ? Math.max(1, Math.ceil(totalItems / limit))
    : (data?.totalPages ?? Math.max(1, Math.ceil(totalItems / limit)));

  const currentPage = Math.min(page, totalPages);

  const startIdx = (currentPage - 1) * limit;
  const pageItems = usingClientPaging
    ? effectiveItems.slice(startIdx, startIdx + limit)
    : effectiveItems; 

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className={styles.productsPage}>
      <div className={styles.headerBar}>
        <h1>Products</h1>

        <div className={styles.controls}>
          <label className={styles.pageSize}>
            Per page:
            <select
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setLimit(newLimit);
                setPage(1);
              }}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.stateBox}><p>Loading products…</p></div>
      ) : isError ? (
        <div className={styles.stateBox}>
          <p style={{ color: 'crimson' }}>{error?.data?.error || 'Failed to load products'}</p>
        </div>
      ) : (
        <>
          <section className={styles.cardContainer} aria-busy={isFetching}>
            {pageItems.length === 0 ? (
              <p>No products found.</p>
            ) : (
              pageItems.map((prod) => <ProductCard key={prod._id} product={prod} />)
            )}
          </section>

          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Pagination">
              <button
                className={styles.pagerBtn}
                disabled={!canPrev}
                onClick={goPrev}
              >
                ‹ Prev
              </button>

              <span className={styles.pageMeta}>
                Page {currentPage} of {totalPages} — {totalItems} items
              </span>

              <button
                className={styles.pagerBtn}
                disabled={!canNext}
                onClick={goNext}
              >
                Next ›
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
