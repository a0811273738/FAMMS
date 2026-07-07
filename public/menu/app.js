// 顧客點餐頁面 — vanilla JS

// ===== i18n（自足式，不依賴 src/i18n）=====
const EN = {
  '線上點餐': 'Online Ordering',
  '線上點餐系統': 'Online Ordering System',
  '載入中...': 'Loading...',
  '無法連線': 'Connection failed',
  '無法載入菜單，請確認網路連線': 'Could not load the menu. Please check your connection.',
  '搜尋商品...': 'Search items...',
  '全部': 'All',
  '售完': 'Sold out',
  '加入購物車': 'Add to cart',
  '最後 {n} {u}！': 'Only {n} {u} left!',
  '剩 {n} {u}': '{n} {u} left',
  '個': 'pc',
  '沒有符合的商品': 'No matching items',
  '購物車': 'Cart',
  '購物車是空的': 'Your cart is empty',
  '合計': 'Total',
  '送出訂單': 'Place Order',
  '確認訂單': 'Confirm Order',
  '您的姓名（選填）': 'Your name (optional)',
  '方便取餐時叫號': 'So we can call you at pickup',
  '桌號 / 備註（選填）': 'Table number (optional)',
  '例如: 3號桌': 'e.g. Table 3',
  '備註': 'Notes',
  '特殊需求...': 'Special requests...',
  '取消': 'Cancel',
  '確認送出': 'Confirm',
  '送出中...': 'Sending...',
  '訂單送出失敗': 'Failed to place order',
  '無法連線到伺服器': 'Could not reach the server',
  '訂單已送出!': 'Order placed!',
  '訂單編號: ': 'Order no.: ',
  '等待店家確認中...': 'Waiting for the store to confirm...',
  '店家已接單，準備中！': 'Order accepted, preparing!',
  '已完成，請取餐！': 'Ready, please pick up!',
  '很抱歉，訂單已被取消': 'Sorry, your order was cancelled',
  '繼續點餐': 'Order more',
}
const ID = {
  '線上點餐': 'Pesan Online',
  '線上點餐系統': 'Sistem Pemesanan Online',
  '載入中...': 'Memuat...',
  '無法連線': 'Tidak dapat terhubung',
  '無法載入菜單，請確認網路連線': 'Menu gagal dimuat. Periksa koneksi internet Anda.',
  '搜尋商品...': 'Cari menu...',
  '全部': 'Semua',
  '售完': 'Habis',
  '加入購物車': 'Tambah ke Keranjang',
  '最後 {n} {u}！': 'Sisa {n} {u} lagi!',
  '剩 {n} {u}': 'Sisa {n} {u}',
  '個': 'pcs',
  '沒有符合的商品': 'Tidak ada menu yang cocok',
  '購物車': 'Keranjang',
  '購物車是空的': 'Keranjang masih kosong',
  '合計': 'Total',
  '送出訂單': 'Kirim Pesanan',
  '確認訂單': 'Konfirmasi Pesanan',
  '您的姓名（選填）': 'Nama Anda (opsional)',
  '方便取餐時叫號': 'Agar mudah dipanggil saat pesanan siap',
  '桌號 / 備註（選填）': 'Nomor meja (opsional)',
  '例如: 3號桌': 'contoh: Meja 3',
  '備註': 'Catatan',
  '特殊需求...': 'Permintaan khusus...',
  '取消': 'Batal',
  '確認送出': 'Konfirmasi',
  '送出中...': 'Mengirim...',
  '訂單送出失敗': 'Pesanan gagal dikirim',
  '無法連線到伺服器': 'Tidak dapat terhubung ke server',
  '訂單已送出!': 'Pesanan terkirim!',
  '訂單編號: ': 'No. pesanan: ',
  '等待店家確認中...': 'Menunggu konfirmasi toko...',
  '店家已接單，準備中！': 'Pesanan diterima, sedang disiapkan!',
  '已完成，請取餐！': 'Sudah siap, silakan ambil!',
  '很抱歉，訂單已被取消': 'Maaf, pesanan Anda dibatalkan',
  '繼續點餐': 'Pesan Lagi',
}

