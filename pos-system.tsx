import { useState, useEffect, useCallback } from "react";

// ─── Initial Data ────────────────────────────────────────────────────────────
const INITIAL_CATEGORIES = ["All", "Food", "Drinks", "Snacks", "Others"];

const INITIAL_PRODUCTS = [
  { id: 1, name: "Fried Rice", price: 55, category: "Food", emoji: "🍳" },
  { id: 2, name: "Adobo", price: 70, category: "Food", emoji: "🍖" },
  { id: 3, name: "Sinigang", price: 80, category: "Food", emoji: "🍲" },
  { id: 4, name: "Pancit", price: 60, category: "Food", emoji: "🍜" },
  { id: 5, name: "Tapsilog", price: 85, category: "Food", emoji: "🍳" },
  { id: 6, name: "Coke 355ml", price: 40, category: "Drinks", emoji: "🥤" },
  { id: 7, name: "Bottled Water", price: 20, category: "Drinks", emoji: "💧" },
  { id: 8, name: "Iced Tea", price: 35, category: "Drinks", emoji: "🧋" },
  { id: 9, name: "Juice", price: 30, category: "Drinks", emoji: "🥛" },
  { id: 10, name: "Chips", price: 25, category: "Snacks", emoji: "🍟" },
  { id: 11, name: "Bread", price: 15, category: "Snacks", emoji: "🍞" },
  { id: 12, name: "Cookies", price: 20, category: "Snacks", emoji: "🍪" },
  { id: 13, name: "Plastic Bag", price: 2, category: "Others", emoji: "🛍️" },
  { id: 14, name: "Tissue", price: 10, category: "Others", emoji: "🧻" },
];

