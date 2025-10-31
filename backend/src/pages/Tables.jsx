import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TablesCard } from '../components';
import styles from './pagesStyles/tables.module.css';
import {
  useGetTablesQuery,
  useCreateTablesMutation,
  useDeleteTableMutation,
} from '../redux/tablesApi';

const MAX_TABLES = 31;

const smallestAvailable = (numsSet, cap = MAX_TABLES) => {
  for (let i = 1; i <= cap; i++) {
    if (!numsSet.has(i)) return i;
  }
  return numsSet.size + 1;
};

const Tables = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [addName, setAddName] = useState(false);
  const [nameInput, setNameInput] = useState('Table');
  const [chairs, setChairs] = useState('2');
  const formRef = useRef(null);

  const options = [
    { value: '2', label: '02' },
    { value: '4', label: '04' },
    { value: '6', label: '06' },
    { value: '8', label: '08' },
  ];

  const { data, isLoading, isError, error, refetch } = useGetTablesQuery({
    sort: 'tableNum',
    dir: 'asc',
    limit: 200,
  });

  const [createTables, { isLoading: creating }] = useCreateTablesMutation();
  const [deleteTable] = useDeleteTableMutation();

  const items = useMemo(() => data?.items ?? [], [data]);
  const existingNums = useMemo(() => new Set(items.map((t) => Number(t.tableNum))), [items]);

  const nextTableNum = useMemo(() => smallestAvailable(existingNums, MAX_TABLES), [existingNums]);

  const twoDigit = (n) => n.toString().padStart(2, '0');

  const toggleForm = () => setIsVisible((v) => !v);
  const handleNameInput = () => setAddName((v) => !v);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    };
    if (isVisible) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible]);

  const handleCreate = async () => {
    if (items.length >= MAX_TABLES) {
      alert(`You can create up to ${MAX_TABLES} tables.`);
      return;
    }
    const payload = {
      tableNum: nextTableNum,
      chairs: Number(chairs),
    };
    if (addName && nameInput.trim()) {
      payload.tableName = nameInput.trim();
    }

    const res = await createTables(payload);
    if ('error' in res) {
      const msg = res.error?.data?.error || 'Failed to create table';
      alert(msg);
      return;
    }

    setNameInput('');
    setChairs('2');
    setAddName(false);
    setIsVisible(false);
    refetch();
  };

  const handleDelete = async (id) => {
    const res = await deleteTable(id);
    if ('error' in res) {
      const code = res.error?.status;
      const msg = res.error?.data?.error || 'Failed to delete';
      if (code === 409) {
        alert('This table is assigned and cannot be deleted right now.');
      } else {
        alert(msg);
      }
    }
  };

  const canAddMore = items.length < MAX_TABLES;

  return (
    <div className={styles.tablesPage}>
      <h1 className={styles.heading}>Tables</h1>

      {isLoading && <p>Loading tables…</p>}
      {isError && <p style={{ color: 'crimson' }}>{error?.data?.error || 'Failed to load tables'}</p>}

      <div className={styles.tablesContainer}>
        {items.map((t) => (
          <TablesCard key={t._id} table={t} onDelete={handleDelete} />
        ))}

        <div className={styles.addTableContainer}>
          <div>
            <button
              onClick={() => (canAddMore ? toggleForm() : alert(`You can create up to ${MAX_TABLES} tables.`))}
              type="button"
              className={styles.addTableBtn}
              title={canAddMore ? 'Create a new table' : 'Table limit reached'}
              disabled={!canAddMore}
              style={{ opacity: canAddMore ? 1 : 0.5, cursor: canAddMore ? 'pointer' : 'not-allowed' }}
            >
              +
            </button>
          </div>

          {isVisible && canAddMore && (
            <form
              ref={formRef}
              className={styles.createTableForm}
              onSubmit={(e) => e.preventDefault()}
            >
              {!addName ? (
                <p onClick={handleNameInput} style={{ cursor: 'pointer' }}>
                  Table name (optional)
                </p>
              ) : (
                <input
                  type="text"
                  placeholder="table name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              )}

              <p className={styles.tableNo}>{twoDigit(nextTableNum)}</p>

              <div className={styles.chairNo}>
                <label htmlFor="chairs">Chair</label>
                <select
                  name="chairs"
                  id="chairs"
                  value={chairs}
                  onChange={(e) => setChairs(e.target.value)}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className={styles.createBtn}
                type="button"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </form>
          )}
        </div>
      </div>

      {data?.pages > 1 && (
        <div className={styles.paginationInfo}>
          Page {data.page} of {data.pages} — {data.total} tables
        </div>
      )}
    </div>
  );
};

export default Tables;
