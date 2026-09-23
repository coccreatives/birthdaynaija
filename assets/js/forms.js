/* =========================================================
   BirthdayNaija: submission forms
   No accounts and no sign in. Every action is a short form
   that ends in payment or in a request our team answers.

   TO GO LIVE:
   1. Set ENDPOINT below to the address that receives a
      submission (an email service, a form service, or the
      admin API once the dashboard is built).
   2. Set PAY.mode to 'link' and give each package its
      payment link from Paystack or Flutterwave.
   Until then the form collects everything and shows the
   confirmation screen, which is enough for a demo.
   ========================================================= */
(function () {
  'use strict';

  var ENDPOINT = '';           // e.g. 'https://formspree.io/f/xxxx' or '/api/submissions'
  var PAY = { mode: 'demo' };  // 'demo' shows the confirmation, 'link' sends to the payment page

  /* ---------- packages and prices (edit here) ---------- */
  var NGN = function (n) { return '₦' + Number(n).toLocaleString('en-NG'); };

  var PACKAGES = {
    wall:    { id: 'wall',    name: 'Birthday Wall entry', price: 500,   desc: 'Name and photo on the Wall on the birthday' },
    photo:   { id: 'photo',   name: 'Photo shoutout',      price: 2500,  desc: 'Branded design posted on the Wall and our social channels' },
    video:   { id: 'video',   name: 'Video shoutout',      price: 10000, desc: 'Custom video message, posted and sent to the celebrant' },
    club:    { id: 'club',    name: 'Club membership',     price: 15000, desc: 'Wall slot, shoutout and priority booking, every year' },
    group:   { id: 'group',   name: 'Family and Business', price: 45000, desc: 'Cover a whole family, school or company for a year' },
    giftbox: { id: 'giftbox', name: 'Birthday gift box',   price: 20000, desc: 'Cake, card and treats delivered on the day' },
    giftexp: { id: 'giftexp', name: 'Birthday experience', price: 50000, desc: 'A planned surprise, quoted after we speak with you' }
  };

  var RELATIONS = ['Myself', 'Friend', 'Partner', 'Parent', 'Sibling', 'Child', 'Colleague', 'Customer', 'Other'];
  var GROUP_TYPES = ['Family', 'Company', 'School', 'Church or association'];
  var BIZ_NEEDS = ['Employee birthdays', 'Customer birthdays', 'Sponsor the Birthday Wall', 'Sponsor a campaign or giveaway', 'Something else'];

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
    opts: function (n, l, keys, o) { return Object.assign({ kind: 'opts', name: n, label: l, packages: keys, required: true }, o || {}); },
    check: function (n, l, o) { return Object.assign({ kind: 'check', name: n, label: l, required: true }, o || {}); },
    note: function (text) { return { kind: 'note', text: text }; }
  };

  var consent = f.check('consent', 'I have permission to use the photo, video and details I am submitting, and I understand the BirthdayNaija team reviews every entry before it is published.');
  var payStep = function (title, sub) {
    return {
      title: title || 'Check and pay',
      sub: sub || 'Confirm the details below, then complete payment to send your entry to our team.',
      cta: 'Continue to payment',
      summary: true,
      fields: [
        f.opts('method', 'How would you like to pay?', null, {
          custom: [
            { id: 'card', name: 'Card', desc: 'Debit or credit card through our Nigerian payment gateway' },
            { id: 'transfer', name: 'Bank transfer', desc: 'We send account details and confirm once payment lands' }
          ]
        }),
        f.note('Your entry is reviewed by the BirthdayNaija team before it goes live. You will get an email at each step.')
      ]
    };
  };

  /* ---------- flows ---------- */
  var FLOWS = {
    celebrate: {
      title: 'Celebrate someone',
      sub: 'Tell us who we are celebrating and we take it from there.',
      steps: [
        {
          title: 'Who are we celebrating?',
          sub: 'This is what appears on the Birthday Wall.',
          fields: [
            f.text('celebrant', 'Celebrant full name', { placeholder: 'e.g. Chioma Nze' }),
            f.date('birthday', 'Date of birth'),
            f.select('relation', 'Who are they to you?', RELATIONS),
            f.file('photo', 'Photo of the celebrant', { hint: 'JPG or PNG, up to 5 MB. Portrait photos look best.' }),
            f.area('message', 'Birthday message', { placeholder: 'Happy birthday Chioma. Wishing you a year of joy.', maxlength: 300, hint: 'Up to 300 characters.' })
          ]
        },
        {
          title: 'Choose what we do',
          sub: 'Pick the celebration you want. You can add more later.',
          fields: [f.opts('package', 'Celebration', ['wall', 'photo', 'video'])]
        },
        {
          title: 'Your details',
          sub: 'So we can send updates and the receipt.',
          fields: [
            f.text('sender', 'Your name'),
            f.email('email', 'Your email'),
            f.tel('phone', 'Your phone number', { placeholder: '080 0000 0000' }),
            consent
          ]
        },
        payStep()
      ],
      done: {
        title: 'Entry received',
        text: 'Thank you. Our team reviews every submission and publishes it on the birthday. You will get an email when it is approved and again when it goes live.'
      }
    },

    club: {
      title: 'Join the Club',
      sub: 'One membership, and your birthday is covered every year.',
      steps: [
        {
          title: 'Your details',
          sub: 'The Club celebrates you, so we need your birthday.',
          fields: [
            f.text('member', 'Full name'),
            f.date('birthday', 'Date of birth'),
            f.email('email', 'Email'),
            f.tel('phone', 'Phone number'),
            f.file('photo', 'Photo for your Wall slot', { hint: 'JPG or PNG, up to 5 MB. You can send this later.' })
          ]
        },
        {
          title: 'Your membership',
          sub: 'Membership renews every year. You can cancel any time before renewal.',
          fields: [
            f.opts('package', 'Membership', ['club']),
            f.check('consent', 'I have permission to use the photo and details I am submitting, and I agree to the BirthdayNaija content guidelines.')
          ]
        },
        payStep('Check and pay', 'Confirm your membership below, then complete payment.')
      ],
      done: {
        title: 'Welcome to the Club',
        text: 'We have your details. You will get a welcome email with your membership number, and your Wall slot is reserved for your next birthday.'
      }
    },

    group: {
      title: 'Get a group plan',
      sub: 'Cover a family, a school or a whole team for the year.',
      steps: [
        {
          title: 'About the group',
          sub: 'Tell us who we are covering.',
          fields: [
            f.text('groupName', 'Family or organisation name', { placeholder: 'e.g. The Balogun family' }),
            f.select('groupType', 'Type of group', GROUP_TYPES),
            f.num('people', 'How many people?', { min: 2, placeholder: 'e.g. 12' }),
            f.file('list', 'Names and birthdays list', { hint: 'A spreadsheet or document with names and dates. You can send this later.' })
          ]
        },
        {
          title: 'Who do we speak to?',
          sub: 'The contact person for the whole group.',
          fields: [
            f.text('contact', 'Contact name'),
            f.email('email', 'Email'),
            f.tel('phone', 'Phone number'),
            f.opts('package', 'Plan', ['group']),
            f.check('consent', 'I am authorised to share these details on behalf of the group.')
          ]
        },
        payStep('Check and pay', 'Confirm the plan below. If you need an invoice first, choose bank transfer and we will send one.')
      ],
      done: {
        title: 'Group plan started',
        text: 'Thank you. Our team will confirm the list of names and dates by email, then set up every birthday in the group for the year.'
      }
    },

    gift: {
      title: 'Send a gift',
      sub: 'A gift box or a planned surprise, delivered on the day.',
      steps: [
        {
          title: 'Who is it for?',
          sub: 'We deliver on the birthday itself where we can.',
          fields: [
            f.text('celebrant', 'Recipient full name'),
            f.date('birthday', 'Date of birth'),
            f.text('city', 'Delivery city', { placeholder: 'e.g. Lagos' }),
            f.area('address', 'Delivery address', { placeholder: 'Street, area, landmark' }),
            f.area('message', 'Message on the card', { maxlength: 200, hint: 'Up to 200 characters.' })
          ]
        },
        {
          title: 'Choose a gift',
          sub: 'Experiences are quoted after we speak with you.',
          fields: [f.opts('package', 'Gift', ['giftbox', 'giftexp'])]
        },
        {
          title: 'Your details',
          sub: 'So we can confirm delivery with you.',
          fields: [f.text('sender', 'Your name'), f.email('email', 'Your email'), f.tel('phone', 'Your phone number'), consent]
        },
        payStep('Check and pay', 'Confirm the gift below, then complete payment.')
      ],
      done: {
        title: 'Gift booked',
        text: 'Thank you. Our team will confirm delivery details with you by email, and let you know once the gift is on its way.'
      }
    },

    business: {
      title: 'Partner with us',
      sub: 'Celebrate your staff and customers, or sponsor the Wall.',
      steps: [
        {
          title: 'About your business',
          sub: 'A few details so we can prepare the right package.',
          fields: [
            f.text('company', 'Company name'),
            f.select('need', 'What are you interested in?', BIZ_NEEDS),
            f.num('people', 'How many people would this cover?', { required: false, placeholder: 'Leave blank if not sure' }),
            f.area('details', 'Anything else we should know?', { required: false, placeholder: 'Timing, budget, campaign ideas' })
          ]
        },
        {
          title: 'Who do we contact?',
          sub: 'We reply within two working days.',
          fields: [f.text('contact', 'Your name'), f.email('email', 'Work email'), f.tel('phone', 'Phone number')],
          cta: 'Send request'
        }
      ],
      done: {
        title: 'Request sent',
        text: 'Thank you. Our partnerships team will get back to you within two working days with packages and pricing.'
      }
    }
  };

  /* ---------- engine ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var modal = $('#bn-modal');
  if (!modal) return;
  var card = $('.modal__card', modal);
  var elStep = $('[data-m-step]', modal);
  var elTitle = $('[data-m-title]', modal);
  var elSub = $('[data-m-sub]', modal);
  var elBar = $('[data-m-bar]', modal);
  var elBody = $('[data-m-body]', modal);
  var elFoot = $('[data-m-foot]', modal);
  var btnBack = $('[data-m-back]', modal);
  var btnNext = $('[data-m-next]', modal);

  var state = { flow: null, key: '', step: 0, data: {}, opener: null };
  var modalTimer = null;
  var savedScrollY = 0;

  /* True iOS-safe scroll lock: overflow:hidden alone lets the page behind
     rubber-band/scroll while a fixed overlay is open, which is what was
     making the modal header appear to vanish. Pinning the body with
     position:fixed stops that entirely. */
  function lockScroll() {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = (-savedScrollY) + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.classList.add('is-locked');
  }
  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.classList.remove('is-locked');
    window.scrollTo(0, savedScrollY);
  }

  function open(key, preset) {
    var flow = FLOWS[key];
    if (!flow) return;
    state = { flow: flow, key: key, step: 0, data: Object.assign({}, preset || {}), opener: document.activeElement };
    clearTimeout(modalTimer);
    modal.hidden = false;
    lockScroll();
    render();
    // next frame, so the transition has a start value to animate from
    requestAnimationFrame(function () { requestAnimationFrame(function () { modal.classList.add('is-open'); }); });
  }

  function close() {
    if (modal.hidden) return;
    clearTimeout(modalTimer);
    modal.classList.remove('is-open');
    unlockScroll();
    if (state.opener && state.opener.focus) state.opener.focus();
    // keep it in the flow until the slide/fade-out finishes, then take it out
    modalTimer = setTimeout(function () { modal.hidden = true; elFoot.hidden = false; }, 400);
  }

  function price() {
    var pkg = PACKAGES[state.data.package];
    return pkg ? pkg.price : 0;
  }

  function render() {
    var flow = state.flow, step = flow.steps[state.step];
    elStep.textContent = 'Step ' + (state.step + 1) + ' of ' + flow.steps.length;
    elTitle.textContent = step.title;
    elSub.textContent = step.sub || flow.sub;
    elBar.style.width = Math.round(((state.step + 1) / flow.steps.length) * 100) + '%';
    elBody.innerHTML = '';
    if (step.summary) elBody.appendChild(summaryBlock());
    (step.fields || []).forEach(function (field) { elBody.appendChild(build(field)); });
    btnBack.hidden = false;
    btnBack.textContent = state.step === 0 ? 'Cancel' : '← Back';
    btnNext.textContent = step.cta || 'Continue';
    elBody.scrollTop = 0;
    var first = $('input, select, textarea', elBody);
    if (first && first.type !== 'file' && window.innerWidth > 767) first.focus();
  }

  function build(field) {
    var wrap = document.createElement('div');
    if (field.kind === 'note') {
      wrap.className = 'note';
      wrap.textContent = field.text;
      return wrap;
    }
    if (field.kind === 'check') {
      wrap.className = 'check';
      wrap.innerHTML = '<input type="checkbox" name="' + field.name + '"><span>' + field.label + '</span>';
      var box = $('input', wrap);
      box.checked = !!state.data[field.name];
      box.addEventListener('change', function () { state.data[field.name] = box.checked; wrap.classList.remove('is-invalid'); });
      wrap.dataset.name = field.name;
      wrap.dataset.required = field.required ? '1' : '';
      return wrap;
    }
    if (field.kind === 'opts') {
      wrap.className = 'field';
      wrap.innerHTML = '<span class="field__label">' + field.label + '</span>';
      var list = document.createElement('div');
      list.className = 'opts';
      var items = field.custom || (field.packages || []).map(function (k) {
        var p = PACKAGES[k];
        return { id: p.id, name: p.name, desc: p.desc, price: p.price };
      });
      items.forEach(function (item) {
        var opt = document.createElement('label');
        opt.className = 'opt';
        opt.innerHTML =
          '<input type="radio" name="' + field.name + '" value="' + item.id + '">' +
          '<span class="opt__text"><span class="opt__t">' + item.name + '</span><span class="opt__d">' + item.desc + '</span></span>' +
          (item.price ? '<span class="opt__p">' + NGN(item.price) + '</span>' : '');
        var input = $('input', opt);
        if (state.data[field.name] === item.id) { input.checked = true; opt.classList.add('is-on'); }
        input.addEventListener('change', function () {
          state.data[field.name] = item.id;
          $$('.opt', list).forEach(function (o) { o.classList.remove('is-on'); });
          opt.classList.add('is-on');
          wrap.classList.remove('is-invalid');
        });
        list.appendChild(opt);
      });
      wrap.appendChild(list);
      wrap.insertAdjacentHTML('beforeend', '<span class="field__error">Please choose one option.</span>');
      wrap.dataset.name = field.name;
      wrap.dataset.required = field.required ? '1' : '';
      return wrap;
    }
    if (field.kind === 'file') {
      wrap.className = 'field';
      wrap.innerHTML =
        '<span class="field__label">' + field.label + (field.required ? '' : ' <span>(optional)</span>') + '</span>' +
        '<label class="drop"><input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv">' +
        '<span class="drop__thumb">+</span><span><span class="drop__t">Choose a file</span>' +
        '<span class="drop__d">' + (field.hint || '') + '</span></span></label>';
      var input = $('input', wrap);
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (!file) return;
        state.data[field.name] = file.name;
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
    var id = 'f_' + field.name;
    var label = '<label class="field__label" for="' + id + '">' + field.label + (field.required === false ? ' <span>(optional)</span>' : '') + '</label>';
    var control = '';
    if (field.kind === 'select') {
      control = '<select id="' + id + '" name="' + field.name + '"><option value="">Select</option>' +
        field.options.map(function (o) { return '<option' + (state.data[field.name] === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
    } else if (field.kind === 'textarea') {
      control = '<textarea id="' + id + '" name="' + field.name + '"' + (field.maxlength ? ' maxlength="' + field.maxlength + '"' : '') +
        (field.placeholder ? ' placeholder="' + field.placeholder + '"' : '') + '>' + (state.data[field.name] || '') + '</textarea>';
    } else {
      control = '<input id="' + id + '" type="' + field.type + '" name="' + field.name + '"' +
        (field.placeholder ? ' placeholder="' + field.placeholder + '"' : '') +
        (field.min ? ' min="' + field.min + '"' : '') +
        ' value="' + (state.data[field.name] || '') + '">';
    }
    wrap.innerHTML = label + control + (field.hint ? '<span class="field__hint">' + field.hint + '</span>' : '') +
      '<span class="field__error">' + (field.type === 'email' ? 'Please enter a valid email address.' : 'This field is required.') + '</span>';
    var el = $('input, select, textarea', wrap);
    el.addEventListener('input', function () { state.data[field.name] = el.value; wrap.classList.remove('is-invalid'); });
    el.addEventListener('change', function () { state.data[field.name] = el.value; wrap.classList.remove('is-invalid'); });
    wrap.dataset.name = field.name;
    wrap.dataset.required = field.required === false ? '' : '1';
    wrap.dataset.type = field.type || field.kind;
    return wrap;
  }

  function summaryBlock() {
    var box = document.createElement('div');
    box.className = 'summary';
    var pkg = PACKAGES[state.data.package];
    var rows = [];
    if (state.data.celebrant) rows.push(['Celebrant', state.data.celebrant]);
    if (state.data.member) rows.push(['Member', state.data.member]);
    if (state.data.groupName) rows.push(['Group', state.data.groupName + (state.data.people ? ', ' + state.data.people + ' people' : '')]);
    if (state.data.birthday) rows.push(['Birthday', state.data.birthday]);
    if (state.data.city) rows.push(['Delivery', state.data.city]);
    if (pkg) rows.push([state.key === 'club' || state.key === 'group' ? 'Plan' : 'Celebration', pkg.name]);
    if (state.data.email) rows.push(['Email', state.data.email]);
    box.innerHTML = rows.map(function (r) {
      return '<div class="summary__row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
    }).join('') +
      (pkg ? '<div class="summary__row summary__total"><span>Total to pay</span><b>' + NGN(pkg.price) +
        (state.key === 'club' || state.key === 'group' ? ' per year' : '') + '</b></div>' : '');
    return box;
  }

  function validate() {
    var ok = true;
    $$('[data-required="1"]', elBody).forEach(function (wrap) {
      var name = wrap.dataset.name;
      var value = state.data[name];
      var bad = !value || (typeof value === 'string' && !value.trim());
      if (!bad && wrap.dataset.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      wrap.classList.toggle('is-invalid', bad);
      if (bad && ok) {
        ok = false;
        var focusable = $('input, select, textarea', wrap);
        if (focusable) focusable.focus();
        wrap.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
    return ok;
  }

  function finish() {
    var payload = Object.assign({ flow: state.key, submittedAt: new Date().toISOString() }, state.data);
    if (ENDPOINT) {
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(function () {});
    } else if (window.console) {
      console.log('[BirthdayNaija] submission', payload);
    }
    if (PAY.mode === 'link' && PACKAGES[state.data.package] && PACKAGES[state.data.package].link) {
      window.location.href = PACKAGES[state.data.package].link;
      return;
    }
    var done = state.flow.done;
    elFoot.hidden = true;
    elStep.textContent = 'All done';
    elTitle.textContent = state.flow.title;
    elSub.textContent = '';
    elBar.style.width = '100%';
    elBody.innerHTML =
      '<div class="done"><img class="done__mark" src="assets/icons/success.svg" alt="" width="48" height="48">' +
      '<p class="done__t">' + done.title + '</p>' +
      '<p class="done__d">' + done.text + '</p>' +
      '<button class="btn btn--grad btn--md" data-m-close>Close</button></div>';
  }

  btnNext.addEventListener('click', function () {
    if (!validate()) return;
    if (state.step < state.flow.steps.length - 1) { state.step += 1; render(); }
    else finish();
  });
  btnBack.addEventListener('click', function () { if (state.step > 0) { state.step -= 1; render(); } else { close(); } });
  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-m-close]') || e.target.classList.contains('modal__backdrop')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      var items = $$('button, input, select, textarea, a[href]', card).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- openers ---------- */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-form]');
    if (!trigger) return;
    e.preventDefault();
    var preset = {};
    if (trigger.dataset.package) preset.package = trigger.dataset.package;
    // Birthday Wall card: prefill the celebrant we are wishing
    if (trigger.dataset.celebrant) preset.celebrant = trigger.dataset.celebrant;
    open(trigger.dataset.form, preset);
  });

  window.BN_FORMS = { open: open, packages: PACKAGES, flows: FLOWS };
})();
