import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryCard, ProductCard, EnterDetails } from "../components";
import { burger_icon, drinks, fries, salads, sandwiches, desserts } from "../assets";
import styles from "./pagesStyles/home.module.css";
import { useGetFoodsQuery } from "../redux/productApi";
import { useCart } from "../context/CartContext";
import { useSearch } from "../context/SearchContext";
import toast from "react-hot-toast";

const Home = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { search } = useSearch();

  const categories = [
    { image: burger_icon, label: "burger" },
    { image: drinks, label: "drinks" },
    { image: fries, label: "fries" },
    { image: salads, label: "salads" },
    { image: sandwiches, label: "sandwiches" },
    { image: desserts, label: "desserts" },
  ];

  const [isVisible, setIsVisible] = useState(true);
  const [activeCategory, setActiveCategory] = useState("burger");
  const apiCategory = activeCategory;

  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isFetching, isError, error } = useGetFoodsQuery({
    category: apiCategory,
    inStock: "true",
    q: search,
    limit,
    sort: "-createdAt",
    page,
  });

  const [items, setItems] = useState([]);
  const serverPage = data?.page ?? 1;
  const totalPages = data?.pages ?? 1;
  const hasMore = serverPage < totalPages;

  useEffect(() => {
    setItems([]);
    setPage(1);
  }, [apiCategory, search]);

  useEffect(() => {
    const list = data?.items || [];
    if (page === 1) {
      setItems(list);
    } else if (list.length) {
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        const merged = [...prev];
        for (const it of list) if (!seen.has(it._id)) merged.push(it);
        return merged;
      });
    }
  }, [data, page]);

  const heading = useMemo(() => {
    if (search) return `Results for "${search}"`;
    return activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
  }, [activeCategory, search]);

  const onSelectCategory = (c) => setActiveCategory(c?.label || c);
  const toOrderPage = () => navigate("/order");
  const handleVisibility = () => setIsVisible(false);

  const handleAddItem = (item) => {
    try {
      const added = addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        avgPrepTime: item.avgPrepTime,
      });
      if (added === false) toast.error("Failed to add item. Please try again.");
      else toast.success(`${item.name} added to cart!`);
    } catch {
      toast.error("Could not add item to cart.");
    }
  };

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const timerRef = useRef(null);
  const pendingRef = useRef(false);
  const delayMs = 500;

  useEffect(() => {
    pendingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [apiCategory, search, page]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first.isIntersecting) return;
        if (isFetching || isLoading || isError) return;
        if (!hasMore) return;
        if (pendingRef.current) return;
        pendingRef.current = true;
        timerRef.current = setTimeout(() => {
          setPage((p) => p + 1);
          pendingRef.current = false;
        }, delayMs);
      },
      { root: null, rootMargin: "300px", threshold: 0 }
    );

    observerRef.current.observe(sentinelRef.current);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pendingRef.current = false;
    };
  }, [hasMore, isFetching, isLoading, isError, serverPage]);

  return (
    <div className={styles.homePage}>
      <section className={styles.categorySection}>
        <CategoryCard data={categories} onSelect={onSelectCategory} active={activeCategory} />
      </section>

      <section className={styles.productContainer}>
        <h1>{heading}</h1>

        {isError && <p style={{ color: "crimson" }}>{error?.data?.error || "Error loading foods"}</p>}

        {!isLoading && !isError && items.length === 0 && <p>No products found.</p>}

        {items.length > 0 && (
          <>
            <ProductCard
              products={items.map((f) => ({
                id: f._id,
                image: f.itemImage,
                name: f.name,
                price: f.price,
                desc: f.description,
                avgPrepTime: f.avgPrepTime,
                rating: f.rating,
                stock: f.stock,
              }))}
              onAdd={handleAddItem}
            />

            <div ref={sentinelRef} style={{ height: 1 }} />

            {isFetching && (
              <p style={{ textAlign: "center", padding: "0.75rem 0" }}>Loading more...</p>
            )}
          </>
        )}
      </section>

      <button onClick={toOrderPage} className={styles.nextButton}>
        Next
      </button>

      {isVisible && (
        <div className={styles.enterDetailsWrapper}>
          <EnterDetails onClose={handleVisibility} />
        </div>
      )}
    </div>
  );
};

export default Home;