const LANG = new URLSearchParams(location.search).get('lang') || localStorage.getItem('pos-lang') || 'id'

function t(zh, params) {
  const d = { en: EN, id: ID }[LANG]
  let s = (d && d[zh]) || zh
  if (params) for (const k in params) s = s.replaceAll('{' + k + '}', params[k])
  return s
}

// 金額顯示：zh 維持 $，en/id 用 Rp 15.000 樣式
function fmtMoney(n) {
  if (LANG === 'zh') return '$' + n
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function setLang(lang) {
  try { localStorage.setItem('pos-lang', lang) } catch {}
  const params = new URLSearchParams(location.search)
  params.set('lang', lang)
  location.search = params.toString()
}

// 語言切換器 + 靜態文字套用
function applyI18n() {
  document.documentElement.lang = { en: 'en', id: 'id' }[LANG] || 'zh-TW'
  const sw = document.createElement('div')
  sw.className = 'lang-switcher'
  ;[['zh', '中文'], ['en', 'EN'], ['id', 'ID']].forEach(([code, label]) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'lang-btn' + (LANG === code ? ' active' : '')
    b.textContent = label
    b.onclick = () => setLang(code)
    sw.appendChild(b)
  })
  document.getElementById('header').appendChild(sw)

  const setText = (id, zh) => { const el = document.getElementById(id); if (el) el.textContent = t(zh) }
  document.title = t('線上點餐')
  setText('store-name', '載入中...')
  setText('subtitle', '線上點餐系統')
  document.getElementById('search-input').placeholder = t('搜尋商品...')
  setText('cart-title', '購物車')
  setText('cart-total-label', '合計')
  setText('checkout-btn', '送出訂單')
  setText('form-title', '確認訂單')
  setText('label-name', '您的姓名（選填）')
  document.getElementById('customer-name').placeholder = t('方便取餐時叫號')
  setText('label-table', '桌號 / 備註（選填）')
  document.getElementById('table-num').placeholder = t('例如: 3號桌')
  setText('label-note', '備註')
  document.getElementById('order-note').placeholder = t('特殊需求...')
  setText('form-total-label', '合計')
  setText('cancel-btn', '取消')
  setText('confirm-btn', '確認送出')
  setText('success-title', '訂單已送出!')
  setText('success-status', '等待店家確認中...')
  setText('continue-btn', '繼續點餐')
  document.getElementById('cart-total-amount').textContent = fmtMoney(0)
  document.getElementById('form-total').textContent = fmtMoney(0)
}

const API = window.location.origin
let products = []
let categories = []
let cart = []
let activeCategory = null
let ws = null
let currentOrderId = null
let submitting = false

// 防 XSS：跳脫 HTML 特殊字元
function esc(str) {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}

// ===== 初始化 =====
async function init() {
  try {
    const res = await fetch(API + '/api/menu')
    const data = await res.json()
    if (data.success) {
      products = data.products
      categories = data.categories
      document.getElementById('store-name').textContent = data.storeName
      document.title = data.storeName + ' - ' + t('線上點餐')
      renderCategories()
      renderProducts()
    }
  } catch (err) {
    document.getElementById('store-name').textContent = t('無法連線')
    document.getElementById('product-list').innerHTML =
      '<p style="text-align:center;color:#888;padding:40px;grid-column:1/-1">' + t('無法載入菜單，請確認網路連線') + '</p>'
  }
  connectWebSocket()
}

// ===== WebSocket =====
function connectWebSocket() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  try {
    ws = new WebSocket(protocol + '//' + location.host)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'order-status' && msg.orderId === currentOrderId) {
          updateOrderStatus(msg.status)
        }
      } catch {}
    }
    ws.onclose = () => setTimeout(connectWebSocket, 3000)
    ws.onerror = () => {}
  } catch {}
}

