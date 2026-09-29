/* ============================================================
   BirthdayNaija — Plan entitlements (website copy)
   Mirrors the admin entitlements.js. At backend time BOTH read the
   same values from the API; keep them in sync until then.
   ============================================================ */
(function () {
  "use strict";

  window.BN_PLANS = {
    one_off: {
      key: "one_off", name: "One Off", price: 500, billing_type: "one_time", duration_months: null,
      entitlements: { birthday_wall_entries: 1, shoutouts: 1, challenges: 1 },
      dedicated_wall_slot: false, priority_booking: false, family_coverage: false, max_family_members: 0,
    },
    club: {
      key: "club", name: "Club Member", price: 15000, billing_type: "annual", duration_months: 12,
      entitlements: { birthday_wall_entries: 12, shoutouts: 12, challenges: 12 },
      dedicated_wall_slot: true, priority_booking: true, family_coverage: false, max_family_members: 0,
    },
    family: {
      key: "family", name: "Family / Group", price: 45000, billing_type: "annual", duration_months: 12,
      entitlements: { birthday_wall_entries: 24, shoutouts: 24, challenges: 24 },
      dedicated_wall_slot: true, priority_booking: true, family_coverage: true, max_family_members: 6,
    },
  };

  window.BN_BENEFITS = [
    { key: "birthday_wall_entries", label: "Birthday Wall entry", plural: "Birthday Wall entries" },
    { key: "shoutouts", label: "Shoutout", plural: "Shoutouts" },
    { key: "challenges", label: "Challenge", plural: "Challenges" },
  ];

  window.BN_SUB = {
    plan: function (k) { return window.BN_PLANS[k] || null; },
    statusOf: function (sub, today) {
      var p = this.plan(sub.plan); if (!p) return "expired";
      today = today || new Date();
      if (p.billing_type === "one_time") {
        var done = Object.keys(p.entitlements).every(function (k) {
          return (sub.usage && sub.usage[k] || 0) >= p.entitlements[k]; });
        return done ? "used" : "active";
      }
      if (sub.expires_at && new Date(sub.expires_at + "T00:00:00") < today) return "expired";
      return "active";
    },
    allowed: function (sub, k) { var p = this.plan(sub.plan); return p ? (p.entitlements[k] || 0) : 0; },
    used: function (sub, k) { return (sub.usage && sub.usage[k]) || 0; },
    remaining: function (sub, k, today) {
      if (this.statusOf(sub, today) === "expired") return 0;
      return Math.max(0, this.allowed(sub, k) - this.used(sub, k));
    },
    canSubmit: function (sub, k, today) {
      return this.statusOf(sub, today) !== "expired" && this.remaining(sub, k, today) > 0;
    },
    consume: function (sub, k) { // decrement after a successful submission
      sub.usage = sub.usage || {}; sub.usage[k] = (sub.usage[k] || 0) + 1; return sub;
    },
  };

  /* ---------- DEMO active session ----------
     Replace this whole object with the real signed-in user's subscription
     at backend time. The form reads ONLY from here — it never asks the
     visitor to pick a plan. Swap `plan` to one_off / club / family (and the
     usage / expiry) to preview each state. */
  window.BN_USER = window.BN_USER || {
    signedIn: true,
    name: "Grace Okafor",
    email: "grace@example.com",
    subscription: {
      plan: "family",
      started_at: "2025-10-05",
      expires_at: "2026-10-05",
      usage: { birthday_wall_entries: 8, shoutouts: 5, challenges: 2 },
      family_members: [
        { name: "Grace Okafor", rel: "You" },
        { name: "Peter Okafor", rel: "Spouse" },
        { name: "Chidi Okafor", rel: "Son" },
        { name: "Amara Okafor", rel: "Daughter" },
      ],
    },
  };
})();
