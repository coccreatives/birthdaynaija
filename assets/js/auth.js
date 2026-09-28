/* BirthdayNaija — Auth pages behaviour (UI-only; backend wired later). */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';

  function toast(msg) {
    var t = $(".auth-toast");
    if (!t) { t = document.createElement("div"); t.className = "auth-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 3000);
  }
  window.BNToast = toast;

  /* Password show/hide */
  $$("[data-eye]").forEach(function (btn) {
    btn.innerHTML = EYE_OFF;
    btn.addEventListener("click", function () {
      var input = btn.parentNode.querySelector("input");
      if (!input) return;
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.innerHTML = show ? EYE : EYE_OFF;
    });
  });

  function markError(field, on) { field.classList.toggle("has-error", !!on); }
  var isEmail = function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); };

  /* Generic form validation via data-validate on the form */
  $$("[data-auth-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$(".auth-field", form).forEach(function (field) {
        var input = field.querySelector("input");
        if (!input || !input.hasAttribute("required")) return;
        var v = input.value.trim();
        var bad = !v || (input.type === "email" && !isEmail(v)) ||
                  (input.getAttribute("data-min") && v.length < +input.getAttribute("data-min"));
        // confirm-password match
        if (input.hasAttribute("data-match")) {
          var other = form.querySelector(input.getAttribute("data-match"));
          if (other && v !== other.value) bad = true;
        }
        markError(field, bad); if (bad) ok = false;
      });
      if (!ok) return;
      var next = form.getAttribute("data-next");
      var done = form.getAttribute("data-toast");
      if (done) toast(done);
      if (next) setTimeout(function () { location.href = next; }, done ? 700 : 0);
    });
  });

  /* Live password rules (reset page) */
  var pw = $("[data-pw-rules]");
  if (pw) {
    var target = $("#new-password");
    var rLen = $("[data-rule-len]"), rSpec = $("[data-rule-special]");
    var check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    if (rLen) rLen.querySelector(".auth-rule__dot").innerHTML = check;
    if (rSpec) rSpec.querySelector(".auth-rule__dot").innerHTML = check;
    if (target) target.addEventListener("input", function () {
      var v = target.value;
      if (rLen) rLen.classList.toggle("ok", v.length >= 8);
      if (rSpec) rSpec.classList.toggle("ok", /[^A-Za-z0-9]/.test(v));
    });
  }

  /* OTP inputs: auto-advance */
  var otp = $(".otp");
  if (otp) {
    var boxes = $$("input", otp);
    boxes.forEach(function (box, i) {
      box.addEventListener("input", function () {
        box.value = box.value.replace(/\D/g, "").slice(0, 1);
        if (box.value && boxes[i + 1]) boxes[i + 1].focus();
      });
      box.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !box.value && boxes[i - 1]) boxes[i - 1].focus();
      });
    });
  }
})();
