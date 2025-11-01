import React, { useEffect, useRef, useState } from "react";
import OrderCard from "../components/OrderCard";
import { location_icon, timer_icon, fwd_icon } from "../assets";
import styles from "./pagesStyles/order.module.css";
import AddInstructions from "../components/AddInstructions";
import { useCart } from "../context/CartContext";
import { useCreateOrderMutation, getUserId } from "../redux/orderApi";
import { useGetUserQuery } from "../redux/userApi";
import { useNavigate } from "react-router-dom";

const Order = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [orderType, setOrderType] = useState(null);

  const { cart, inc, dec, removeItem, totals, clear } = useCart();
  const { itemTotal, taxes } = totals;

  const [createOrder, { isLoading: placing }] = useCreateOrderMutation();
  const navigate = useNavigate();

  const userId = getUserId();
  const { data: userData, isLoading: loadingUser, isError: userErr } =
    useGetUserQuery(userId, { skip: !userId });

  const user = userData || {};
  const fullName = user.name || "Guest User";
  const phone = user.contact || "Not provided";
  const address =
    user.address ||
    "No address available. Please update your profile or select delivery info.";

  const trackRef = useRef(null);
  const knobRef = useRef(null);
  const textRef = useRef(null);
  const startXRef = useRef(0);
  const startLeftRef = useRef(0);
  const maxXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const placedRef = useRef(false);

  useEffect(() => {
    if (showInstructions) document.body.classList.add("noScroll");
    else document.body.classList.remove("noScroll");
    return () => document.body.classList.remove("noScroll");
  }, [showInstructions]);

  const handlePlaceOrder = async () => {
    if (!cart.items.length || placing || placedRef.current) return;
    if (!orderType) return;
    const user = getUserId();
    if (!user) return;

    const payload = {
      user,
      items: cart.items.map((it) => ({
        food: it.id,
        name: it.name,
        price: it.price,
        qnt: it.qty,
      })),
      orderType,
      note: instructions,
      tax: Number(taxes || 0),
      grandTotal: Number(itemTotal + taxes),
    };

    try {
      placedRef.current = true;
      const resp = await createOrder(payload).unwrap();
      clear();
      setOrderType(null);
      setInstructions("");
      navigate("/status", {
        state: { success: true, orderId: resp?.order?._id },
      });
    } catch (e) {
      placedRef.current = false;
      clear();
      setOrderType(null);
      setInstructions("");
      navigate("/status", {
        state: {
          success: false,
          message: e?.data?.error || "Failed to place your order. Please try again.",
        },
      });
    }
  };

  useEffect(() => {
    const track = trackRef.current;
    const knob = knobRef.current;
    if (!track || !knob) return;

    const trackRect = () => track.getBoundingClientRect();
    const knobRect = () => knob.getBoundingClientRect();
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - startXRef.current;
      const next = clamp(startLeftRef.current + dx, 0, maxXRef.current);
      knob.style.transform = `translateX(${next}px)`;
      if (textRef.current) {
        const ratio = next / maxXRef.current || 0;
        textRef.current.style.opacity = String(1 - Math.min(1, ratio * 1.2));
      }
      if (next >= maxXRef.current) {
        isDraggingRef.current = false;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        handlePlaceOrder();
      }
    };

    const onPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      knob.style.transition = "transform 0.25s ease";
      knob.style.transform = "translateX(0px)";
      if (textRef.current) {
        textRef.current.style.transition = "opacity 0.25s ease";
        textRef.current.style.opacity = "1";
      }
      const tid = setTimeout(() => {
        knob.style.transition = "";
        if (textRef.current) textRef.current.style.transition = "";
      }, 260);
      return () => clearTimeout(tid);
    };

    const onPointerDown = (e) => {
      const swipeDisabled =
        placing || placedRef.current || !orderType || cart.items.length === 0;
      if (swipeDisabled) return;
      const tr = trackRect();
      const kr = knobRect();
      maxXRef.current = Math.max(0, tr.width - kr.width - 8);
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      const m = (knob.style.transform || "").match(/translateX\(([-0-9.]+)px\)/);
      startLeftRef.current = m ? parseFloat(m[1]) : 0;
      knob.setPointerCapture?.(e.pointerId);
      document.addEventListener("pointermove", onPointerMove, { passive: false });
      document.addEventListener("pointerup", onPointerUp, { passive: true });
    };

    knob.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      knob.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [placing, cart.items.length, orderType]);

  const isSwipeDisabled = placing || cart.items.length === 0 || !orderType;
  const displayGrandTotal = itemTotal + taxes;

  return (
    <div className={styles.orderPage}>
      <section className={styles.orderCardContainer}>
        {cart.items.length === 0 ? (
          <p>No items yet. Add from the menu.</p>
        ) : (
          cart.items.map((it) => (
            <OrderCard
              key={it.id}
              id={it.id}
              name={it.name}
              price={it.price}
              image={it.image}
              qty={it.qty}
              onInc={inc}
              onDec={dec}
              onRemove={removeItem}
            />
          ))
        )}
      </section>

      <button
        type="button"
        className={styles.addNote}
        onClick={() => setShowInstructions(true)}
        aria-haspopup="dialog"
        aria-controls="add-instructions-sheet"
      >
        Add cooking instructions (optional)
      </button>

      <section className={styles.orderType}>
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${orderType === "dine-in" ? styles.active : ""}`}
            onClick={() => setOrderType("dine-in")}
            type="button"
            aria-pressed={orderType === "dine-in"}
          >
            Dine In
          </button>
          <button
            className={`${styles.toggleBtn} ${orderType === "takeaway" ? styles.active : ""}`}
            onClick={() => setOrderType("takeaway")}
            type="button"
            aria-pressed={orderType === "takeaway"}
          >
            Take Away
          </button>
        </div>
      </section>

      <section className={styles.billContainer}>
        <div>
          <div className={styles.billRow}>
            <p>Item Total</p>
            <p>₹{itemTotal.toFixed(2)}</p>
          </div>
          <div className={styles.billRow}>
            <p>Taxes</p>
            <p>₹{taxes.toFixed(2)}</p>
          </div>
        </div>

        <div className={styles.billTotal}>
          <p>Grand Total</p>
          <p>₹{displayGrandTotal.toFixed(2)}</p>
        </div>
      </section>

      <section className={styles.userDetails}>
        <p className={styles.detailsTitle}>Your details</p>
        {loadingUser ? (
          <p>Loading user...</p>
        ) : userErr ? (
          <p style={{ color: "crimson" }}>Failed to load user</p>
        ) : (
          <p className={styles.person}>{fullName}, {phone}</p>
        )}
      </section>

      <section className={styles.addressContainer}>
        <div className={styles.address}>
          {orderType === "takeaway" && (
            <div>
              <div className={styles.addrRow}>
                <img src={location_icon} alt="location icon" />
                <p>Delivery at {address}</p>
              </div>
              <div className={styles.addrRow}>
                <img src={timer_icon} alt="timer icon" />
                <p>Delivery in <strong>42 mins</strong></p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className={styles.swipeToOrder}>
        <button
          ref={trackRef}
          type="button"
          className={styles.swipeBtn}
          disabled={isSwipeDisabled}
          aria-busy={placing}
          title={
            cart.items.length === 0
              ? "Add items to place order"
              : placing
              ? "Placing..."
              : !orderType
              ? "Select order type"
              : "Swipe to Order"
          }
        >
          <div ref={knobRef} className={styles.swipeIcon}>
            <img src={fwd_icon} alt="fwd arrow" />
          </div>
          <span ref={textRef} className={styles.swipeText}>
            {placing ? "Placing..." : !orderType ? "Select order type" : "Swipe to Order"}
          </span>
        </button>
      </section>

      {showInstructions && (
        <AddInstructions
          id="add-instructions-sheet"
          initialValue={instructions}
          onClose={() => setShowInstructions(false)}
          onCancel={() => setShowInstructions(false)}
          onSubmit={(text) => {
            setInstructions(text);
            setShowInstructions(false);
          }}
        />
      )}
    </div>
  );
};

export default Order;
