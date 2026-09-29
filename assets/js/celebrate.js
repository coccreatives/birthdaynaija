/* BirthdayNaija — adaptive celebration submission.
   The form reads the signed-in user's plan + entitlements (window.BN_USER)
   and adapts: it never asks the visitor to pick a plan. Entitlements are
   validated when the form opens AND again on submit, then consumed. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  var USER = window.BN_USER, SUB = window.BN_SUB, PLANS = window.BN_PLANS, BENEFITS = window.BN_BENEFITS;
  var sub = USER && USER.subscription;
  var plan = sub && PLANS[sub.plan];
  var TODAY = new Date();

  var lock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  var check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  function money(n) { return "₦" + Number(n).toLocaleString("en-NG"); }
  function planLabelFor(featureKey) {
    // which plan first unlocks this boolean feature
    if (featureKey === "family_coverage") return "Family / Group";
    return "Club Member"; // dedicated slot & priority booking start at Club
  }

  /* ---------- Plan card (left) ---------- */
  function renderPlanCard() {
    var st = SUB.statusOf(sub, TODAY);
    var stMap = { active: ["Active", "ok"], expired: ["Expired", "bad"], used: ["Fully used", "muted"] };
    var s = stMap[st] || ["—", "muted"];
    var rows = BENEFITS.map(function (b) {
      var allowed = SUB.allowed(sub, b.key), used = SUB.used(sub, b.key), rem = SUB.remaining(sub, b.key, TODAY);
      var pct = allowed > 0 ? Math.min(100, Math.round(used / allowed * 100)) : 0;
      return '<div class="pc-ent"><div class="pc-ent__top"><span>' + esc(b.plural) + '</span>' +
        '<b>' + rem + ' left</b></div><div class="pc-bar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="pc-ent__sub">' + used + ' of ' + allowed + ' used</div></div>';
    }).join("");

    // perks the plan has, and what an upgrade would add
    var perks = [
      ["dedicated_wall_slot", "Dedicated wall slot"],
      ["priority_booking", "Priority booking"],
      ["family_coverage", "Family coverage"],
    ].map(function (p) {
      var on = plan[p[0]];
      return '<li class="pc-perk pc-perk--' + (on ? "on" : "off") + '">' + (on ? check : lock) +
        '<span>' + esc(p[1]) + (on ? "" : ' <em>' + esc(planLabelFor(p[0])) + '</em>') + '</span></li>';
    }).join("");

    $("[data-plan-card]").innerHTML =
      '<div class="pc">' +
        '<div class="pc__head"><span class="pc__name">' + esc(plan.name) + '</span>' +
          '<span class="pc__status pc__status--' + s[1] + '">' + s[0] + '</span></div>' +
        '<p class="pc__meta">' + (plan.billing_type === "one_time"
            ? "One-time purchase" : "Renews " + fmtDate(sub.expires_at)) + '</p>' +
        '<div class="pc__ents">' + rows + '</div>' +
        '<ul class="pc__perks">' + perks + '</ul>' +
      '</div>';
  }
  function fmtDate(d) { return d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""; }

  /* ---------- Gate (used / expired) ---------- */
  function showGate() {
    $("[data-form-wrap]").hidden = true;
    var st = SUB.statusOf(sub, TODAY);
    var g = $("[data-gate]"); g.hidden = false;
    var lockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    $("[data-gate-icon]").innerHTML = lockIcon;
    if (st === "used") {
      $("[data-gate-title]").textContent = "You've used your One Off entry.";
      $("[data-gate-text]").textContent = "Buy another One Off to celebrate one more person, or join the Club for a full year of celebrations.";
      $("[data-gate-actions]").innerHTML =
        '<a class="btn btn--grad" href="form.html?plan=oneoff">Purchase another One Off</a>' +
        '<a class="btn btn--grey" href="index.html#plans">Become a Club Member</a>';
    } else { // expired
      $("[data-gate-title]").textContent = "Your " + plan.name + " has expired.";
      $("[data-gate-text]").textContent = "Renew to bring back your wall slot, shoutouts and challenges for another year.";
      $("[data-gate-actions]").innerHTML =
        '<a class="btn btn--grad" href="form.html?plan=' + (sub.plan === "family" ? "group" : "club") + '">Renew membership</a>' +
        '<a class="btn btn--grey" href="index.html#plans">Choose another plan</a>';
    }
  }

  /* ---------- People selector (family plans) ---------- */
  var selectedPerson = null;
  function renderPeople() {
    if (!plan.family_coverage || !sub.family_members || !sub.family_members.length) {
      $("[data-people]").hidden = true; return;
    }
    $("[data-people]").hidden = false;
    $("[data-name-field]").hidden = true; // name comes from the chosen person
    var chips = sub.family_members.map(function (p, i) {
      return '<button type="button" class="cb-person" data-person="' + i + '">' +
        '<span class="cb-person__av">' + esc(p.name.split(/\s+/).slice(0,2).map(function(w){return w[0];}).join("").toUpperCase()) + '</span>' +
        '<span class="cb-person__meta"><b>' + esc(p.name) + '</b><em>' + esc(p.rel) + '</em></span></button>';
    }).join("");
    chips += '<button type="button" class="cb-person cb-person--other" data-person="other">' +
      '<span class="cb-person__av">+</span><span class="cb-person__meta"><b>Someone else</b><em>Add a name</em></span></button>';
    $("[data-people]").innerHTML = chips;
    $$("[data-person]").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("[data-person]").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        var v = b.getAttribute("data-person");
        if (v === "other") { selectedPerson = null; $("[data-name-field]").hidden = false; $("#cb-name").focus(); }
        else { selectedPerson = sub.family_members[+v]; $("[data-name-field]").hidden = true; }
      });
    });
  }

  /* ---------- Add-ons (shoutout / challenge) ---------- */
  var ADDONS = [
    { key: "shoutouts", label: "Add a shoutout", desc: "A personal shoutout published with the entry." },
    { key: "challenges", label: "Add a challenge", desc: "Set a fun birthday challenge for the celebrant." },
  ];
  function renderAddons() {
    $("[data-addons]").innerHTML = ADDONS.map(function (a) {
      var allowed = SUB.allowed(sub, a.key), rem = SUB.remaining(sub, a.key, TODAY);
      if (allowed === 0) {
        // plan doesn't grant this at all → locked upgrade prompt
        return '<div class="cb-addon cb-addon--locked">' + lock +
          '<div class="cb-addon__meta"><b>' + esc(a.label) + '</b><em>Not in your plan — upgrade to add this</em></div></div>';
      }
      var out = rem === 0;
      return '<label class="cb-addon' + (out ? " cb-addon--out" : "") + '">' +
        '<input type="checkbox" data-addon="' + a.key + '"' + (out ? " disabled" : "") + '>' +
        '<div class="cb-addon__meta"><b>' + esc(a.label) + '</b>' +
        '<em>' + (out ? "None left this year" : rem + " of " + allowed + " left") + '</em></div></label>';
    }).join("");
  }

  /* ---------- Submit ---------- */
  function toast(m) { var t = $("[data-toast]"); if (!t) return; t.textContent = m; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 3200); }

  function bootForm() {
    $("[data-form-lead]").textContent = plan.family_coverage
      ? "Pick who you're celebrating, add your message, and choose any extras your plan includes."
      : "Add your message and a photo. Your " + plan.name + " plan decides what you can send.";
    renderPeople();
    renderAddons();
    $("[data-foot-note]").textContent = "1 Birthday Wall entry will be used from your plan.";

    var msg = $("#cb-msg");
    $("[data-celebrate-form]").addEventListener("submit", function (e) {
      e.preventDefault();

      // Validate entitlement AGAIN at submit time (not only on open)
      if (!SUB.canSubmit(sub, "birthday_wall_entries", TODAY)) { showGate(); return; }

      var ok = true;
      var nameVal = selectedPerson ? selectedPerson.name : $("#cb-name").value.trim();
      if (!$("[data-name-field]").hidden && !nameVal) { flag("#cb-name"); ok = false; }
      if (!nameVal) ok = false;
      if (!$("#cb-dob").value) { flag("#cb-dob"); ok = false; }
      if (!msg.value.trim()) { flag("#cb-msg"); ok = false; }
      if (!$("#cb-consent").checked) { toast("Please confirm the consent box."); ok = false; }
      if (!ok) return;

      // Which add-ons were chosen, and are they still available?
      var addons = $$("[data-addon]:checked").map(function (c) { return c.getAttribute("data-addon"); });
      for (var i = 0; i < addons.length; i++) {
        if (!SUB.canSubmit(sub, addons[i], TODAY)) { toast("You've run out of that add-on."); renderAddons(); return; }
      }

      // Consume entitlements
      SUB.consume(sub, "birthday_wall_entries");
      addons.forEach(function (k) { SUB.consume(sub, k); });

      // Success
      $("[data-form-wrap]").hidden = true;
      var d = $("[data-done]"); d.hidden = false;
      var extras = addons.length ? " with " + addons.map(function (k) { return k === "shoutouts" ? "a shoutout" : "a challenge"; }).join(" and ") : "";
      $("[data-done-text]").textContent = "Your birthday wish for " + nameVal + extras +
        " is in review and will appear on the Wall once approved. " +
        SUB.remaining(sub, "birthday_wall_entries", TODAY) + " Wall entries left on your plan.";
      renderPlanCard(); // reflect the decremented counts
    });

    $("[data-another]").addEventListener("click", function () {
      if (!SUB.canSubmit(sub, "birthday_wall_entries", TODAY)) { $("[data-done]").hidden = true; showGate(); return; }
      $("[data-celebrate-form]").reset();
      selectedPerson = null;
      $$("[data-person]").forEach(function (x) { x.classList.remove("is-on"); });
      renderAddons();
      $("[data-done]").hidden = true; $("[data-form-wrap]").hidden = false;
    });
  }
  function flag(sel) { var el = $(sel); if (el) el.closest(".cb-field").classList.add("has-error"); }
  document.addEventListener("input", function (e) {
    var f = e.target.closest && e.target.closest(".cb-field.has-error"); if (f) f.classList.remove("has-error");
  });

  /* ---------- Boot ---------- */
  function init() {
    if (!USER || !USER.signedIn || !sub || !plan) {
      // not signed in → send to login (real gate wired at backend time)
      location.href = "login.html?next=celebrate.html";
      return;
    }
    renderPlanCard();
    var st = SUB.statusOf(sub, TODAY);
    // No valid Wall entitlement (expired, or One Off fully used) → gate instead of form
    if (st === "expired" || !SUB.canSubmit(sub, "birthday_wall_entries", TODAY)) { showGate(); return; }
    bootForm();
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
