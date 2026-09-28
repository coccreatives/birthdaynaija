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

  var state = { range: "today", q: "", shown: 8, liked: {}, sort: "recent" };

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
    }).sort(function (a, b) {
      if (state.sort === "loved") return b.likes - a.likes;
      if (state.sort === "az") return a.name.localeCompare(b.name);
      return 0; // recent = source order
    });
  }

  function card(p) {
    var liked = !!state.liked[p._id];
    var feat = p.featured ? '<span class="bcard__feat">★ FEATURED</span>' : '';
    return '<article class="bcard" data-open="' + p._id + '">' +
      '<div class="bcard__media">' +
        '<img src="' + p.img + '" alt="' + esc(p.name) + '" loading="lazy">' + feat +
      '</div>' +
      '<div class="bcard__body">' +
        '<p class="bcard__name">' + esc(p.name) + ', turning ' + p.age + ' 🎉</p>' +
        '<p class="bcard__msg">' + esc(p.msg) + '</p>' +
      '</div>' +
      '<div class="bcard__foot">' +
        '<button class="bcard__act' + (liked ? " is-liked" : "") + '" data-like="' + p._id + '">' + heart(liked) + '<span>' + (p.likes + (liked ? 1 : 0)) + '</span></button>' +
        '<button class="bcard__act" data-share="' + p._id + '">' + shareIcon + '<span>Share</span></button>' +
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

  /* ---- Range calendar (Figma 6:17104): two months, presets, start–end range ---- */
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var calWrap = $(".wallbar__pickwrap"), calBox = $("[data-calendar]"),
      grid1 = $("[data-cal-grid-1]"), grid2 = $("[data-cal-grid-2]"),
      lbl1 = $("[data-cal-label-1]"), lbl2 = $("[data-cal-label-2]"),
      dateLabel = $("[data-datelabel]"), pickBtn = $("[data-datepick]"),
      startInp = $("[data-cal-start]"), endInp = $("[data-cal-end]");
  var today = new Date(2026, 8, 28); // demo "today" (Sep 28, 2026)
  var view = new Date(today.getFullYear(), today.getMonth(), 1);  // left month
  var rStart = new Date(today), rEnd = new Date(today);           // committed range
  var pStart = new Date(today), pEnd = new Date(today);           // pending (in-picker) range

  function fmt(d) { return d ? MONTHS[d.getMonth()].slice(0,3) + " " + d.getDate() + ", " + d.getFullYear() : "—"; }
  function key(d) { return d.getFullYear()*10000 + d.getMonth()*100 + d.getDate(); }
  function sameDay(a, b) { return a && b && key(a)===key(b); }
  function inRange(d) { if (!pStart || !pEnd) return false; var k=key(d); var a=Math.min(key(pStart),key(pEnd)), b=Math.max(key(pStart),key(pEnd)); return k>=a && k<=b; }

  function monthHTML(base, grid) {
    // Monday-first grid
    var y=base.getFullYear(), m=base.getMonth();
    var first = (new Date(y, m, 1).getDay() + 6) % 7;
    var days = new Date(y, m+1, 0).getDate();
    var prevDays = new Date(y, m, 0).getDate();
    var html="";
    for (var i=first-1;i>=0;i--) html += '<button class="wcal__day is-out" tabindex="-1">'+(prevDays-i)+'</button>';
    for (var d=1;d<=days;d++) {
      var cur=new Date(y,m,d);
      var isS=sameDay(cur,pStart), isE=sameDay(cur,pEnd), rng=inRange(cur);
      var cls="wcal__day"+(sameDay(cur,today)?" is-today":"")+(rng?" is-inrange":"")+((isS||isE)?" is-end":"");
      html += '<button class="'+cls+'" data-pick="'+y+'-'+m+'-'+d+'">'+d+'</button>';
    }
    var trail = (7 - ((first+days)%7)) % 7;
    for (var t=1;t<=trail;t++) html += '<button class="wcal__day is-out" tabindex="-1">'+t+'</button>';
    grid.innerHTML = html;
  }
  function buildCal() {
    var next = new Date(view.getFullYear(), view.getMonth()+1, 1);
    lbl1.textContent = MONTHS[view.getMonth()] + " " + view.getFullYear();
    lbl2.textContent = MONTHS[next.getMonth()] + " " + next.getFullYear();
    monthHTML(view, grid1); monthHTML(next, grid2);
    startInp.textContent = fmt(pStart); endInp.textContent = fmt(pEnd);
  }
  function openCal(o) { if (!calBox) return; calBox.hidden=!o; calWrap.classList.toggle("is-open",o);
    if (pickBtn) pickBtn.setAttribute("aria-expanded", o?"true":"false");
    if (o) { pStart=new Date(rStart); pEnd=new Date(rEnd); view=new Date(rStart.getFullYear(), rStart.getMonth(), 1); buildCal(); } }

  if (pickBtn) pickBtn.addEventListener("click", function (e) { e.stopPropagation(); openCal(calBox.hidden); });

  function onPick(e) {
    var b=e.target.closest("[data-pick]"); if(!b) return;
    var p=b.getAttribute("data-pick").split("-"); var d=new Date(+p[0],+p[1],+p[2]);
    if (!pStart || (pStart && pEnd)) { pStart=d; pEnd=null; }        // begin new range
    else { if (key(d) < key(pStart)) { pEnd=pStart; pStart=d; } else pEnd=d; } // complete range
    buildCal();
  }
  if (grid1) grid1.addEventListener("click", onPick);
  if (grid2) grid2.addEventListener("click", onPick);

  $("[data-cal-prev]").addEventListener("click", function (e){ e.stopPropagation(); view.setMonth(view.getMonth()-1); buildCal(); });
  $("[data-cal-next]").addEventListener("click", function (e){ e.stopPropagation(); view.setMonth(view.getMonth()+1); buildCal(); });

  // Presets
  function startOfWeek(d){ var x=new Date(d); var day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); return x; }
  var presetBox = $("[data-cal-presets]");
  if (presetBox) presetBox.addEventListener("click", function (e) {
    var b=e.target.closest("[data-preset]"); if(!b) return;
    $$("[data-preset]", presetBox).forEach(function(x){ x.classList.toggle("is-active", x===b); });
    var p=b.getAttribute("data-preset"), s=new Date(today), en=new Date(today);
    if (p==="yesterday"){ s.setDate(s.getDate()-1); en=new Date(s); }
    else if (p==="week"){ s=startOfWeek(today); en=new Date(s); en.setDate(en.getDate()+6); }
    else if (p==="lastweek"){ s=startOfWeek(today); s.setDate(s.getDate()-7); en=new Date(s); en.setDate(en.getDate()+6); }
    else if (p==="month"){ s=new Date(today.getFullYear(),today.getMonth(),1); en=new Date(today.getFullYear(),today.getMonth()+1,0); }
    else if (p==="lastmonth"){ s=new Date(today.getFullYear(),today.getMonth()-1,1); en=new Date(today.getFullYear(),today.getMonth(),0); }
    else if (p==="year"){ s=new Date(today.getFullYear(),0,1); en=new Date(today.getFullYear(),11,31); }
    else if (p==="lastyear"){ s=new Date(today.getFullYear()-1,0,1); en=new Date(today.getFullYear()-1,11,31); }
    else if (p==="all"){ s=new Date(2020,0,1); en=new Date(today); }
    pStart=s; pEnd=en; view=new Date(s.getFullYear(), s.getMonth(), 1); buildCal();
  });

  $("[data-cal-cancel]").addEventListener("click", function (e){ e.stopPropagation(); openCal(false); });
  $("[data-cal-apply]").addEventListener("click", function (e){
    e.stopPropagation();
    if (!pStart) return;
    rStart=new Date(pStart); rEnd=new Date(pEnd||pStart);
    dateLabel.textContent = sameDay(rStart,rEnd) ? fmt(rStart) : fmt(rStart)+" – "+fmt(rEnd);
    openCal(false);
    toast(sameDay(rStart,rEnd) ? "Showing birthdays for "+fmt(rStart)+"." : "Showing "+fmt(rStart)+" – "+fmt(rEnd)+".");
  });

  /* ---- Filter By dropdown ---- */
  var filterWrap = $(".wallbar__filterwrap"), filterMenu = $("[data-filtermenu]"),
      filterBtn = $("[data-filterby]"), filterLabel = $("[data-filterlabel]");
  var SORT_NAMES = { recent: "Most recent", loved: "Most loved", az: "Name (A–Z)" };
  function openFilter(o) { if (!filterMenu) return; filterMenu.hidden = !o; filterWrap.classList.toggle("is-open", o);
    if (filterBtn) filterBtn.setAttribute("aria-expanded", o ? "true" : "false"); }
  if (filterBtn) filterBtn.addEventListener("click", function (e) { e.stopPropagation(); openFilter(filterMenu.hidden); });
  if (filterMenu) filterMenu.addEventListener("click", function (e) {
    var b = e.target.closest("[data-sort]"); if (!b) return;
    state.sort = b.getAttribute("data-sort");
    $$("[data-sort]", filterMenu).forEach(function (x) { x.classList.toggle("is-active", x === b); });
    filterLabel.textContent = SORT_NAMES[state.sort]; openFilter(false); state.shown = 8; render();
  });

  document.addEventListener("click", function () { openCal(false); openFilter(false); });

  /* ---- Card interactions ---- */
  grid.addEventListener("click", function (e) {
    var like = e.target.closest("[data-like]");
    var share = e.target.closest("[data-share]");
    var open = e.target.closest("[data-open]");
    if (like) { e.stopPropagation(); var id = +like.getAttribute("data-like"); state.liked[id] = !state.liked[id]; render(); return; }
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
      // Not signed in → show the "Sign in to post" modal (Figma 9:2029 / 9:2094).
      if (!USER.signedIn) { openModal("signin"); return; }
      // Signed in but no plan → send to pricing (homepage #plans is the paywall reference).
      if (!USER.subscribed) { location.href = "index.html#plans"; return; }
      openModal("post");
    });
  });

  /* Password eye toggle inside the sign-in modal */
  $$("[data-eye]").forEach(function (b) {
    b.addEventListener("click", function () {
      var inp = b.parentNode.querySelector("input");
      if (!inp) return;
      inp.type = inp.type === "password" ? "text" : "password";
      b.classList.toggle("is-on", inp.type === "text");
    });
  });

  /* Sign-in modal submit (demo: mark signed in, then continue toward posting) */
  var signinForm = $("[data-signin-form]");
  if (signinForm) signinForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("#si-email"), pw = $("#si-pw"), ok = true;
    [[email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/], [pw, null]].forEach(function (f) {
      var bad = !f[0].value.trim() || (f[1] && !f[1].test(f[0].value));
      f[0].closest(".wfield").classList.toggle("has-error", bad); if (bad) ok = false;
    });
    if (!ok) return;
    USER.signedIn = true; closeModals();
    // Continue the original intent: post if subscribed, else pricing.
    if (!USER.subscribed) { location.href = "index.html#plans"; return; }
    openModal("post");
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
