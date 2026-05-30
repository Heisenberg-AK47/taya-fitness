/* ============================================================
   CART.JS — Panier en localStorage
   Chaque item : { id, titre, prix, image_url, qty }
   ============================================================ */

const CART_KEY = 'taya_cart';

/* ── Lire le panier ─────────────────────────────────────── */
export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) ?? [];
  } catch {
    return [];
  }
}

/* ── Sauvegarder le panier ──────────────────────────────── */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
}

/* ── Nombre d'articles ──────────────────────────────────── */
export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

/* ── Total ───────────────────────────────────────────────── */
export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.prix * item.qty, 0);
}

/* ── Ajouter un article ─────────────────────────────────── */
export function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  saveCart(cart);
  return cart;
}

/* ── Retirer un article ─────────────────────────────────── */
export function removeFromCart(itemId) {
  const cart = getCart().filter(i => i.id !== itemId);
  saveCart(cart);
  return cart;
}

/* ── Modifier la quantité ───────────────────────────────── */
export function updateQty(itemId, qty) {
  if (qty < 1) return removeFromCart(itemId);
  const cart = getCart();
  const item = cart.find(i => i.id === itemId);
  if (item) item.qty = qty;
  saveCart(cart);
  return cart;
}

/* ── Vider le panier ────────────────────────────────────── */
export function clearCart() {
  saveCart([]);
}

/* ── Vérifier si un programme est dans le panier ───────── */
export function isInCart(itemId) {
  return getCart().some(i => i.id === itemId);
}
