/* Shared by every page: header, footer, cart, currency, products, blog helpers.
   Edit the cart or anything else HERE and every page updates. Contact details live in site-config.js. */
(function () {
  const S = window.SITE;
  const online = !!(S.supabaseUrl && S.supabaseKey);
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  /* ---------- currency: Nigeria sees naira, everywhere else sees US dollars ---------- */
  /* Prices are always stored in naira (what the admin types). Only the display changes. */
  const naira = (n) => S.currency + Number(n || 0).toLocaleString("en-NG");
  const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: fine */ } }
  };
  const fresh = (c, hours) => !!c && Date.now() - c.t < hours * 36e5;
  const CUR = { mode: "NGN", rate: Number(S.fallbackNgnPerUsd) || 1500, auto: true };

  /* 1) instant guess, so the first paint is already right for most people */
  (function () {
    const q = (new URLSearchParams(location.search).get("cur") || "").toUpperCase();   // ?cur=usd or ?cur=ngn to preview
    if (q === "USD" || q === "NGN") { CUR.mode = q; CUR.auto = false; }
    else {
      const g = store.get("ik_geo");
      if (g && g.c) CUR.mode = g.c === "NG" ? "NGN" : "USD";
      else {
        let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* ignore */ }
        if (tz && !/^(UTC|Etc\/.*|GMT)$/.test(tz) && tz !== "Africa/Lagos") CUR.mode = "USD";
      }
    }
    const r = store.get("ik_rate"); if (r && r.v > 1) CUR.rate = r.v;
  })();

  /* 2) confirm with the visitor's real country and a live rate, then redraw prices if anything changed */
  const getJSON = async (url, ms = 3000) => {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
    finally { clearTimeout(t); }
  };
  async function lookupCountry() {
    const tries = [
      async () => (await getJSON("https://api.country.is/")).country,
      async () => (await getJSON("https://ipwho.is/")).country_code
    ];
    for (const t of tries) { try { const c = String((await t()) || "").toUpperCase(); if (/^[A-Z]{2}$/.test(c)) return c; } catch (e) { /* try the next one */ } }
    return "";
  }
  async function lookupRate() {
    const tries = [
      async () => (await getJSON("https://open.er-api.com/v6/latest/USD")).rates.NGN,
      async () => (await getJSON("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json")).usd.ngn
    ];
    for (const t of tries) { try { const v = Number(await t()); if (isFinite(v) && v > 1) return v; } catch (e) { /* try the next one */ } }
    return 0;
  }
  (async function detectCurrency() {
    const before = CUR.mode + "|" + CUR.rate;
    if (CUR.auto && !fresh(store.get("ik_geo"), 12)) {
      const c = await lookupCountry();
      if (c) { store.set("ik_geo", { c, t: Date.now() }); CUR.mode = c === "NG" ? "NGN" : "USD"; }
    }
    if (CUR.mode === "USD" && !fresh(store.get("ik_rate"), 12)) {
      const v = await lookupRate();
      if (v) { store.set("ik_rate", { v, t: Date.now() }); CUR.rate = v; }
    }
    if (before !== CUR.mode + "|" + CUR.rate) document.dispatchEvent(new Event("ik:currency"));
  })();

  const money = (n) => CUR.mode === "USD" ? usdFmt.format(Number(n || 0) / CUR.rate) : naira(n);
  /* for the WhatsApp order message: the shop owner always also sees the naira amount */
  const both = (n) => CUR.mode === "USD" ? money(n) + " (" + naira(n) + ")" : naira(n);
  const wa = (text) => "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text);

  /* ---------- header & footer ---------- */
  const pages = [
    ["index.html", "Home", "home"],
    ["about.html", "About", "about"],
    ["bespoke.html", "Kenah Bespoke", "bespoke"],
    ["ready-to-wear.html", "Ready to wear", "rtw"],
    ["blog.html", "Blog", "blog"]
  ];
  function buildChrome() {
    const cur = document.body.dataset.page;
    const h = $("#site-header");
    if (h) {
      h.className = "site-header";
      h.innerHTML = `<div class="wrap">
    <a class="logo" href="index.html" aria-label="${esc(S.brand)} ${esc(S.tagline)} home">
      <img src="${esc(S.logo || "images/kamieo_logo.jpg")}" alt="">
      <span class="logo-text"><strong>${esc(S.brand).toUpperCase()}</strong><span>${esc(S.tagline).toUpperCase()}</span></span>
    </a>
    <button class="menu-toggle" aria-label="Menu" aria-expanded="false">&#9776;</button>
    <nav class="nav" id="nav">
      ${pages.map((p) => `<a href="${p[0]}" class="${cur === p[2] ? "active" : ""}">${p[1]}</a>`).join("")}
      <a href="book.html" class="btn-nav ${cur === "book" ? "active" : ""}">Book appointment</a>
      <button class="cart-btn" id="open-cart" aria-label="Open cart">Cart <span class="cart-count" id="cart-count">0</span></button>
    </nav></div>`;
      const t = $(".menu-toggle", h);
      t.addEventListener("click", () => {
        const o = $("#nav").classList.toggle("open");
        t.setAttribute("aria-expanded", o);
      });
    }
    const f = $("#site-footer");
    if (f) {
      f.className = "site-footer";
      f.innerHTML = `<div class="wrap"><div class="foot">
    <div><h4>${esc(S.brand)} ${esc(S.tagline)}</h4><p>A fashion house in Abuja. Tailored clothing and ready-to-wear pieces.</p></div>
    <div><h4>Pages</h4><ul>${pages.map((p) => `<li><a href="${p[0]}">${p[1]}</a></li>`).join("")}<li><a href="book.html">Book appointment</a></li><li><a href="index.html#contact">Contact us</a></li></ul></div>
    <div><h4>Contact</h4><ul>
      <li><a href="${wa("Hello, I have an enquiry.")}">WhatsApp</a></li>
      <li><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>
      <li><a href="${esc(S.instagram)}" target="_blank" rel="noopener">Instagram</a></li>
      <li><a href="${esc(S.facebook)}" target="_blank" rel="noopener">Facebook</a></li>
      <li>${esc(S.address)}</li></ul></div>
  </div><div class="copy">&copy; ${new Date().getFullYear()} ${esc(S.brand)} ${esc(S.tagline)}. All rights reserved.</div></div>`;
    }
  }

  /* ---------- products ---------- */
  const SAMPLE = [
    { id: "s1", name: "Navy Two-Piece Suit", price: 185000, category: "Suits", sizes: "S,M,L,XL", description: "Fully lined, slim cut, ready to wear.", image_url: "https://kamieokreations.com/wp-content/uploads/2026/07/kk-19.png", in_stock: true },
    { id: "s2", name: "Charcoal Senator Set", price: 95000, category: "Native wear", sizes: "M,L,XL,XXL", description: "Clean senator set with fine hand finishing.", image_url: "https://kamieokreations.com/wp-content/uploads/2026/07/kk-07.jpg", in_stock: true },
    { id: "s3", name: "White Tailored Shirt", price: 38000, category: "Shirts", sizes: "S,M,L,XL", description: "Crisp cotton, structured collar.", image_url: "https://kamieokreations.com/wp-content/uploads/2026/07/kk-11.png", in_stock: true },
    { id: "s4", name: "Black Trousers", price: 45000, category: "Trousers", sizes: "30,32,34,36,38", description: "High-waisted, pressed crease.", image_url: "https://kamieokreations.com/wp-content/uploads/2026/07/kk-18.jpg", in_stock: true },
    { id: "s5", name: "Wine Blazer", price: 120000, category: "Suits", sizes: "S,M,L,XL", description: "Single-breasted blazer in soft wool blend.", image_url: "https://kamieokreations.com/wp-content/uploads/2026/07/kk-13.png", in_stock: true },
    { id: "s6", name: "Agbada Three-Piece", price: 220000, category: "Native wear", sizes: "L,XL,XXL", description: "Embroidered neckline, wide flowing sleeves.", image_url: "https://kamieokreations.com/wp-content/uploads/2026/07/kk-22.png", in_stock: false }
  ];

  const KK = "https://kamieokreations.com/wp-content/uploads/2026/07/";
  const PK = "ik_posts_v1";
  const POSTS_SAMPLE = [
    {
      id: "b1", title: "What to expect at your first fitting", category: "Guides", author: "Kamieo Kreations", published: true, created_at: "2026-10-01T09:00:00Z", image_url: KK + "kk-19.png",
      excerpt: "A simple walk through your first visit, from measurements to the final try-on.",
      content: "Your first fitting is a conversation. We talk about the occasion, the style you like and how you want the clothes to feel.\n\nThen we take your measurements. It only takes a few minutes, and it is the most important step because every cut starts from those numbers.\n\nBring a photo of anything you like. It helps us understand your taste faster."
    },
    {
      id: "b2", title: "How to choose fabric for a native outfit", category: "Style", author: "Kamieo Kreations", published: true, created_at: "2026-09-24T09:00:00Z", image_url: KK + "kk-13.png",
      excerpt: "Weight, colour and finish: three things to think about before you pick a cloth.",
      content: "Start with the weather and the event. A heavy fabric looks rich but can be tiring in the heat, so think about how long you will be wearing it.\n\nNext, think about colour. Deep tones suit formal events, while lighter shades feel relaxed and fresh.\n\nFinally, touch the cloth. Good fabric should feel good on your skin."
    },
    {
      id: "b3", title: "Caring for your tailored clothes", category: "Care", author: "Kamieo Kreations", published: true, created_at: "2026-09-15T09:00:00Z", image_url: KK + "kk-11.png",
      excerpt: "Small habits that keep a suit or a native set looking sharp for years.",
      content: "Hang your clothes on a proper hanger and let them rest a day between wears.\n\nBrush wool gently instead of washing it often. Dry clean only when you really need to.\n\nSteam out small creases rather than pressing hard, so the fabric keeps its shape."
    }
  ];
  const LS = "ik_products_v2";
  const hdr = (token) => { const h = { apikey: S.supabaseKey, "Content-Type": "application/json" }; if (token) h.Authorization = "Bearer " + token; return h; };

  const API = {
    online,
    async list() {
      if (online) {
        const r = await fetch(S.supabaseUrl + "/rest/v1/products?select=*&order=created_at.desc", { headers: hdr() });
        if (!r.ok) throw new Error("Could not load products");
        return r.json();
      }
      let d = localStorage.getItem(LS);
      if (!d) { localStorage.setItem(LS, JSON.stringify(SAMPLE)); return SAMPLE.slice(); }
      return JSON.parse(d);
    },
    async save(p, token) {
      if (online) {
        const body = { name: p.name, price: p.price, category: p.category, sizes: p.sizes, description: p.description, image_url: p.image_url, in_stock: p.in_stock };
        const url = S.supabaseUrl + "/rest/v1/products" + (p.id ? "?id=eq." + encodeURIComponent(p.id) : "");
        const r = await fetch(url, { method: p.id ? "PATCH" : "POST", headers: { ...hdr(token), Prefer: "return=minimal" }, body: JSON.stringify(body) });
        if (!r.ok) throw new Error("Save failed (" + r.status + "). Are you signed in?");
        return;
      }
      const all = await this.list();
      if (p.id) { const i = all.findIndex((x) => x.id === p.id); if (i > -1) all[i] = p; }
      else { p.id = "p" + Date.now(); all.unshift(p); }
      localStorage.setItem(LS, JSON.stringify(all));
    },
    async remove(id, token) {
      if (online) {
        const r = await fetch(S.supabaseUrl + "/rest/v1/products?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: hdr(token) });
        if (!r.ok) throw new Error("Delete failed (" + r.status + ")");
        return;
      }
      const all = (await this.list()).filter((x) => x.id !== id);
      localStorage.setItem(LS, JSON.stringify(all));
    },
    async listPosts(all, token) {
      if (online) {
        const r = await fetch(S.supabaseUrl + "/rest/v1/blog_posts?select=*&order=created_at.desc" + (all ? "" : "&published=eq.true"), { headers: hdr(all ? token : undefined) });
        if (!r.ok) throw new Error("Could not load posts");
        return r.json();
      }
      let d = localStorage.getItem(PK);
      if (!d) { localStorage.setItem(PK, JSON.stringify(POSTS_SAMPLE)); d = JSON.stringify(POSTS_SAMPLE); }
      const list = JSON.parse(d);
      return all ? list : list.filter((p) => p.published !== false);
    },
    async savePost(p, token) {
      if (online) {
        const body = { title: p.title, category: p.category, author: p.author, excerpt: p.excerpt, content: p.content, image_url: p.image_url, published: p.published };
        const url = S.supabaseUrl + "/rest/v1/blog_posts" + (p.id ? "?id=eq." + encodeURIComponent(p.id) : "");
        const r = await fetch(url, { method: p.id ? "PATCH" : "POST", headers: { ...hdr(token), Prefer: "return=minimal" }, body: JSON.stringify(body) });
        if (!r.ok) throw new Error("Save failed (" + r.status + "). Are you signed in?");
        return;
      }
      const all = await this.listPosts(true);
      if (p.id) { const i = all.findIndex((x) => x.id === p.id); if (i > -1) all[i] = { ...all[i], ...p }; }
      else { p.id = "p" + Date.now(); p.created_at = new Date().toISOString(); all.unshift(p); }
      localStorage.setItem(PK, JSON.stringify(all));
    },
    async removePost(id, token) {
      if (online) {
        const r = await fetch(S.supabaseUrl + "/rest/v1/blog_posts?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: hdr(token) });
        if (!r.ok) throw new Error("Delete failed (" + r.status + ")");
        return;
      }
      const all = (await this.listPosts(true)).filter((x) => x.id !== id);
      localStorage.setItem(PK, JSON.stringify(all));
    },
    async login(email, password) {
      const r = await fetch(S.supabaseUrl + "/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: S.supabaseKey, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error_description || d.msg || "Wrong email or password");
      return d.access_token;
    },
    async upload(file, token) {
      const name = Date.now() + "-" + file.name.replace(/[^a-z0-9.\-_]/gi, "_");
      if (online) {
        const r = await fetch(S.supabaseUrl + "/storage/v1/object/products/" + name, { method: "POST", headers: { apikey: S.supabaseKey, Authorization: "Bearer " + token, "Content-Type": file.type }, body: file });
        if (!r.ok) throw new Error("Image upload failed (" + r.status + ")");
        return S.supabaseUrl + "/storage/v1/object/public/products/" + name;
      }
      // demo mode: shrink the image and keep it in the browser
      return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const max = 700, k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = img.width * k; c.height = img.height * k;
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => rej(new Error("Could not read that image"));
        img.src = URL.createObjectURL(file);
      });
    }
  };
  /* ---------- rich text helpers (blog posts are stored as safe HTML) ---------- */
  const T_ALLOW = { P: 1, BR: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, S: 1, STRIKE: 1, H2: 1, H3: 1, H4: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, A: 1, IMG: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TD: 1, TH: 1, SPAN: 1, DIV: 1, HR: 1, SUB: 1, SUP: 1 };
  const T_DROP = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, FORM: 1, INPUT: 1, BUTTON: 1, TEXTAREA: 1, SELECT: 1, NOSCRIPT: 1, LINK: 1, META: 1, TITLE: 1, HEAD: 1, SVG: 1, MATH: 1, VIDEO: 1, AUDIO: 1, CANVAS: 1 };
  const T_MAP = { H1: "H2", H5: "H4", H6: "H4" };
  const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|[a-z]+)$/i;
  function cleanStyle(st) {
    const out = [];
    String(st || "").split(";").forEach((d) => {
      const i = d.indexOf(":"); if (i < 0) return;
      const k = d.slice(0, i).trim().toLowerCase(), v = d.slice(i + 1).trim();
      if (k === "text-align" && /^(left|right|center|justify)$/i.test(v)) out.push(k + ":" + v);
      else if ((k === "color" || k === "background-color") && COLOR.test(v) && !/^(windowtext|transparent|inherit|initial)$/i.test(v)) out.push(k + ":" + v);
      else if (k === "font-weight" && /^(normal|bold|[1-9]00)$/i.test(v)) out.push(k + ":" + v);
      else if (k === "font-style" && /^(italic|normal)$/i.test(v)) out.push(k + ":" + v);
      else if (k === "text-decoration" && /^(underline|line-through|none)$/i.test(v)) out.push(k + ":" + v);
    });
    return out.join(";");
  }
  function sanitize(html) {
    const doc = new DOMParser().parseFromString("<body>" + String(html || ""), "text/html");
    const walk = (node, parent) => {
      node.childNodes.forEach((c) => {
        if (c.nodeType === 3) { parent.appendChild(doc.createTextNode(c.nodeValue)); return; }
        if (c.nodeType !== 1) return;
        let tag = c.tagName;
        if (T_DROP[tag]) return;
        tag = T_MAP[tag] || tag;
        if (!T_ALLOW[tag]) { walk(c, parent); return; }
        const el = doc.createElement(tag);
        const st = cleanStyle(c.getAttribute("style")); if (st) el.setAttribute("style", st);
        if (tag === "A") {
          const h = (c.getAttribute("href") || "").trim();
          if (/^(https?:|mailto:|tel:|#)/i.test(h)) { el.setAttribute("href", h); el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener noreferrer"); }
        }
        if (tag === "IMG") {
          const src = (c.getAttribute("src") || "").trim();
          if (!/^(https?:\/\/|data:image\/(png|jpe?g|gif|webp);base64,)/i.test(src)) return;
          el.setAttribute("src", src); el.setAttribute("alt", c.getAttribute("alt") || "");
        }
        if (tag === "TD" || tag === "TH") ["colspan", "rowspan"].forEach((a) => { const v = c.getAttribute(a); if (v && /^\d+$/.test(v)) el.setAttribute(a, v); });
        walk(c, el);
        parent.appendChild(el);
      });
    };
    const out = doc.createElement("div"); walk(doc.body, out); return out.innerHTML;
  }
  const textToHtml = (t) => esc(t).split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).map((x) => "<p>" + x.replace(/\n/g, "<br>") + "</p>").join("");
  const toHtml = (c) => /<\/?(p|h[1-6]|ul|ol|li|div|br|strong|em|b|i|u|a|img|table|blockquote|span)\b/i.test(c || "") ? sanitize(c) : textToHtml(c || "");
  const plainText = (html) => (new DOMParser().parseFromString("<body>" + String(html || ""), "text/html").body.textContent || "").split(/\s+/).filter(Boolean).join(" ");

  window.IK = { API, esc, money, moneyNGN: naira, wa, S, sanitize, toHtml, textToHtml, plainText };

  /* ---------- cart ---------- */
  const CK = "ik_cart";
  const getCart = () => JSON.parse(localStorage.getItem(CK) || "[]");
  const setCart = (c) => { localStorage.setItem(CK, JSON.stringify(c)); drawCart(); };
  function addToCart(p, size) {
    const c = getCart();
    const key = p.id + "|" + size;
    const f = c.find((x) => x.key === key);
    if (f) f.qty++;
    else c.push({ key, name: p.name, price: Number(p.price), image: p.image_url || "", size, qty: 1 });
    setCart(c);
    openCart();
  }
  function buildCart() {
    if (!document.getElementById("ik-cart-css")) {
      const st = document.createElement("style");
      st.id = "ik-cart-css";
      st.textContent = `
.pay-options{margin-bottom:1rem;display:grid;gap:.5rem}
.pay-options strong{display:block;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--thread)}
.pay-opt{display:flex;align-items:center;gap:.6rem;background:var(--white);border:1px solid var(--stripe);padding:.7rem .9rem;cursor:pointer;font-size:.92rem}
.pay-opt input{accent-color:var(--thread)}
.pay-opt:has(input:checked){border-color:var(--thread)}`;
      document.head.appendChild(st);
    }
    const root = document.createElement("div");
    root.innerHTML = `<div class="overlay" id="overlay"></div>
  <aside class="drawer" id="drawer" aria-label="Cart">
    <header><h3>Your cart</h3><button id="close-cart" aria-label="Close cart">&times;</button></header>
    <div class="items" id="cart-items"></div>
    <footer>
      <div class="total"><span>Total</span><span id="cart-total"></span></div>
      <div class="pay-options">
        <strong>Payment method</strong>
        <label class="pay-opt"><input type="radio" name="pay" value="transfer" checked> Bank transfer</label>
        <label class="pay-opt"><input type="radio" name="pay" value="delivery"> Pay on delivery</label>
      </div>
      <div class="bank-details" id="bank-details">
        <strong>Payment details</strong>
        <div>Kamieo Kreations</div>
        <div>Acct No: 5600299257</div>
        <div>Fidelity Bank</div>
      </div>
      <button class="btn" id="checkout">Continue to delivery details</button>
      <small id="cart-note">We confirm stock and delivery with you after you place your order.</small>
    </footer>
  </aside>`;
    document.body.appendChild(root);
    $("#open-cart").addEventListener("click", openCart);
    $("#close-cart").addEventListener("click", closeCart);
    $("#overlay").addEventListener("click", closeCart);
    const payVal = () => (document.querySelector('input[name="pay"]:checked') || {}).value || "transfer";
    const syncPay = () => {
      const d = payVal() === "delivery";
      $("#bank-details").hidden = d;
      $("#checkout").textContent = d ? "Continue to delivery details" : "Continue to checkout";
    };
    document.querySelectorAll('input[name="pay"]').forEach((r) => r.addEventListener("change", syncPay));
    syncPay();
    $("#checkout").addEventListener("click", () => {
      if (!getCart().length) return;
      location.href = "checkout.html?pay=" + payVal();
    });
    $("#cart-items").addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const c = getCart(); const i = c.findIndex((x) => x.key === b.dataset.key); if (i < 0) return;
      if (b.dataset.act === "inc") c[i].qty++;
      if (b.dataset.act === "dec") c[i].qty = Math.max(1, c[i].qty - 1);
      if (b.dataset.act === "rm") c.splice(i, 1);
      setCart(c);
    });
    drawCart();
  }
  function drawCart() {
    const c = getCart();
    const n = c.reduce((a, i) => a + i.qty, 0);
    const cc = $("#cart-count"); if (cc) cc.textContent = n;
    const box = $("#cart-items"); if (!box) return;
    box.innerHTML = c.length ? c.map((i) => `<div class="line">
  <div class="thumb" style="background-image:url('${esc(i.image)}')"></div>
  <div><strong>${esc(i.name)}</strong><br><small>Size ${esc(i.size)} &middot; ${money(i.price)}</small>
    <div class="qty"><button data-act="dec" data-key="${esc(i.key)}" aria-label="Less">&minus;</button><span>${i.qty}</span><button data-act="inc" data-key="${esc(i.key)}" aria-label="More">+</button></div></div>
  <button class="rm" data-act="rm" data-key="${esc(i.key)}">Remove</button></div>`).join("") : '<p class="empty">Your cart is empty. Pick something from Ready to wear.</p>';
    $("#cart-total").textContent = money(c.reduce((a, i) => a + i.price * i.qty, 0));
    const note = $("#cart-note"); if (note) note.textContent = "We confirm stock and delivery with you after you place your order." + (CUR.mode === "USD" ? " Prices in US dollars are approximate; the final amount is confirmed with you." : "");
  }
  function openCart() { $("#drawer").classList.add("open"); $("#overlay").classList.add("open"); }
  function closeCart() { $("#drawer").classList.remove("open"); $("#overlay").classList.remove("open"); }

  /* ---------- shop rendering ---------- */
  function card(p) {
    const sizes = String(p.sizes || "One size").split(",").map((s) => s.trim()).filter(Boolean);
    const out = p.in_stock === false;
    const pic = p.image_url ? `style="background-image:url('${esc(p.image_url)}')"` : "";
    return `<article class="card" data-id="${esc(p.id)}">
  <div class="pic" ${pic}>${p.image_url ? "" : esc(p.name)}${out ? '<span class="tag">Sold out</span>' : ""}</div>
  <div class="info"><h3>${esc(p.name)}</h3><div class="price">${money(p.price)}</div>
    <p class="desc">${esc(p.description)}</p>
    <div class="row">${out ? '<button class="btn small" disabled style="opacity:.5;cursor:not-allowed;width:100%">Sold out</button>'
        : `<select aria-label="Size">${sizes.map((s) => `<option>${esc(s)}</option>`).join("")}</select><button class="btn small" data-add>Add to cart</button>`}</div>
  </div></article>`;
  }
  window.renderShop = async function (box, opts = {}) {
    let list;
    try { list = await API.list(); } catch (e) { box.innerHTML = '<p class="empty">Products could not load. Please refresh.</p>'; return; }
    if (opts.limit) list = list.slice(0, opts.limit);
    let current = "All";
    const bar = opts.filters ? $(opts.filters) : null;
    const draw = () => {
      const shown = current === "All" ? list : list.filter((p) => p.category === current);
      box.innerHTML = shown.length ? shown.map(card).join("") : '<p class="empty">Nothing here yet. Check back soon.</p>';
    };
    if (bar) {
      const cats = ["All", ...new Set(list.map((p) => p.category).filter(Boolean))];
      bar.innerHTML = cats.map((c, i) => `<button class="chip ${i === 0 ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
      bar.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cat]"); if (!b) return;
        current = b.dataset.cat;
        bar.querySelectorAll(".chip").forEach((x) => x.classList.toggle("on", x === b));
        draw();
      });
    }
    document.addEventListener("ik:currency", draw);
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-add]"); if (!b) return;
      const el = b.closest(".card");
      const p = list.find((x) => String(x.id) === el.dataset.id);
      addToCart(p, $("select", el).value);
    });
    draw();
  };

  /* ---------- booking form ---------- */
  function bookingForm() {
    const f = $("#book-form"); if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      const msg = `Hello, I'd like to book an appointment.\nName: ${d.name}\nPhone: ${d.phone}\nService: ${d.service}\nPreferred date: ${d.date || "Flexible"}\nDetails: ${d.details || "-"}`;
      window.open(wa(msg), "_blank");
      $("#book-ok").hidden = false;
    });
  }


  function fillContact() {
    const msg = "Hello, I have an enquiry.";
    document.querySelectorAll("[data-contact]").forEach((ul) => {
      ul.innerHTML = `<li><b>Address</b>${esc(S.address)}</li>
    <li><b>WhatsApp</b><a href="${wa(msg)}">+${esc(S.whatsapp)}</a></li>
    <li><b>Email</b><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>
    <li><b>Instagram</b><a href="${esc(S.instagram)}" target="_blank" rel="noopener">@kenahBespoke</a></li>
    <li><b>Facebook</b><a href="${esc(S.facebook)}" target="_blank" rel="noopener">Kenahbespoke</a></li>`;
    });
    document.querySelectorAll("[data-wa]").forEach((a) => { a.href = wa(msg); a.target = "_blank"; a.rel = "noopener"; });
  }

  /* ---------- hero slider ---------- */
  function initHeroSlider() {
    const track = document.getElementById("hero-slides");
    const slides = track ? track.querySelectorAll(".slide") : [];
    const dotsBox = document.getElementById("hero-dots");
    if (!slides.length || !dotsBox) return;

    // make the track wide enough to hold all slides side by side
    track.style.width = (slides.length * 100) + "%";
    slides.forEach((s) => { s.style.width = (100 / slides.length) + "%"; });

    let i = 0;
    slides.forEach((_, idx) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", "Slide " + (idx + 1));
      if (idx === 0) b.classList.add("on");
      b.addEventListener("click", () => go(idx));
      dotsBox.appendChild(b);
    });
    const dots = dotsBox.querySelectorAll("button");

    function go(n) {
      if (n === i) return;
      i = n;
      track.style.transform = "translateX(-" + (i * (100 / slides.length)) + "%)";
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    }

    setInterval(() => go((i + 1) % slides.length), 3000);
  }

  document.addEventListener("DOMContentLoaded", () => { buildChrome(); buildCart(); document.addEventListener("ik:currency", drawCart); bookingForm(); fillContact(); initHeroSlider(); });
})();
