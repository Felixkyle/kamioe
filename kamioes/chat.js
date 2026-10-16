/* Kamieo simple chat widget — no backend, no API key.
   All replies come from getReply() below. */
(function () {
  var S = window.SITE || {};
  var brand = S.brand || "Kamieo";
  var wa = S.whatsapp ? "https://wa.me/" + S.whatsapp : "#";

  // ---------- THE "BRAIN" (swap this function for a real AI later) ----------
  function getReply(msg) {
    var m = msg.toLowerCase();
    var has = function () {
      for (var i = 0; i < arguments.length; i++) if (m.indexOf(arguments[i]) > -1) return true;
      return false;
    };
    if (has("hi", "hello", "hey", "good morning", "good evening") && m.length < 25)
      return "Hello! Welcome to " + brand + " Kreations. Are you looking for a tailored outfit or something ready-to-wear?";
    if (has("bespoke", "tailor", "custom", "made to measure", "measure"))
      return "Our bespoke service is fully tailored to your measurements. You can see the details on the <a href='bespoke.html'>Bespoke page</a> and book a fitting on the <a href='book.html'>Book page</a>.";
    if (has("ready", "rtw", "buy", "shop", "collection"))
      return "Our ready-to-wear pieces are on the <a href='ready-to-wear.html'>Ready-to-Wear page</a>. Add any piece to your cart and checkout online.";
    if (has("price", "cost", "how much", "pay"))
      return "Prices depend on the style and fabric. Ready-to-wear prices are listed on each piece, and bespoke is quoted after a short chat. <a href='" + wa + "' target='_blank'>Message us on WhatsApp</a> for a quote.";
    if (has("where", "location", "address", "located", "visit", "studio"))
      return "We are at " + (S.address || "Abuja, Nigeria") + ".";
    if (has("deliver", "ship", "shipping"))
      return "Yes, we deliver. Delivery time and cost depend on your location. <a href='" + wa + "' target='_blank'>Ask us on WhatsApp</a> for the exact details.";
    if (has("book", "appointment", "fitting", "consult"))
      return "You can book a fitting here: <a href='book.html'>Book an appointment</a>.";
    if (has("how long", "time", "ready by", "turnaround", "days", "weeks"))
      return "Bespoke pieces take 2 days to 2 weeks max, depending on the design. For a rush order, <a href='" + wa + "' target='_blank'>talk to us on WhatsApp</a>.";
    if (has("contact", "phone", "whatsapp", "call", "email", "reach"))
      return "Reach us on <a href='" + wa + "' target='_blank'>WhatsApp</a>" + (S.email ? " or email " + S.email : "") + ".";
    if (has("thank"))
      return "You're welcome! Anything else I can help with?";
    return "Thanks for your message! I can help with bespoke, ready-to-wear, prices, delivery and booking. For anything else, <a href='" + wa + "' target='_blank'>chat with the team on WhatsApp</a>.";
  }
  // -------------------------------------------------------------------------

  var css = "\
#kc-btn{position:fixed;right:20px;bottom:20px;width:60px;height:60px;border-radius:50%;border:0;background:#14202E;color:#fff;font-size:27px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.28);z-index:9998;animation:kc-bounce 3.5s ease-in-out infinite;transition:background .2s,transform .2s}\
#kc-btn:hover{background:#B08D57;transform:scale(1.1);animation:none}\
#kc-btn::before{content:'';position:absolute;inset:0;border-radius:50%;border:2px solid #B08D57;animation:kc-ring 2.2s ease-out infinite;pointer-events:none}\
#kc-btn.opened{animation:none}\
#kc-btn.opened::before{display:none}\
#kc-dot{position:absolute;top:2px;right:2px;width:14px;height:14px;background:#e0443e;border:2px solid #fff;border-radius:50%;animation:kc-pulse 1.4s ease-in-out infinite}\
#kc-btn.opened #kc-dot{display:none}\
#kc-tip{position:fixed;right:90px;bottom:30px;background:#fff;color:#14202E;padding:10px 14px;border-radius:18px 18px 4px 18px;font-family:'Jost','Helvetica Neue',Arial,sans-serif;font-size:15px;box-shadow:0 6px 24px rgba(0,0,0,.2);z-index:9998;cursor:pointer;opacity:0;transform:translateY(10px) scale(.8);transform-origin:bottom right;pointer-events:none;transition:opacity .35s,transform .45s cubic-bezier(.34,1.56,.64,1)}\
#kc-tip.show{opacity:1;transform:none;pointer-events:auto}\
#kc-box{position:fixed;right:20px;bottom:92px;width:340px;max-width:calc(100vw - 40px);height:460px;max-height:calc(100vh - 120px);background:#fff;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden;z-index:9999;font-family:'Jost','Helvetica Neue',Arial,sans-serif;opacity:0;transform:translateY(20px) scale(.85);transform-origin:bottom right;pointer-events:none;transition:opacity .25s,transform .4s cubic-bezier(.34,1.56,.64,1)}\
#kc-box.open{opacity:1;transform:none;pointer-events:auto}\
#kc-head{background:#14202E;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;font-size:16px}\
#kc-head small{display:flex;align-items:center;gap:6px;color:#B08D57;font-size:12px}\
#kc-head small::before{content:'';width:8px;height:8px;background:#3ddc84;border-radius:50%;animation:kc-pulse 1.8s ease-in-out infinite}\
#kc-x{background:none;border:0;color:#fff;font-size:22px;cursor:pointer;transition:transform .2s}\
#kc-x:hover{transform:rotate(90deg)}\
#kc-msgs{flex:1;overflow-y:auto;padding:14px;background:#F5F4F1;display:flex;flex-direction:column;gap:8px}\
.kc-m{max-width:82%;padding:10px 14px;border-radius:18px;font-size:15px;line-height:1.4;word-wrap:break-word;animation:kc-pop .35s cubic-bezier(.34,1.56,.64,1) both}\
.kc-m a{color:#6B2A33;text-decoration:underline}\
.kc-bot{background:#fff;color:#14202E;align-self:flex-start;border-bottom-left-radius:4px;transform-origin:bottom left}\
.kc-me{background:#14202E;color:#fff;align-self:flex-end;border-bottom-right-radius:4px;transform-origin:bottom right}\
.kc-dots{display:inline-flex;gap:4px;padding:4px 0}\
.kc-dots i{width:7px;height:7px;background:#B08D57;border-radius:50%;animation:kc-dot 1.1s ease-in-out infinite}\
.kc-dots i:nth-child(2){animation-delay:.15s}\
.kc-dots i:nth-child(3){animation-delay:.3s}\
#kc-form{display:flex;border-top:1px solid #D9D8D3;background:#fff}\
#kc-in{flex:1;border:0;padding:14px;font-size:15px;font-family:inherit;outline:none}\
#kc-send{border:0;background:#B08D57;color:#fff;padding:0 18px;font-size:15px;cursor:pointer;font-family:inherit;transition:background .2s}\
#kc-send:hover{background:#14202E}\
@keyframes kc-bounce{0%,82%,100%{transform:translateY(0)}86%{transform:translateY(-12px)}90%{transform:translateY(0)}94%{transform:translateY(-6px)}}\
@keyframes kc-ring{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.7);opacity:0}}\
@keyframes kc-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}\
@keyframes kc-pop{0%{opacity:0;transform:scale(.6) translateY(8px)}100%{opacity:1;transform:none}}\
@keyframes kc-dot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-6px);opacity:1}}\
@media (prefers-reduced-motion:reduce){#kc-btn,#kc-btn::before,#kc-dot,.kc-m,.kc-dots i{animation:none!important}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var wrap = document.createElement("div");
  wrap.innerHTML =
    '<div id="kc-tip">Hi 👋 Need help choosing?</div>' +
    '<button id="kc-btn" aria-label="Open chat">💬<span id="kc-dot"></span></button>' +
    '<div id="kc-box" role="dialog" aria-label="Chat">' +
    '<div id="kc-head"><div>' + brand + ' Assistant<small>Typically replies instantly</small></div><button id="kc-x" aria-label="Close">×</button></div>' +
    '<div id="kc-msgs"></div>' +
    '<form id="kc-form"><input id="kc-in" placeholder="Type your message..." autocomplete="off"><button id="kc-send">Send</button></form>' +
    '</div>';
  document.body.appendChild(wrap);

  var box = document.getElementById("kc-box");
  var msgs = document.getElementById("kc-msgs");
  var input = document.getElementById("kc-in");

  function add(html, who) {
    var d = document.createElement("div");
    d.className = "kc-m " + (who === "me" ? "kc-me" : "kc-bot");
    if (who === "me") d.textContent = html; else d.innerHTML = html;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  var greeted = false;
  var btn = document.getElementById("kc-btn");
  var tip = document.getElementById("kc-tip");
  setTimeout(function () { if (!greeted) tip.classList.add("show"); }, 3000);
  setTimeout(function () { tip.classList.remove("show"); }, 12000);
  tip.onclick = function () { btn.click(); };
  btn.onclick = function () {
    tip.classList.remove("show");
    btn.classList.add("opened");
    box.classList.toggle("open");
    if (box.classList.contains("open")) {
      if (!greeted) { add("Hello! I'm the " + brand + " assistant. How can I help you today?"); greeted = true; }
      input.focus();
    }
  };
  document.getElementById("kc-x").onclick = function () { box.classList.remove("open"); };

  document.getElementById("kc-form").onsubmit = function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    add(text, "me");
    input.value = "";
    var typing = add('<span class="kc-dots"><i></i><i></i><i></i></span>');
    setTimeout(function () {
      typing.innerHTML = getReply(text);
      msgs.scrollTop = msgs.scrollHeight;
    }, 1100);
  };
})();
