/* =========================================================
   BirthdayNaija: standalone form page (form.html)

   One clean page per booking. The flow is chosen from the URL:
     form.html?plan=oneoff | club | group   (subscription plans)
     form.html?flow=gift | business          (other forms)
   Optional prefill: &celebrant=Name

   Subscription flows show a plan chooser on the left that the
   visitor can change; the chosen plan drives the fields and the
   total. To go live, set ENDPOINT / PAY the same way as the old
   modal (see notes at the bottom of finish()).
   ========================================================= */
(function () {
  'use strict';

  var ENDPOINT = '';           // e.g. 'https://formspree.io/f/xxxx' or '/api/submissions'
  var PAY = { mode: 'demo' };  // 'demo' shows the confirmation; 'link' sends to a payment page

  var NGN = function (n) { return '₦' + Number(n).toLocaleString('en-NG'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };

  /* ---------- gift packages (subscription plans come from BN_CONFIG) ---------- */
  var PACKAGES = {
    giftbox: { id: 'giftbox', name: 'Birthday gift box', price: 20000, desc: 'Cake, card and treats delivered on the day' },
    giftexp: { id: 'giftexp', name: 'Birthday experience', price: 50000, quote: true, desc: 'A planned surprise, quoted after we speak with you' }
  };

  /* ---------- the three subscription plans (single source: BN_CONFIG) ---------- */
  var PRICING = (window.BN_CONFIG && window.BN_CONFIG.pricing) || {};
  var PLAN_FALLBACK = {
    oneoff: { name: 'One Off', amount: 500, unit: '/ one time', include: ['Birthday Wall entry', 'Shoutout', 'Choose your own challenge'] },
    club: { name: 'Club Member', amount: 15000, unit: '/ year', include: ['Everything in One Off', 'Dedicated wall slot', 'Shoutout', 'Priority booking', 'Automatic renewal every year'], popular: true },
    group: { name: 'Family / Group', amount: 45000, unit: '/ year', include: ['Everything in Club Member', 'Cover parents', 'Cover siblings', 'Cover the whole house', 'Priority booking'] }
  };
  var PLAN_ORDER = ['oneoff', 'club', 'group'];
  var PLAN_FLOW = { oneoff: 'celebrate', club: 'club', group: 'group' };
  var FLOW_PLAN = { celebrate: 'oneoff', club: 'club', group: 'group' };
  function planData(key) {
    var p = PRICING[key] || PLAN_FALLBACK[key] || {};
    return {
      key: key, name: p.name, amount: p.amount, unit: p.unit,
      include: p.include || [], popular: !!p.popular,
      blurb: p.tagline || p.summary || (PLAN_FALLBACK[key] && PLAN_FALLBACK[key].blurb) || ''
    };
  }

  /* ---------- field builders ---------- */
  var f = {
    text: function (n, l, o) { return Object.assign({ kind: 'input', type: 'text', name: n, label: l, required: true }, o || {}); },
    email: function (n, l, o) { return Object.assign({ kind: 'input', type: 'email', name: n, label: l, required: true }, o || {}); },
    tel: function (n, l, o) { return Object.assign({ kind: 'input', type: 'tel', name: n, label: l, required: true }, o || {}); },
    date: function (n, l, o) { return Object.assign({ kind: 'input', type: 'date', name: n, label: l, required: true }, o || {}); },
    num: function (n, l, o) { return Object.assign({ kind: 'input', type: 'number', name: n, label: l, required: true }, o || {}); },
    select: function (n, l, list, o) { return Object.assign({ kind: 'select', name: n, label: l, options: list, required: true }, o || {}); },
    area: function (n, l, o) { return Object.assign({ kind: 'textarea', name: n, label: l, required: true }, o || {}); },
    file: function (n, l, o) { return Object.assign({ kind: 'file', name: n, label: l }, o || {}); },
    gift: function (n, l, keys, o) { return Object.assign({ kind: 'opts', name: n, label: l, packages: keys, required: true }, o || {}); },
    check: function (n, l, o) { return Object.assign({ kind: 'check', name: n, label: l, required: true }, o || {}); }
  };

  var RELATIONS = ['Myself', 'Friend', 'Partner', 'Parent', 'Sibling', 'Child', 'Colleague', 'Customer', 'Other'];
  var GROUP_TYPES = ['Family', 'Company', 'School', 'Church or association'];
  var BIZ_NEEDS = ['Employee birthdays', 'Customer birthdays', 'Sponsor the Birthday Wall', 'Sponsor a campaign or giveaway', 'Something else'];

  /* ---------- flows ---------- */
  var FLOWS = {
    celebrate: {
      eyebrow: 'Booking', title: 'Celebrate someone',
      lead: 'Tell us who we’re celebrating and our team takes it from there.',
      subscription: true, paid: true, submit: 'Continue to payment',
      groups: [
        { heading: 'Who are we celebrating?', sub: 'This is what appears on the Birthday Wall.', fields: [
          f.text('celebrant', 'Celebrant full name', { placeholder: 'e.g. Chioma Nze' }),
          f.date('birthday', 'Date of birth'),
          f.select('relation', 'Who are they to you?', RELATIONS),
          f.file('photo', 'Photo of the celebrant', { hint: 'JPG or PNG, up to 5 MB. Portrait photos look best.' }),
          f.area('message', 'Birthday message', { placeholder: 'Happy birthday Chioma. Wishing you a year of joy.', maxlength: 300, hint: 'Up to 300 characters.', required: false })
        ] },
        { heading: 'Your details', sub: 'So we can send updates and the receipt.', fields: [
          f.text('sender', 'Your name'),
          f.email('email', 'Your email'),
          f.tel('phone', 'Your phone number', { placeholder: '080 0000 0000' })
        ] }
      ],
      consent: 'I have permission to use the photo, video and details I am submitting, and I understand the BirthdayNaija team reviews every entry before it is published.',
      done: { title: 'Entry received', text: 'Thank you. Our team reviews every submission and publishes it on the birthday. You’ll get an email when it’s approved and again when it goes live.' }
    },

    club: {
      eyebrow: 'Membership', title: 'Join the Club',
      lead: 'One membership, and your birthday is covered every year.',
      subscription: true, paid: true, submit: 'Continue to payment',
      groups: [
        { heading: 'Your details', sub: 'The Club celebrates you, so we need your birthday.', fields: [
          f.text('member', 'Full name'),
          f.date('birthday', 'Date of birth'),
          f.email('email', 'Email'),
          f.tel('phone', 'Phone number'),
          f.file('photo', 'Photo for your Wall slot', { hint: 'JPG or PNG, up to 5 MB. You can send this later.' })
        ] }
      ],
      consent: 'I have permission to use the photo and details I am submitting, and I agree to the BirthdayNaija content guidelines.',
      done: { title: 'Welcome to the Club', text: 'We have your details. You’ll get a welcome email with your membership number, and your Wall slot is reserved for your next birthday.' }
    },

    group: {
      eyebrow: 'Membership', title: 'Family & Group plan',
      lead: 'Cover a family, a school or a whole team for the year.',
      subscription: true, paid: true, submit: 'Continue to payment',
      groups: [
        { heading: 'About the group', sub: 'Tell us who we’re covering.', fields: [
          f.text('groupName', 'Family or organisation name', { placeholder: 'e.g. The Balogun family' }),
          f.select('groupType', 'Type of group', GROUP_TYPES),
          f.num('people', 'How many people?', { min: 2, placeholder: 'e.g. 12' }),
          f.file('list', 'Names and birthdays list', { hint: 'A spreadsheet or document with names and dates. You can send this later.' })
        ] },
        { heading: 'Who do we speak to?', sub: 'The contact person for the whole group.', fields: [
          f.text('contact', 'Contact name'),
          f.email('email', 'Email'),
          f.tel('phone', 'Phone number')
        ] }
      ],
      consent: 'I am authorised to share these details on behalf of the group.',
      done: { title: 'Group plan started', text: 'Thank you. Our team will confirm the list of names and dates by email, then set up every birthday in the group for the year.' }
    },

    gift: {
      eyebrow: 'Send a gift', title: 'Send a gift',
      lead: 'A gift box or a planned surprise, delivered on the day.',
      subscription: false, paid: true, submit: 'Continue to payment',
      trust: ['Delivered on the birthday where we can', 'Every order is confirmed by our team', 'You get an email once it’s on the way'],
      groups: [
        { heading: 'Who is it for?', sub: 'We deliver on the birthday itself where we can.', fields: [
          f.text('celebrant', 'Recipient full name'),
          f.date('birthday', 'Date of birth'),
          f.text('city', 'Delivery city', { placeholder: 'e.g. Lagos' }),
          f.area('address', 'Delivery address', { placeholder: 'Street, area, landmark' }),
          f.area('message', 'Message on the card', { maxlength: 200, hint: 'Up to 200 characters.', required: false })
        ] },
        { heading: 'Choose a gift', sub: 'Experiences are quoted after we speak with you.', fields: [
          f.gift('package', 'Gift', ['giftbox', 'giftexp'])
        ] },
        { heading: 'Your details', sub: 'So we can confirm delivery with you.', fields: [
          f.text('sender', 'Your name'),
          f.email('email', 'Your email'),
          f.tel('phone', 'Your phone number')
        ] }
      ],
      consent: 'I have permission to send this gift and share these delivery details.',
      done: { title: 'Gift booked', text: 'Thank you. Our team will confirm delivery details with you by email, and let you know once the gift is on its way.' }
    },

    business: {
      eyebrow: 'Partnerships', title: 'Partner with us',
      lead: 'Celebrate your staff and customers, or sponsor the Wall.',
      subscription: false, paid: false, submit: 'Send request',
      trust: ['We reply within two working days', 'Custom packages for teams of any size', 'Volume and sponsor pricing available'],
      groups: [
        { heading: 'About your business', sub: 'A few details so we can prepare the right package.', fields: [
          f.text('company', 'Company name'),
          f.select('need', 'What are you interested in?', BIZ_NEEDS),
          f.num('people', 'How many people would this cover?', { required: false, placeholder: 'Leave blank if not sure' }),
          f.area('details', 'Anything else we should know?', { required: false, placeholder: 'Timing, budget, campaign ideas' })
        ] },
        { heading: 'Who do we contact?', sub: 'We reply within two working days.', fields: [
          f.text('contact', 'Your name'),
          f.email('email', 'Work email'),
          f.tel('phone', 'Phone number')
        ] }
      ],
      done: { title: 'Request sent', text: 'Thank you. Our partnerships team will get back to you within two working days with packages and pricing.' }
    }
  };

  /* ---------- helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Same checkmark glyph as the plan/paywall cards (main.js SVG_CHECK)
  var SVG_TICK = '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M11.5 3.75 5.4 10.1 2.5 7.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var wrapEl = $('[data-fp-wrap]');
  var asideEl = $('[data-fp-aside]');
  var formEl = $('[data-fp-form]');
  var fieldsEl = $('[data-fp-fields]');
  var footEl = $('[data-fp-foot]');

  /* ---------- state from URL ---------- */
  var params = new URLSearchParams(location.search);
  var planParam = params.get('plan');
  var flowParam = params.get('flow');
  var flowKey;
  if (planParam && PLAN_FLOW[planParam]) flowKey = PLAN_FLOW[planParam];
  else if (flowParam && FLOWS[flowParam]) flowKey = flowParam;
  else flowKey = 'celebrate';

  var state = { flow: flowKey, data: {} };
  if (FLOWS[flowKey].subscription) state.plan = FLOW_PLAN[flowKey];
  if (FLOWS[flowKey] === FLOWS.gift) state.data.package = 'giftbox';

  // prefill from URL (celebrant name from a Wall card, etc.)
  ['celebrant', 'sender', 'email', 'package'].forEach(function (k) {
    if (params.get(k)) state.data[k] = params.get(k);
  });

  /* ---------- price ---------- */
  function currentPrice() {
    var flow = FLOWS[state.flow];
    if (flow.subscription) { var p = planData(state.plan); return { amount: p.amount, unit: p.unit, quote: false }; }
    if (state.flow === 'gift') { var pk = PACKAGES[state.data.package]; return pk ? { amount: pk.price, unit: '', quote: !!pk.quote } : null; }
    return null;
  }

  /* ---------- render: aside ---------- */
  function renderAside() {
    var flow = FLOWS[state.flow];
    var html = '<div><p class="fp__eyebrow">' + esc(flow.eyebrow) + '</p>' +
      '<h1 class="fp__title">' + esc(flow.title) + '</h1>' +
      '<p class="fp__lead">' + esc(flow.lead) + '</p></div>';

    if (flow.subscription) {
      html += '<div>' +
        '<div class="fp__planhead"><h2>Your plan</h2><span>You can change this anytime</span></div>' +
        '<div class="fp__plans">' +
        PLAN_ORDER.map(function (k) {
          var p = planData(k);
          var on = state.plan === k;
          return '<button type="button" class="planpick' + (on ? ' is-on' : '') + '" data-plan-pick="' + k + '">' +
            (p.popular ? '<span class="planpick__tag">Most Popular</span>' : '') +
            '<span class="planpick__radio" aria-hidden="true"></span>' +
            '<span class="planpick__body">' +
              '<span class="planpick__row"><span class="planpick__name">' + esc(p.name) + '</span>' +
              '<span class="planpick__price">' + NGN(p.amount) + ' <span>' + esc(p.unit) + '</span></span></span>' +
              '<span class="planpick__blurb">' + esc(p.blurb) + '</span>' +
            '</span></button>';
        }).join('') +
        '</div></div>';

      var inc = planData(state.plan).include;
      if (inc && inc.length) {
        html += '<div class="fp__included"><h3>What’s included</h3><ul>' +
          inc.map(function (i) { return '<li>' + SVG_TICK + '<span>' + esc(i) + '</span></li>'; }).join('') +
          '</ul></div>';
      }
    } else if (flow.trust) {
      html += '<ul class="fp__trust">' +
        flow.trust.map(function (t) { return '<li>' + SVG_TICK + '<span>' + esc(t) + '</span></li>'; }).join('') +
        '</ul>';
    }
    asideEl.innerHTML = html;
  }

  /* ---------- render: fields ---------- */
  function build(field) {
    var wrap = document.createElement('div');
    var name = field.name;

    if (field.kind === 'check') {
      wrap.className = 'check';
      wrap.innerHTML = '<input type="checkbox"><span>' + esc(field.label) + '</span>';
      var box = $('input', wrap);
      box.checked = !!state.data[name];
      box.addEventListener('change', function () { state.data[name] = box.checked; wrap.classList.remove('is-invalid'); });
      wrap.dataset.name = name; wrap.dataset.required = field.required ? '1' : '';
      return wrap;
    }

    if (field.kind === 'opts') {
      wrap.className = 'field';
      wrap.innerHTML = '<span class="field__label">' + esc(field.label) + '</span>';
      var list = document.createElement('div');
      list.className = 'opts';
      (field.packages || []).forEach(function (k) {
        var item = PACKAGES[k];
        var opt = document.createElement('label');
        opt.className = 'opt';
        opt.innerHTML =
          '<input type="radio" name="' + name + '" value="' + item.id + '">' +
          '<span class="opt__text"><span class="opt__t">' + esc(item.name) + '</span><span class="opt__d">' + esc(item.desc) + '</span></span>' +
          '<span class="opt__p">' + (item.quote ? 'From ' : '') + NGN(item.price) + '</span>';
        var input = $('input', opt);
        if (state.data[name] === item.id) { input.checked = true; opt.classList.add('is-on'); }
        input.addEventListener('change', function () {
          state.data[name] = item.id;
          $$('.opt', list).forEach(function (o) { o.classList.remove('is-on'); });
          opt.classList.add('is-on');
          wrap.classList.remove('is-invalid');
          if (name === 'package') renderFoot();
        });
        list.appendChild(opt);
      });
      wrap.appendChild(list);
      wrap.insertAdjacentHTML('beforeend', '<span class="field__error">Please choose one option.</span>');
      wrap.dataset.name = name; wrap.dataset.required = field.required ? '1' : '';
      return wrap;
    }

    if (field.kind === 'file') {
      wrap.className = 'field';
      wrap.innerHTML =
        '<span class="field__label">' + esc(field.label) + (field.required ? '' : ' <span>(optional)</span>') + '</span>' +
        '<label class="drop"><input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv">' +
        '<span class="drop__thumb">+</span><span><span class="drop__t">Choose a file</span>' +
        '<span class="drop__d">' + esc(field.hint || '') + '</span></span></label>';
      var input = $('input', wrap);
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (!file) return;
        state.data[name] = file.name;
        $('.drop__t', wrap).textContent = file.name;
        $('.drop__d', wrap).textContent = Math.round(file.size / 1024) + ' KB selected';
        if (/^image\//.test(file.type)) {
          var reader = new FileReader();
          reader.onload = function (e) { $('.drop__thumb', wrap).innerHTML = '<img alt="" src="' + e.target.result + '">'; };
          reader.readAsDataURL(file);
        }
      });
      return wrap;
    }

    wrap.className = 'field';
    var id = 'f_' + name;
    var optionalTag = field.required === false ? ' <span>(optional)</span>' : '';
    var label = '<label class="field__label" for="' + id + '">' + esc(field.label) + optionalTag + '</label>';
    var control = '';
    if (field.kind === 'select') {
      control = '<select id="' + id + '" name="' + name + '"><option value="">Select</option>' +
        field.options.map(function (o) { return '<option' + (state.data[name] === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    } else if (field.kind === 'textarea') {
      control = '<textarea id="' + id + '" name="' + name + '"' + (field.maxlength ? ' maxlength="' + field.maxlength + '"' : '') +
        (field.placeholder ? ' placeholder="' + esc(field.placeholder) + '"' : '') + '>' + esc(state.data[name] || '') + '</textarea>';
    } else {
      control = '<input id="' + id + '" type="' + field.type + '" name="' + name + '"' +
        (field.placeholder ? ' placeholder="' + esc(field.placeholder) + '"' : '') +
        (field.min ? ' min="' + field.min + '"' : '') +
        ' value="' + esc(state.data[name] || '') + '">';
    }
    wrap.innerHTML = label + control + (field.hint ? '<span class="field__hint">' + esc(field.hint) + '</span>' : '') +
      '<span class="field__error">' + (field.type === 'email' ? 'Please enter a valid email address.' : 'This field is required.') + '</span>';
    var el = $('input, select, textarea', wrap);
    el.addEventListener('input', function () { state.data[name] = el.value; wrap.classList.remove('is-invalid'); });
    el.addEventListener('change', function () { state.data[name] = el.value; wrap.classList.remove('is-invalid'); });
    wrap.dataset.name = name; wrap.dataset.required = field.required === false ? '' : '1';
    wrap.dataset.type = field.type || field.kind;
    return wrap;
  }

  function renderFields() {
    var flow = FLOWS[state.flow];
    fieldsEl.innerHTML = '';
    var frag = document.createDocumentFragment();

    flow.groups.forEach(function (group) {
      var g = document.createElement('div');
      g.className = 'fp__group';
      var head = '<div class="fp__ghead"><h3>' + esc(group.heading) + '</h3>' + (group.sub ? '<p>' + esc(group.sub) + '</p>' : '') + '</div>';
      g.innerHTML = head;
      group.fields.forEach(function (field) { g.appendChild(build(field)); });
      frag.appendChild(g);
    });

    // Payment method + consent grouped together for paid flows
    if (flow.paid) {
      var pg = document.createElement('div');
      pg.className = 'fp__group';
      pg.innerHTML = '<div class="fp__ghead"><h3>Payment</h3><p>Choose how you’d like to pay. Nothing is charged until you confirm.</p></div>';
      pg.appendChild(buildMethod());
      if (flow.consent) pg.appendChild(build(f.check('consent', flow.consent)));
      frag.appendChild(pg);
    } else if (flow.consent) {
      var cg = document.createElement('div');
      cg.className = 'fp__group';
      cg.appendChild(build(f.check('consent', flow.consent)));
      frag.appendChild(cg);
    }

    fieldsEl.appendChild(frag);
  }

  function buildMethod() {
    var wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.innerHTML = '<span class="field__label">Payment method</span>';
    var list = document.createElement('div');
    list.className = 'opts';
    var methods = [
      { id: 'card', name: 'Card', desc: 'Debit or credit card through our Nigerian payment gateway' },
      { id: 'transfer', name: 'Bank transfer', desc: 'We send account details and confirm once payment lands' }
    ];
    methods.forEach(function (m) {
      var opt = document.createElement('label');
      opt.className = 'opt';
      opt.innerHTML =
        '<input type="radio" name="method" value="' + m.id + '">' +
        '<span class="opt__text"><span class="opt__t">' + m.name + '</span><span class="opt__d">' + m.desc + '</span></span>';
      var input = $('input', opt);
      if (state.data.method === m.id) { input.checked = true; opt.classList.add('is-on'); }
      input.addEventListener('change', function () {
        state.data.method = m.id;
        $$('.opt', list).forEach(function (o) { o.classList.remove('is-on'); });
        opt.classList.add('is-on');
        wrap.classList.remove('is-invalid');
      });
      list.appendChild(opt);
    });
    wrap.appendChild(list);
    wrap.insertAdjacentHTML('beforeend', '<span class="field__error">Please choose one option.</span>');
    wrap.dataset.name = 'method'; wrap.dataset.required = '1';
    return wrap;
  }

  /* ---------- render: foot (summary + submit) ---------- */
  function renderFoot() {
    var flow = FLOWS[state.flow];
    var price = currentPrice();
    var html = '';
    if (price) {
      var per = flow.subscription && /year/.test(price.unit) ? ' / year' : '';
      var amt = price.quote ? 'From ' + NGN(price.amount) : NGN(price.amount) + per;
      html += '<div class="summary"><div class="summary__row summary__total"><span>Total to pay</span><b>' + amt + '</b></div></div>';
    }
    html += '<button type="submit" class="fp__submit">' + esc(flow.submit) + '</button>';
    html += '<p class="fp__reassure">' + (flow.paid
      ? 'Your entry is reviewed by our team before it goes live. You’ll get an email at each step.'
      : 'We’ll get back to you within two working days.') + '</p>';
    footEl.innerHTML = html;
  }

  function renderAll() {
    renderAside();
    renderFields();
    renderFoot();
  }

  /* ---------- plan switching ---------- */
  asideEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-plan-pick]');
    if (!btn) return;
    var key = btn.getAttribute('data-plan-pick');
    if (!PLAN_FLOW[key] || key === state.plan) return;
    state.plan = key;
    state.flow = PLAN_FLOW[key];
    // keep shared fields (email/phone/name where names match); render fresh
    renderAll();
    // reflect in URL so it's shareable / refresh-safe
    try { history.replaceState(null, '', 'form.html?plan=' + key); } catch (err) {}
    asideEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- validation ---------- */
  function validate() {
    var ok = true, firstBad = null;
    $$('[data-required="1"]', formEl).forEach(function (wrap) {
      var name = wrap.dataset.name;
      var value = state.data[name];
      var bad = !value || (typeof value === 'string' && !value.trim());
      if (!bad && wrap.dataset.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      wrap.classList.toggle('is-invalid', bad);
      if (bad && !firstBad) firstBad = wrap;
      if (bad) ok = false;
    });
    if (firstBad) {
      var focusable = $('input, select, textarea', firstBad);
      firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (focusable) setTimeout(function () { focusable.focus(); }, 300);
    }
    return ok;
  }

  /* ---------- submit ---------- */
  function finish() {
    var flow = FLOWS[state.flow];
    var payload = Object.assign({ flow: state.flow, plan: state.plan || null, submittedAt: new Date().toISOString() }, state.data);
    if (ENDPOINT) {
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(function () {});
    } else if (window.console) {
      console.log('[BirthdayNaija] submission', payload);
    }
    // To send straight to a payment page, set PAY.mode = 'link' and give
    // each plan/package a payment link, then redirect here.

    var done = flow.done;
    wrapEl.style.display = 'block';
    wrapEl.innerHTML =
      '<div class="fp__done">' +
      '<svg class="fp__donemark" viewBox="0 0 52 52" fill="none" aria-hidden="true"><circle cx="26" cy="26" r="24" stroke="currentColor" stroke-width="2" opacity=".25"/><path d="M16 27l7 7 13-15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<h2>' + esc(done.title) + '</h2>' +
      '<p>' + esc(done.text) + '</p>' +
      '<div class="fp__doneactions"><a class="btn btn--grad btn--md" href="index.html">Back to site</a></div>' +
      '</div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    if (validate()) finish();
  });

  /* ---------- go ---------- */
  renderAll();
})();