// ===== 分類 =====
function renderCategories() {
  const nav = document.getElementById('categories')
  const allBtn = createCatBtn(t('全部'), null)
  nav.appendChild(allBtn)
  categories.forEach(cat => nav.appendChild(createCatBtn(cat, cat)))
}

function createCatBtn(label, value) {
  const btn = document.createElement('button')
  btn.className = 'cat-btn' + (activeCategory === value ? ' active' : '')
  btn.textContent = label
  btn.onclick = () => {
    activeCategory = value
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    renderProducts()
  }
  return btn
}

// ===== 商品搜尋 =====
let searchQuery = ''

// ===== 商品列表 =====
function renderProducts() {
  const list = document.getElementById('product-list')
  let filtered = activeCategory
    ? products.filter(p => p.category === activeCategory)
    : products
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    )
  }

  list.innerHTML = filtered.map(p => {
    const inCart = cart.find(c => c.id === p.id)
    const qtyBadge = inCart ? `<div class="qty-badge">${inCart.qty}</div>` : ''
    const stock = Number(p.stock) || 0
    const soldOut = stock <= 0
    const lastFew = stock > 0 && stock <= 3
    const low = stock > 0 && stock <= 5
    let stockNote = ''
    if (soldOut) stockNote = `<span class="p-soldout">${t('售完')}</span>`
    else if (lastFew) stockNote = `<span class="p-stock-last">${t('最後 {n} {u}！', {n: stock, u: esc(t(p.unit || '個'))})}</span>`
    else if (low) stockNote = `<span class="p-stock-low">${t('剩 {n} {u}', {n: stock, u: esc(t(p.unit || '個'))})}</span>`
    return `
      <div class="product-card${soldOut ? ' sold-out' : ''}">
        ${qtyBadge}
        <span class="p-category">${esc(p.category)}</span>
        <span class="p-name">${esc(p.name)}</span>
        <span class="p-price">${fmtMoney(p.price)} <span class="p-unit">/ ${esc(t(p.unit || '個'))}</span></span>
        ${stockNote}
        <button class="add-btn" data-pid="${esc(p.id)}" ${soldOut ? 'disabled' : ''}>${soldOut ? t('售完') : t('加入購物車')}</button>
      </div>
    `
  }).join('')

  if (!filtered.length) {
    list.innerHTML = '<p style="text-align:center;color:#888;padding:40px;grid-column:1/-1">' + t('沒有符合的商品') + '</p>'
  }

  // 用 event delegation 取代 inline onclick — 修 audit #23 邊界 case，安全處理含特殊字元的 id
  list.querySelectorAll('.add-btn[data-pid]').forEach(btn => {
    btn.onclick = () => addToCart(btn.getAttribute('data-pid'))
  })
}

function setSearch(q) {
  searchQuery = q || ''
  renderProducts()
}

// ===== 購物車 =====
function addToCart(productId) {
  const product = products.find(p => p.id === productId)
  if (!product) return
  const existing = cart.find(c => c.id === productId)
  if (existing) {
    if (existing.qty >= product.stock) return // 不能超過庫存
    existing.qty++
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: 1, unit: product.unit })
  }
  updateCartUI()
  renderProducts() // 更新數量 badge
}

function removeFromCart(productId) {
  const idx = cart.findIndex(c => c.id === productId)
  if (idx < 0) return
  if (cart[idx].qty > 1) cart[idx].qty--
  else cart.splice(idx, 1)
  updateCartUI()
  renderProducts()
}

function deleteFromCart(productId) {
  cart = cart.filter(c => c.id !== productId)
  updateCartUI()
  renderProducts()
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0)
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0)
}

