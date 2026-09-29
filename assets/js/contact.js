/* Contact — a message OR a support ticket. At backend time, "ticket" posts to the
   admin Help & Support queue; "message" emails the team. The form validates and
   shows a confirmation; no data leaves the page until the API is wired. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var mode = "message";
  var form = $("[data-contact-form]");

  function setMode(m) {
    mode = m;
    $$("[data-mode]").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-mode") === m); });
    $("[data-ticket-fields]").hidden = m !== "ticket";
    $("[data-subject-label]").textContent = m === "ticket" ? "Summary of the problem" : "Subject";
    $("[data-msg-label]").textContent = m === "ticket" ? "What happened?" : "Message";
    $("#ct-subject").placeholder = m === "ticket" ? "e.g. Paid but my shoutout never appeared" : "How can we help?";
    $("#ct-msg").placeholder = m === "ticket" ? "Tell us what went wrong, and what you expected to happen…" : "Tell us what's happening…";
    $("[data-submit]").textContent = m === "ticket" ? "Open support ticket" : "Send message";
    $("[data-foot-note]").textContent = m === "ticket"
      ? "You'll get a ticket number by email, and our team will follow up there."
      : "We usually reply within one working day.";
  }
  $$("[data-mode]").forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); }); });

  function toast(msg) { var t = $("[data-toast]"); if (!t) return; t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 3200); }

  function flag(sel, bad) { var el = $(sel); if (!el) return; el.closest(".ct-field").classList.toggle("has-error", bad); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    var email = $("#ct-email").value.trim();
    var checks = [
      ["#ct-name", !$("#ct-name").value.trim()],
      ["#ct-email", !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)],
      ["#ct-subject", !$("#ct-subject").value.trim()],
      ["#ct-msg", !$("#ct-msg").value.trim()],
    ];
    checks.forEach(function (c) { flag(c[0], c[1]); if (c[1]) ok = false; });
    if (!ok) return;

    form.hidden = true;
    var d = $("[data-done]"); d.hidden = false;
    if (mode === "ticket") {
      var ref = "TKT-" + (1000 + Math.floor(Math.random() * 9000));
      $("[data-done-mark]").textContent = "🎫";
      $("[data-done-title]").textContent = "Ticket opened";
      $("[data-done-text]").textContent = "Your ticket " + ref + " is with our support team. We've emailed a copy to " +
        email + " and you'll get updates there until it's resolved.";
    } else {
      $("[data-done-mark]").textContent = "✅";
      $("[data-done-title]").textContent = "Message sent";
      $("[data-done-text]").textContent = "Thanks — your message is on its way to the BirthdayNaija team. We'll reply to " +
        email + " within one working day.";
    }
  });

  $("[data-another]").addEventListener("click", function () {
    form.reset(); $$(".ct-field.has-error").forEach(function (f) { f.classList.remove("has-error"); });
    $("[data-done]").hidden = true; form.hidden = false; setMode(mode);
  });

  document.addEventListener("input", function (e) {
    var f = e.target.closest && e.target.closest(".ct-field.has-error"); if (f) f.classList.remove("has-error");
  });

  // Open straight into ticket mode via ?problem or #ticket (e.g. from an order email)
  if (/[?#].*(problem|ticket)/i.test(location.href)) setMode("ticket");
})();
