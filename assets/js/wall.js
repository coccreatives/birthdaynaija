/* BirthdayNaija — Birthday Wall (public feed). UI/demo; wired to real feed at backend time.
   Gate: browsing is open; posting requires sign-in + subscription (demo flags below). */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  /* ---- Demo auth/subscription flags (replace with real session at backend time) ---- */
  var USER = { signedIn: false, subscribed: false };

  /* ---- Demo data: photo + name + turning + message + date range ---- */
  var IMG = function (n) { return "assets/img/wall-" + n + ".webp"; };
  var PEOPLE = [
    { name: "Chinedu Okafor", age: 34, img: IMG(1), range: "today", date: "Today", msg: "To Chinedu, a big brother whose laughter fills every room. Have the happiest day.", featured: true, likes: 42 },
    { name: "Zainab Bello", age: 29, img: IMG(2), range: "today", date: "Today", msg: "Bright, kind and unstoppable. Wishing you a year as beautiful as your smile.", likes: 18 },
    { name: "Ifeanyi Nwosu", age: 41, img: IMG(3), range: "today", date: "Today", msg: "Happy birthday to a man who shows up for everyone. Today we show up for you.", likes: 27 },
    { name: "Nneoma Nwosu", age: 51, img: IMG(4), range: "today", date: "Today", msg: "Mummy, thank you for every sacrifice. Enjoy your special day.", likes: 63 },
    { name: "Amara Eze", age: 26, img: IMG(5), range: "week", date: "Wed", msg: "Best friend, twin soul — may this year bring you everything you dream of.", likes: 12 },
    { name: "Oluwafemi Ajayi", age: 37, img: IMG(6), range: "week", date: "Thu", msg: "Calm, wise and generous. Cheers to another trip around the sun, boss.", likes: 9 },
    { name: "Musa Abdullahi", age: 52, img: IMG(7), range: "week", date: "Fri", msg: "A father, a mentor, a friend. May Allah bless your new year abundantly.", likes: 31 },
    { name: "Eniola Bankole", age: 71, img: IMG(8), range: "week", date: "Sat", msg: "Grandma at 71 and still the life of every party. We love you endlessly.", featured: true, likes: 88 },
    { name: "Amara Eze", age: 26, img: IMG(1), range: "month", date: "Sep 14", msg: "Wishing my sister joy, peace and plenty of jollof this year.", likes: 5 },
    { name: "Oluwafemi Ajayi", age: 37, img: IMG(2), range: "month", date: "Sep 9", msg: "To a true gentleman. Have a wonderful birthday.", likes: 7 },
    { name: "Musa Abdullahi", age: 52, img: IMG(3), range: "month", date: "Sep 3", msg: "Happy birthday, uncle. Your kindness is a blessing to us all.", likes: 14 },
    { name: "Eniola Bankole", age: 71, img: IMG(4), range: "month", date: "Sep 1", msg: "Seven decades of grace. Long life and good health, Mama.", likes: 22 }
  ];

  var state = { range: "today", q: "", shown: 8, liked: {}, saved: {} };

  var grid = $("[data-grid]"), emptyBox = $("[data-empty]"), moreWrap = $("[data-more]");

  function heart(filled) {
    return '<svg viewBox="0 0 24 24" fill="' + (filled ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.5 1-1a5.5 5.5 0 0 0 0-7.9z"/></svg>';
  }
  var shareIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4M12 2v13"/></svg>';
  var bookmark = function (f) { return '<svg viewBox="0 0 24 24" fill="' + (f ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'; };

  function filtered() {
    return PEOPLE.filter(function (p, i) {
      p._id = i;
      if (state.range !== "all" && p.range !== state.range) {
        // week includes today; month includes today+week
        if (state.range === "week" && p.range === "today") { /* keep */ }
        else if (state.range === "month" && (p.range === "today" || p.range === "week")) { /* keep */ }
        else return false;
      }
      if (state.q) { if (p.name.toLowerCase().indexOf(state.q.toLowerCase()) === -1) return false; }
      return true;
    });
  }

  function card(p) {
    var liked = !!state.liked[p._id], saved = !!state.saved[p._id];
    return '<article class="bcard' + (p.featured ? " bcard--featured" : "") + '" data-open="' + p._id + '">' +
      '<div class="bcard__media">' +
        '<img src="' + p.img + '" alt="' + esc(p.name) + '" loading="lazy">' +
        '<button class="bcard__badge' + (saved ? " is-saved" : "") + '" data-save="' + p._id + '" aria-label="Save">' + bookmark(saved) + '</button>' +
      '</div>' +
      '<div class="bcard__body">' +
        '<p class="bcard__name">' + esc(p.name) + ', turning ' + p.age + ' 🎉</p>' +
        '<p class="bcard__msg">' + esc(p.msg) + '</p>' +
      '</div>' +
      '<div class="bcard__foot">' +
        '<button class="bcard__act' + (liked ? " is-liked" : "") + '" data-like="' + p._id + '">' + heart(liked) + '<span>' + (p.likes + (liked ? 1 : 0)) + '</span></button>' +
        '<button class="bcard__act" data-share="' + p._id + '">' + shareIcon + '</button>' +
        '<span class="bcard__date">' + esc(p.date) + '</span>' +
      '</div>' +
    '</article>';
  }

  function render() {
    var rows = filtered();
    if (rows.length === 0) {
      grid.innerHTML = ""; emptyBox.classList.add("show"); moreWrap.hidden = true; return;
    }
    emptyBox.classList.remove("show");
    var slice = rows.slice(0, state.shown);
    grid.innerHTML = slice.map(card).join("");
    moreWrap.hidden = rows.length <= state.shown;
  }

  /* ---- Filter tabs ---- */
  $$("[data-range]").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("[data-range]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      state.range = b.getAttribute("data-range"); state.shown = 8; render();
    });
  });
  $("[data-search]").addEventListener("input", function (e) { state.q = e.target.value; state.shown = 8; render(); });
  $("[data-more-btn]").addEventListener("click", function () { state.shown += 8; render(); });

  // Date pick — demo stub (real calendar wired later)
  $("[data-datepick]").addEventListener("click", function () { toast("Date picker opens here — pick any day to see who's celebrated."); });

  /* ---- Card interactions ---- */
  grid.addEventListener("click", function (e) {
    var like = e.target.closest("[data-like]");
    var share = e.target.closest("[data-share]");
    var save = e.target.closest("[data-save]");
    var open = e.target.closest("[data-open]");
    if (like) { e.stopPropagation(); var id = +like.getAttribute("data-like"); state.liked[id] = !state.liked[id]; render(); return; }
    if (save) { e.stopPropagation(); var sid = +save.getAttribute("data-save"); state.saved[sid] = !state.saved[sid]; render();
      toast(state.saved[sid] ? "Saved to your list." : "Removed from saved."); return; }
    if (share) { e.stopPropagation(); var p = PEOPLE[+share.getAttribute("data-share")];
      var url = location.origin + location.pathname + "?wish=" + encodeURIComponent(p.name);
      if (navigator.share) { navigator.share({ title: "Happy Birthday " + p.name, text: p.msg, url: url }).catch(function(){}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(url); toast("Link copied — share the love 🎉"); }
      else { toast("Share: " + url); } return; }
    if (open) { toast("Opening " + PEOPLE[+open.getAttribute("data-open")].name + "'s wish…"); }
  });

  /* ---- Post gate: browse open, posting needs sign-in + subscription ---- */
  function openModal(name) { var m = $('[data-modal="' + name + '"]'); if (m) { m.classList.add("show"); document.body.style.overflow = "hidden"; } }
  function closeModals() { $$(".wmodal, .wconfirm").forEach(function (m) { m.classList.remove("show"); }); document.body.style.overflow = ""; }
  $$("[data-post-open]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!USER.signedIn) return openModal("gate-auth");
      if (!USER.subscribed) return openModal("gate-sub");
      openModal("post");
    });
  });
  $$("[data-modal-close]").forEach(function (b) { b.addEventListener("click", closeModals); });
  document.addEventListener("mousedown", function (e) {
    if (e.target.classList && (e.target.classList.contains("wmodal") || e.target.classList.contains("wconfirm"))) closeModals();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModals(); });

  /* ---- Post form ---- */
  var msg = $("#w-msg"), count = $("[data-count]");
  if (msg) msg.addEventListener("input", function () { count.textContent = msg.value.length + " / 500"; });
  var file = $("#w-file");
  if (file) file.addEventListener("change", function () { if (file.files[0]) toast("Attached: " + file.files[0].name); });

  var submit = $("[data-post-submit]");
  if (submit) submit.addEventListener("click", function () {
    var form = $("[data-post-form]"), ok = true;
    [["#w-msg"], ["#w-name"], ["#w-dob"], ["#w-sender"], ["#w-email", /^[^@\s]+@[^@\s]+\.[^@\s]+$/]].forEach(function (f) {
      var el = $(f[0]); if (!el) return;
      var bad = !el.value.trim() || (f[1] && !f[1].test(el.value));
      el.closest(".wfield").classList.toggle("has-error", bad); if (bad) ok = false;
    });
    if (!$("#w-consent").checked) { ok = false; toast("Please confirm the consent checkbox."); }
    if (!ok) return;
    closeModals();
    toast("Posted! Your wish is in review and will appear on the wall soon. 🎉");
  });

  /* ---- Toast ---- */
  var toastEl = $("[data-toast]"), toastT;
  function toast(m) { if (!toastEl) return; toastEl.textContent = m; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 3000); }
  window.BNWallToast = toast;

  render();
})();