// ─── Utilities ───────────────────────────────────────────────────────────────
const fmt = (n) => `₱${Number(n).toFixed(2)}`;
const now = () => new Date().toLocaleString("en-PH");
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ─── Main App ────────────────────────────────────────────────────────────────
export default function POSSystem() {
  const [view, setView] = useState("pos"); // pos | history | products | settings
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [cart, setCart] = useState([]);
  const [selectedCat, setSelectedCat] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [orders, setOrders] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [cashInput, setCashInput] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(null);
  const [showProductModal, setShowProductModal] = useState(null); // null | 'add' | product
  const [storeName, setStoreName] = useState("MyStore POS");
  const [taxRate, setTaxRate] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  // ─── Cart Logic ────────────────────────────────────────────────────────────
  const addToCart = (product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
        .filter((i) => i.qty > 0)
    );
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => { setCart([]); setDiscount(0); setCashInput(""); };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxAmt = subtotal * (taxRate / 100);
  const discountAmt = discount > 100 ? discount : subtotal * (discount / 100);
  const total = Math.max(0, subtotal + taxAmt - discountAmt);
  const cash = parseFloat(cashInput) || 0;
  const change = cash - total;

  // ─── Checkout ──────────────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (cart.length === 0) return showToast("Cart is empty!", "error");
    if (cash < total) return showToast("Cash is not enough!", "error");
    const order = {
      id: genId(),
      date: now(),
      items: [...cart],
      subtotal, taxAmt, discountAmt, total,
      cash, change,
    };
    setOrders((prev) => [order, ...prev]);
    setShowCheckout(false);
    setShowReceipt(order);
    clearCart();
  };

  // ─── Product Management ────────────────────────────────────────────────────
  const saveProduct = (prod) => {
    if (prod.id) {
      setProducts((p) => p.map((x) => x.id === prod.id ? prod : x));
      showToast("Product updated!");
    } else {
      setProducts((p) => [...p, { ...prod, id: Date.now() }]);
      showToast("Product added!");
    }
    setShowProductModal(null);
  };
  const deleteProduct = (id) => {
    setProducts((p) => p.filter((x) => x.id !== id));
    showToast("Product deleted!", "error");
  };

  // ─── Filtered Products ─────────────────────────────────────────────────────
  const filtered = products.filter((p) =>
    (selectedCat === "All" || p.category === selectedCat) &&
    p.name.toLowerCase().includes(searchQ.toLowerCase())
  );

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const todayOrders = orders.filter((o) => o.date.startsWith(new Date().toLocaleDateString("en-PH")));

  return (
    <div style={styles.root}>
      {/* ── Toast ── */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#ef4444" : "#22c55e" }}>
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🧾</span>
          <span style={styles.logoText}>{storeName}</span>
        </div>
        {[
          { id: "pos", icon: "🏪", label: "Cashier" },
          { id: "history", icon: "📋", label: "Orders" },
          { id: "products", icon: "📦", label: "Products" },
          { id: "settings", icon: "⚙️", label: "Settings" },
        ].map((nav) => (
          <button key={nav.id} onClick={() => setView(nav.id)}
            style={{ ...styles.navBtn, ...(view === nav.id ? styles.navActive : {}) }}>
            <span style={styles.navIcon}>{nav.icon}</span>
            <span>{nav.label}</span>
          </button>
        ))}
        <div style={styles.sidebarBottom}>
          <div style={styles.statsCard}>
            <div style={styles.statsLabel}>Today's Sales</div>
            <div style={styles.statsValue}>{fmt(todayOrders.reduce((s, o) => s + o.total, 0))}</div>
          </div>
          <div style={styles.statsCard}>
            <div style={styles.statsLabel}>Total Orders</div>
            <div style={styles.statsValue}>{orders.length}</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={styles.main}>
        {view === "pos" && (
          <POSView
            products={filtered} categories={categories} selectedCat={selectedCat}
            setSelectedCat={setSelectedCat} searchQ={searchQ} setSearchQ={setSearchQ}
            cart={cart} addToCart={addToCart} updateQty={updateQty} removeFromCart={removeFromCart}
            subtotal={subtotal} taxAmt={taxAmt} discountAmt={discountAmt} total={total}
            discount={discount} setDiscount={setDiscount}
            cashInput={cashInput} setCashInput={setCashInput}
            change={change} cash={cash}
            clearCart={clearCart}
            onCheckout={() => setShowCheckout(true)}
            taxRate={taxRate}
          />
        )}
        {view === "history" && <HistoryView orders={orders} />}
        {view === "products" && (
          <ProductsView products={products} categories={categories}
            onAdd={() => setShowProductModal({ id: null, name: "", price: "", category: "Food", emoji: "🍽️" })}
            onEdit={(p) => setShowProductModal(p)}
            onDelete={deleteProduct} />
        )}
        {view === "settings" && (
          <SettingsView storeName={storeName} setStoreName={setStoreName}
            taxRate={taxRate} setTaxRate={setTaxRate}
            categories={categories} setCategories={setCategories}
            showToast={showToast} />
        )}
      </main>

      {/* ── Checkout Modal ── */}
      {showCheckout && (
        <Modal onClose={() => setShowCheckout(false)}>
          <CheckoutModal cart={cart} subtotal={subtotal} taxAmt={taxAmt}
            discountAmt={discountAmt} total={total}
            cashInput={cashInput} setCashInput={setCashInput}
            change={change} cash={cash}
            onConfirm={handleCheckout}
            onCancel={() => setShowCheckout(false)} />
        </Modal>
      )}

      {/* ── Receipt Modal ── */}
      {showReceipt && (
        <Modal onClose={() => setShowReceipt(null)}>
          <ReceiptModal order={showReceipt} storeName={storeName}
            onClose={() => setShowReceipt(null)} />
        </Modal>
      )}

      {/* ── Product Modal ── */}
      {showProductModal && (
        <Modal onClose={() => setShowProductModal(null)}>
          <ProductModal product={showProductModal} categories={categories}
            onSave={saveProduct} onClose={() => setShowProductModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── POS View ────────────────────────────────────────────────────────────────
function POSView({ products, categories, selectedCat, setSelectedCat, searchQ, setSearchQ,
  cart, addToCart, updateQty, removeFromCart, subtotal, taxAmt, discountAmt, total,
  discount, setDiscount, cashInput, setCashInput, change, cash, clearCart, onCheckout, taxRate }) {
  return (
    <div style={styles.posLayout}>
      {/* Left: Product Grid */}
      <div style={styles.productPanel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Products</h2>
          <input style={styles.searchInput} placeholder="🔍 Search product..."
            value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
        </div>
        {/* Categories */}
        <div style={styles.catBar}>
          {categories.map((c) => (
            <button key={c} onClick={() => setSelectedCat(c)}
              style={{ ...styles.catBtn, ...(selectedCat === c ? styles.catActive : {}) }}>
              {c}
            </button>
          ))}
        </div>
        {/* Grid */}
        <div style={styles.productGrid}>
          {products.length === 0 && (
            <div style={styles.empty}>No products found</div>
          )}
          {products.map((p) => (
            <button key={p.id} style={styles.productCard} onClick={() => addToCart(p)}>
              <span style={styles.productEmoji}>{p.emoji}</span>
              <span style={styles.productName}>{p.name}</span>
              <span style={styles.productPrice}>{fmt(p.price)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div style={styles.cartPanel}>
        <div style={styles.cartHeader}>
          <h2 style={styles.panelTitle}>Current Order</h2>
          {cart.length > 0 && (
            <button style={styles.clearBtn} onClick={clearCart}>🗑 Clear</button>
          )}
        </div>
        <div style={styles.cartItems}>
          {cart.length === 0 && (
            <div style={styles.emptyCart}>
              <span style={{ fontSize: 48 }}>🛒</span>
              <p>Cart is empty</p>
              <p style={{ fontSize: 12, opacity: 0.5 }}>Tap a product to add</p>
            </div>
          )}
          {cart.map((item) => (
            <div key={item.id} style={styles.cartItem}>
              <span style={styles.cartEmoji}>{item.emoji}</span>
              <div style={styles.cartInfo}>
                <div style={styles.cartName}>{item.name}</div>
                <div style={styles.cartItemPrice}>{fmt(item.price)} × {item.qty} = <strong>{fmt(item.price * item.qty)}</strong></div>
              </div>
              <div style={styles.qtyControl}>
                <button style={styles.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                <span style={styles.qtyNum}>{item.qty}</span>
                <button style={styles.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
              </div>
              <button style={styles.removeBtn} onClick={() => removeFromCart(item.id)}>✕</button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={styles.cartSummary}>
          <div style={styles.summaryRow}>
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          {taxRate > 0 && (
            <div style={styles.summaryRow}>
              <span>Tax ({taxRate}%)</span><span>{fmt(taxAmt)}</span>
            </div>
          )}
          <div style={styles.summaryRow}>
            <span>Discount</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input style={styles.discountInput} type="number" min="0"
                placeholder="0" value={discount || ""}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
              <span style={{ fontSize: 11, opacity: 0.6 }}>%</span>
              {discountAmt > 0 && <span style={{ color: "#ef4444" }}>−{fmt(discountAmt)}</span>}
            </div>
          </div>
          <div style={styles.totalRow}>
            <span>TOTAL</span><span style={styles.totalAmt}>{fmt(total)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Cash</span>
            <input style={{ ...styles.discountInput, width: 110, fontSize: 15 }}
              type="number" placeholder="₱0.00" value={cashInput}
              onChange={(e) => setCashInput(e.target.value)} />
          </div>
          {cash > 0 && (
            <div style={{ ...styles.summaryRow, color: change >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
              <span>Change</span><span>{fmt(Math.max(0, change))}</span>
            </div>
          )}
          <button style={{ ...styles.checkoutBtn, opacity: cart.length === 0 ? 0.4 : 1 }}
            onClick={onCheckout} disabled={cart.length === 0}>
            💳 Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────
function HistoryView({ orders }) {
  const [selected, setSelected] = useState(null);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div style={styles.historyLayout}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Order History</h2>
        <div style={{ ...styles.badge, background: "#3b82f6" }}>
          Total Revenue: {fmt(totalRevenue)}
        </div>
      </div>
      <div style={styles.historyGrid}>
        <div style={styles.orderList}>
          {orders.length === 0 && <div style={styles.empty}>No orders yet</div>}
          {orders.map((o) => (
            <button key={o.id} onClick={() => setSelected(o)}
              style={{ ...styles.orderCard, ...(selected?.id === o.id ? styles.orderCardActive : {}) }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={styles.orderId}>#{o.id.slice(-6).toUpperCase()}</span>
                <span style={{ color: "#22c55e", fontWeight: 700 }}>{fmt(o.total)}</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{o.date}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{o.items.length} item(s)</div>
            </button>
          ))}
        </div>
        <div style={styles.orderDetail}>
          {!selected ? (
            <div style={styles.emptyCart}><span style={{ fontSize: 48 }}>📋</span><p>Select an order to view</p></div>
          ) : (
            <>
              <h3 style={{ marginBottom: 12, color: "#f8fafc" }}>Order #{selected.id.slice(-6).toUpperCase()}</h3>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 16 }}>{selected.date}</div>
              {selected.items.map((i) => (
                <div key={i.id} style={styles.detailItem}>
                  <span>{i.emoji} {i.name} × {i.qty}</span>
                  <span>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
              <hr style={{ borderColor: "#334155", margin: "12px 0" }} />
              <div style={styles.detailItem}><span>Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
              {selected.taxAmt > 0 && <div style={styles.detailItem}><span>Tax</span><span>{fmt(selected.taxAmt)}</span></div>}
              {selected.discountAmt > 0 && <div style={styles.detailItem}><span>Discount</span><span style={{ color: "#ef4444" }}>−{fmt(selected.discountAmt)}</span></div>}
              <div style={{ ...styles.detailItem, fontWeight: 700, fontSize: 18, color: "#22c55e" }}>
                <span>TOTAL</span><span>{fmt(selected.total)}</span>
              </div>
              <div style={styles.detailItem}><span>Cash</span><span>{fmt(selected.cash)}</span></div>
              <div style={styles.detailItem}><span>Change</span><span>{fmt(selected.change)}</span></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Products View ────────────────────────────────────────────────────────────
function ProductsView({ products, categories, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ padding: 24 }}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Product Management</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <input style={styles.searchInput} placeholder="🔍 Search..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <button style={styles.addBtn} onClick={onAdd}>+ Add Product</button>
        </div>
      </div>
      <div style={styles.productTable}>
        <div style={styles.tableHeader}>
          <span>Emoji</span><span>Name</span><span>Category</span><span>Price</span><span>Actions</span>
        </div>
        {filtered.map((p) => (
          <div key={p.id} style={styles.tableRow}>
            <span style={{ fontSize: 24 }}>{p.emoji}</span>
            <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{p.name}</span>
            <span><span style={styles.catTag}>{p.category}</span></span>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>{fmt(p.price)}</span>
            <span style={{ display: "flex", gap: 8 }}>
              <button style={styles.editBtn} onClick={() => onEdit(p)}>✏️ Edit</button>
              <button style={styles.delBtn} onClick={() => onDelete(p.id)}>🗑</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────
function SettingsView({ storeName, setStoreName, taxRate, setTaxRate, categories, setCategories, showToast }) {
  const [newCat, setNewCat] = useState("");
  const addCat = () => {
    if (!newCat.trim()) return;
    if (categories.includes(newCat.trim())) return showToast("Category already exists!", "error");
    setCategories((c) => [...c, newCat.trim()]);
    setNewCat("");
    showToast("Category added!");
  };
  const delCat = (c) => {
    if (c === "All") return showToast("Cannot delete 'All'!", "error");
    setCategories((prev) => prev.filter((x) => x !== c));
  };

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2 style={styles.panelTitle}>Settings</h2>
      <div style={styles.settingsCard}>
        <label style={styles.settingsLabel}>Store Name</label>
        <input style={styles.settingsInput} value={storeName}
          onChange={(e) => setStoreName(e.target.value)} />
      </div>
      <div style={styles.settingsCard}>
        <label style={styles.settingsLabel}>Tax Rate (%)</label>
        <input style={styles.settingsInput} type="number" min="0" max="30"
          value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} />
        <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>Set 0 to disable tax</div>
      </div>
      <div style={styles.settingsCard}>
        <label style={styles.settingsLabel}>Categories</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {categories.map((c) => (
            <span key={c} style={styles.catChip}>
              {c}
              {c !== "All" && (
                <button style={styles.catChipDel} onClick={() => delCat(c)}>✕</button>
              )}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...styles.settingsInput, flex: 1 }} placeholder="New category name"
            value={newCat} onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCat()} />
          <button style={styles.addBtn} onClick={addCat}>Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function CheckoutModal({ cart, subtotal, taxAmt, discountAmt, total, cashInput, setCashInput, change, cash, onConfirm, onCancel }) {
  const quickCash = [total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500];
  const uniq = [...new Set(quickCash)].slice(0, 4);
  return (
    <div>
      <h2 style={{ color: "#f8fafc", marginBottom: 16 }}>💳 Checkout</h2>
      <div style={{ marginBottom: 12 }}>
        {cart.map((i) => (
          <div key={i.id} style={styles.detailItem}>
            <span>{i.emoji} {i.name} × {i.qty}</span><span>{fmt(i.price * i.qty)}</span>
          </div>
        ))}
      </div>
      <hr style={{ borderColor: "#334155", margin: "12px 0" }} />
      <div style={styles.detailItem}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
      {taxAmt > 0 && <div style={styles.detailItem}><span>Tax</span><span>{fmt(taxAmt)}</span></div>}
      {discountAmt > 0 && <div style={styles.detailItem}><span>Discount</span><span style={{ color: "#ef4444" }}>−{fmt(discountAmt)}</span></div>}
      <div style={{ ...styles.detailItem, fontSize: 22, fontWeight: 800, color: "#22c55e", margin: "12px 0" }}>
        <span>TOTAL</span><span>{fmt(total)}</span>
      </div>
      <label style={styles.settingsLabel}>Cash Received</label>
      <input style={{ ...styles.settingsInput, fontSize: 20, marginBottom: 8 }} type="number"
        placeholder="₱0.00" value={cashInput} onChange={(e) => setCashInput(e.target.value)} autoFocus />
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {uniq.map((v) => (
          <button key={v} style={styles.quickCashBtn} onClick={() => setCashInput(String(v))}>
            {fmt(v)}
          </button>
        ))}
      </div>
      {cash > 0 && (
        <div style={{ ...styles.detailItem, fontWeight: 700, color: change >= 0 ? "#22c55e" : "#ef4444", marginBottom: 16 }}>
          <span>Change</span><span>{fmt(Math.max(0, change))}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button style={{ ...styles.checkoutBtn, flex: 1, background: "#334155" }} onClick={onCancel}>Cancel</button>
        <button style={{ ...styles.checkoutBtn, flex: 2, opacity: cash < total ? 0.4 : 1 }}
          onClick={onConfirm} disabled={cash < total}>
          ✅ Confirm Payment
        </button>
      </div>
    </div>
  );
}

function ReceiptModal({ order, storeName, onClose }) {
  return (
    <div style={{ textAlign: "center", fontFamily: "monospace" }}>
      <div style={{ fontSize: 32, marginBottom: 4 }}>🧾</div>
      <h3 style={{ color: "#f8fafc", marginBottom: 2 }}>{storeName}</h3>
      <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 16 }}>{order.date}</div>
      <hr style={{ borderColor: "#334155", marginBottom: 12 }} />
      {order.items.map((i) => (
        <div key={i.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#cbd5e1" }}>
          <span>{i.emoji} {i.name} ×{i.qty}</span><span>{fmt(i.price * i.qty)}</span>
        </div>
      ))}
      <hr style={{ borderColor: "#334155", margin: "12px 0" }} />
      {order.taxAmt > 0 && <div style={styles.detailItem}><span>Tax</span><span>{fmt(order.taxAmt)}</span></div>}
      {order.discountAmt > 0 && <div style={styles.detailItem}><span>Discount</span><span style={{ color: "#ef4444" }}>−{fmt(order.discountAmt)}</span></div>}
      <div style={{ ...styles.detailItem, fontWeight: 800, fontSize: 20, color: "#22c55e" }}>
        <span>TOTAL</span><span>{fmt(order.total)}</span>
      </div>
      <div style={styles.detailItem}><span>Cash</span><span>{fmt(order.cash)}</span></div>
      <div style={{ ...styles.detailItem, color: "#38bdf8" }}><span>Change</span><span>{fmt(order.change)}</span></div>
      <hr style={{ borderColor: "#334155", margin: "16px 0" }} />
      <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 16 }}>Thank you! Come again 😊</div>
      <button style={styles.checkoutBtn} onClick={onClose}>Close Receipt</button>
    </div>
  );
}

function ProductModal({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState({ ...product });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const EMOJIS = ["🍳","🍖","🍲","🍜","🥩","🍚","🍱","🌮","🍕","🥤","💧","🧋","🥛","🍟","🍞","🍪","🛍️","🧻","🍽️","🧃","🫙","🥡","🍣","🍛","🥗","🍔","🌯","🧆"];
  const valid = form.name.trim() && parseFloat(form.price) > 0;
  return (
    <div>
      <h2 style={{ color: "#f8fafc", marginBottom: 16 }}>{form.id ? "Edit" : "Add"} Product</h2>
      <label style={styles.settingsLabel}>Emoji</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {EMOJIS.map((e) => (
          <button key={e} onClick={() => set("emoji", e)}
            style={{ ...styles.emojiBtn, ...(form.emoji === e ? styles.emojiBtnActive : {}) }}>
            {e}
          </button>
        ))}
      </div>
      <label style={styles.settingsLabel}>Product Name</label>
      <input style={{ ...styles.settingsInput, marginBottom: 10 }} value={form.name}
        onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sinangag" />
      <label style={styles.settingsLabel}>Price (₱)</label>
      <input style={{ ...styles.settingsInput, marginBottom: 10 }} type="number" min="0"
        value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
      <label style={styles.settingsLabel}>Category</label>
      <select style={{ ...styles.settingsInput, marginBottom: 16 }} value={form.category}
        onChange={(e) => set("category", e.target.value)}>
        {categories.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
      </select>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={{ ...styles.checkoutBtn, flex: 1, background: "#334155" }} onClick={onClose}>Cancel</button>
        <button style={{ ...styles.checkoutBtn, flex: 2, opacity: valid ? 1 : 0.4 }}
          disabled={!valid} onClick={() => onSave({ ...form, price: parseFloat(form.price) })}>
          {form.id ? "💾 Save Changes" : "➕ Add Product"}
        </button>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: { display: "flex", height: "100vh", background: "#0f172a", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#94a3b8", overflow: "hidden" },
  sidebar: { width: 220, background: "#1e293b", display: "flex", flexDirection: "column", padding: "20px 12px", gap: 4, borderRight: "1px solid #334155", flexShrink: 0 },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "0 8px" },
  logoIcon: { fontSize: 28 },
  logoText: { fontWeight: 800, fontSize: 15, color: "#f1f5f9", lineHeight: 1.2 },
  navBtn: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: "none", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all .15s", textAlign: "left" },
  navActive: { background: "#3b82f6", color: "#fff" },
  navIcon: { fontSize: 18 },
  sidebarBottom: { marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 },
  statsCard: { background: "#0f172a", borderRadius: 10, padding: "10px 14px" },
  statsLabel: { fontSize: 11, opacity: 0.5, marginBottom: 2 },
  statsValue: { fontSize: 18, fontWeight: 800, color: "#38bdf8" },
  main: { flex: 1, overflow: "auto", background: "#0f172a" },
  posLayout: { display: "flex", height: "100%", gap: 0 },
  productPanel: { flex: 1, display: "flex", flexDirection: "column", padding: 20, overflow: "hidden" },
  cartPanel: { width: 360, background: "#1e293b", display: "flex", flexDirection: "column", borderLeft: "1px solid #334155", flexShrink: 0 },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 },
  panelTitle: { fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 },
  searchInput: { padding: "8px 14px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#f1f5f9", fontSize: 13, outline: "none", width: 200 },
  catBar: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  catBtn: { padding: "6px 14px", borderRadius: 20, border: "1px solid #334155", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  catActive: { background: "#3b82f6", color: "#fff", borderColor: "#3b82f6" },
  productGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 12, overflowY: "auto", flex: 1, paddingRight: 4 },
  productCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: "16px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all .15s", color: "inherit" },
  productEmoji: { fontSize: 32 },
  productName: { fontSize: 13, fontWeight: 700, color: "#f1f5f9", textAlign: "center" },
  productPrice: { fontSize: 14, color: "#22c55e", fontWeight: 800 },
  cartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 8px", borderBottom: "1px solid #334155" },
  clearBtn: { background: "#ef444420", color: "#ef4444", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 },
  cartItems: { flex: 1, overflowY: "auto", padding: "12px 20px" },
  emptyCart: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, opacity: 0.3 },
  cartItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #334155" },
  cartEmoji: { fontSize: 22, flexShrink: 0 },
  cartInfo: { flex: 1, minWidth: 0 },
  cartName: { fontSize: 13, fontWeight: 700, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cartItemPrice: { fontSize: 12, opacity: 0.7 },
  qtyControl: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  qtyBtn: { width: 26, height: 26, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" },
  qtyNum: { minWidth: 20, textAlign: "center", fontWeight: 800, color: "#f1f5f9", fontSize: 14 },
  removeBtn: { background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, padding: 4 },
  cartSummary: { padding: "16px 20px", borderTop: "1px solid #334155", display: "flex", flexDirection: "column", gap: 10 },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, fontWeight: 800, color: "#f1f5f9", padding: "8px 0", borderTop: "1px solid #334155", borderBottom: "1px solid #334155" },
  totalAmt: { color: "#22c55e" },
  discountInput: { width: 70, padding: "4px 8px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: 13, textAlign: "right", outline: "none" },
  checkoutBtn: { width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" },
  // History
  historyLayout: { padding: 24, display: "flex", flexDirection: "column", height: "100%" },
  historyGrid: { display: "flex", gap: 20, flex: 1, overflow: "hidden" },
  orderList: { width: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 },
  orderCard: { background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "12px 14px", cursor: "pointer", textAlign: "left", color: "#94a3b8" },
  orderCardActive: { borderColor: "#3b82f6", background: "#1e40af20" },
  orderId: { fontWeight: 800, color: "#f1f5f9" },
  orderDetail: { flex: 1, background: "#1e293b", borderRadius: 14, padding: 20, overflowY: "auto" },
  detailItem: { display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#cbd5e1" },
  badge: { padding: "6px 14px", borderRadius: 20, color: "#fff", fontWeight: 700, fontSize: 13 },
  empty: { opacity: 0.4, padding: 20 },
  // Products table
  productTable: { background: "#1e293b", borderRadius: 14, overflow: "hidden" },
  tableHeader: { display: "grid", gridTemplateColumns: "60px 1fr 130px 110px 160px", padding: "12px 16px", background: "#0f172a", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", gap: 12 },
  tableRow: { display: "grid", gridTemplateColumns: "60px 1fr 130px 110px 160px", padding: "12px 16px", borderBottom: "1px solid #334155", alignItems: "center", gap: 12, fontSize: 14 },
  catTag: { background: "#1e40af", color: "#93c5fd", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 },
  addBtn: { padding: "8px 18px", borderRadius: 10, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" },
  editBtn: { padding: "5px 10px", borderRadius: 8, border: "none", background: "#1e40af", color: "#93c5fd", cursor: "pointer", fontSize: 12, fontWeight: 700 },
  delBtn: { padding: "5px 10px", borderRadius: 8, border: "none", background: "#ef444420", color: "#ef4444", cursor: "pointer", fontSize: 14 },
  // Settings
  settingsCard: { background: "#1e293b", borderRadius: 14, padding: 20, marginBottom: 16 },
  settingsLabel: { display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 },
  settingsInput: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: 15, outline: "none", boxSizing: "border-box" },
  catChip: { background: "#1e40af", color: "#93c5fd", borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 },
  catChipDel: { background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 },
  // Modal
  overlay: { position: "fixed", inset: 0, background: "#00000090", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { background: "#1e293b", borderRadius: 18, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", border: "1px solid #334155" },
  // Toast
  toast: { position: "fixed", top: 20, right: 20, zIndex: 200, padding: "12px 20px", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: "0 8px 32px #00000060" },
  quickCashBtn: { flex: 1, padding: "8px 4px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#38bdf8", cursor: "pointer", fontWeight: 700, fontSize: 13 },
  emojiBtn: { width: 38, height: 38, borderRadius: 8, border: "2px solid transparent", background: "#0f172a", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" },
  emojiBtnActive: { borderColor: "#3b82f6", background: "#1e40af30" },
};