function updateCartUI() {
  const badge = document.getElementById('cart-badge')
  const count = getCartCount()
  badge.textContent = count
  badge.style.display = count > 0 ? 'flex' : 'none'

  const itemsDiv = document.getElementById('cart-items')
  const totalEl = document.getElementById('cart-total-amount')
  const checkoutBtn = document.getElementById('checkout-btn')

  if (!cart.length) {
    itemsDiv.innerHTML = '<div class="cart-empty">' + t('購物車是空的') + '</div>'
    totalEl.textContent = '$0'
    checkoutBtn.disabled = true
    return
  }

  itemsDiv.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-info">
        <div class="ci-name">${esc(item.name)}</div>
        <div class="ci-price">${fmtMoney(item.price)} / ${esc(t(item.unit || '個'))}</div>
      </div>
      <div class="ci-controls">
        <button onclick="removeFromCart('${esc(item.id)}')">-</button>
        <span class="ci-qty">${item.qty}</span>
        <button onclick="addToCart('${esc(item.id)}')">+</button>
      </div>
      <span class="ci-subtotal">${fmtMoney(item.price * item.qty)}</span>
    </div>
  `).join('')

  totalEl.textContent = fmtMoney(getCartTotal())
  checkoutBtn.disabled = false
}

function toggleCart() {
  const overlay = document.getElementById('cart-overlay')
  const panel = document.getElementById('cart-panel')
  const isOpen = panel.classList.contains('open')
  if (isOpen) {
    panel.classList.remove('open')
    overlay.classList.remove('open')
  } else {
    updateCartUI()
    panel.classList.add('open')
    overlay.classList.add('open')
  }
}

// ===== 訂單提交 =====
function submitOrder() {
  if (!cart.length) return
  toggleCart()
  document.getElementById('form-total').textContent = fmtMoney(getCartTotal())
  document.getElementById('order-form-overlay').style.display = 'flex'
}

function closeOrderForm() {
  document.getElementById('order-form-overlay').style.display = 'none'
}

async function confirmOrder() {
  if (submitting) return
  submitting = true
  const btn = document.querySelector('.order-form .btn-primary')
  if (btn) { btn.disabled = true; btn.textContent = t('送出中...') }

  const customerName = document.getElementById('customer-name').value.trim()
  const tableNum = document.getElementById('table-num').value.trim()
  const note = document.getElementById('order-note').value.trim()

  const orderItems = cart.map(c => ({ id: c.id, qty: c.qty }))

  try {
    const res = await fetch(API + '/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: orderItems, customerName, tableNum, note }),
    })
    const data = await res.json()
    if (data.success) {
      currentOrderId = data.orderId
      closeOrderForm()
      showSuccess(data.orderId, data.total)
      cart = []
      updateCartUI()
    } else {
      alert(data.error || t('訂單送出失敗'))
    }
  } catch (err) {
    alert(t('無法連線到伺服器'))
  }
  submitting = false
  if (btn) { btn.disabled = false; btn.textContent = t('確認送出') }
}

function showSuccess(orderId, total) {
  document.getElementById('success-order-id').textContent = t('訂單編號: ') + orderId
  document.getElementById('success-status').textContent = t('等待店家確認中...')
  document.getElementById('order-success').style.display = 'flex'
}

function updateOrderStatus(status) {
  const statusEl = document.getElementById('success-status')
  if (!statusEl) return
  const labels = {
    pending: '等待店家確認中...',
    accepted: t('店家已接單，準備中！'),
    completed: t('已完成，請取餐！'),
    rejected: t('很抱歉，訂單已被取消'),
  }
  statusEl.textContent = labels[status] || status
}

function resetApp() {
  currentOrderId = null
  document.getElementById('order-success').style.display = 'none'
  document.getElementById('customer-name').value = ''
  document.getElementById('table-num').value = ''
  document.getElementById('order-note').value = ''
  renderProducts()
}

// 啟動
applyI18n()
init()
