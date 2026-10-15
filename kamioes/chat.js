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
      return "Our ready-to-wear pieces are on the <a href='ready-to-wear.html'>Ready-to-Wear page</a>. Tap any piece to order on WhatsApp.";
    if (has("price", "cost", "how much", "pay"))
      return "Prices depend on the style and fabric. Ready-to-wear prices are listed on each piece, and bespoke is quoted after a short chat. <a href='" + wa + "' target='_blank'>Message us on WhatsApp</a> for a quote.";
    if (has("where", "location", "address", "located", "visit", "studio"))
      return "We are at " + (S.address || "Abuja, Nigeria") + ".";
    if (has("deliver", "ship", "shipping"))
      return "Yes, we deliver. Delivery time and cost depend on your location. <a href='" + wa + "' target='_blank'>Ask us on WhatsApp</a> for the exact details.";
    if (has("book", "appointment", "fitting", "consult"))
      return "You can book a fitting here: <a href='book.html'>Book an appointment</a>.";
    if (has("how long", "time", "ready by", "turnaround", "days", "weeks"))
      return "Bespoke pieces usually take a couple of weeks depending on the design. For a rush order, <a href='" + wa + "' target='_blank'>talk to us on WhatsApp</a>.";
    if (has("contact", "phone", "whatsapp", "call", "email", "reach"))
      return "Reach us on <a href='" + wa + "' target='_blank'>WhatsApp</a>" + (S.email ? " or email " + S.email : "") + ".";
    if (has("thank"))
      return "You're welcome! Anything else I can help with?";
    return "Thanks for your message! I can help with bespoke, ready-to-wear, prices, delivery and booking. For anything else, <a href='" + wa + "' target='_blank'>chat with the team on WhatsApp</a>.";
  }
  // -------------------------------------------------------------------------

  var css = "\
#kc-btn{position:fixed;right:20px;bottom:20px;width:58px;height:58px;border-radius:50%;border:0;background:#14202E;color:#fff;font-size:26px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);z-index:9998}\
#kc-btn:hover{background:#B08D57}\
#kc-box{position:fixed;right:20px;bottom:90px;width:340px;max-width:calc(100vw - 40px);height:460px;max-height:calc(100vh - 120px);background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;z-index:9999;font-family:'Jost','Helvetica Neue',Arial,sans-serif}\
#kc-box.open{display:flex}\
#kc-head{background:#14202E;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;font-size:16px}\
#kc-head small{display:block;color:#B08D57;font-size:12px}\
#kc-x{background:none;border:0;color:#fff;font-size:22px;cursor:pointer}\
#kc-msgs{flex:1;overflow-y:auto;padding:14px;background:#F5F4F1;display:flex;flex-direction:column;gap:8px}\
.kc-m{max-width:82%;padding:9px 12px;border-radius:12px;font-size:15px;line-height:1.4;word-wrap:break-word}\
.kc-m a{color:#6B2A33;text-decoration:underline}\
.kc-bot{background:#fff;color:#14202E;align-self:flex-start;border-bottom-left-radius:3px}\
.kc-me{background:#14202E;color:#fff;align-self:flex-end;border-bottom-right-radius:3px}\
#kc-form{display:flex;border-top:1px solid #D9D8D3;background:#fff}\
#kc-in{flex:1;border:0;padding:14px;font-size:15px;font-family:inherit;outline:none}\
#kc-send{border:0;background:#B08D57;color:#fff;padding:0 18px;font-size:15px;cursor:pointer;font-family:inherit}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var wrap = document.createElement("div");
  wrap.innerHTML =
    '<button id="kc-btn" aria-label="Open chat">💬</button>' +
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
  document.getElementById("kc-btn").onclick = function () {
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
    var typing = add("…");
    setTimeout(function () {
      typing.innerHTML = getReply(text);
      msgs.scrollTop = msgs.scrollHeight;
    }, 600);
  };
})();