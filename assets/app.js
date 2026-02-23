const CONFIG = {
  BUSINESS_NAME: 'Business Name Placeholder',
  PHONE_NUMBER_DISPLAY: '02300 000000',
  PHONE_NUMBER_TEL: '+442300000000',
  WHATSAPP_NUMBER: '447700900000',
  SERVICE_RADIUS_MILES: 15,
  WEBHOOK_URL: '',
  TOWER_HIRE_ALLOWED: false,
  SHOW_BADGES: {
    insurance: true,
    cisrs: false,
    nasc: false,
    reviews: false
  }
};

const STORAGE_KEY = 'scaffold_attribution';
const ATTR_TTL_MS = 7 * 24 * 60 * 60 * 1000;
let lastSubmitAt = 0;

function applyConfig() {
  document.querySelectorAll('[data-config="business-name"]').forEach((el) => el.textContent = CONFIG.BUSINESS_NAME);
  document.querySelectorAll('[data-config="service-radius"]').forEach((el) => el.textContent = `Portsmouth + ${CONFIG.SERVICE_RADIUS_MILES} miles`);
  document.querySelectorAll('[data-config="call-link"]').forEach((el) => {
    el.href = `tel:${CONFIG.PHONE_NUMBER_TEL}`;
    if (el.textContent.includes('02300')) el.textContent = CONFIG.PHONE_NUMBER_DISPLAY;
  });
  document.querySelectorAll('[data-config="whatsapp-link"]').forEach((el) => el.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}`);

  Object.entries(CONFIG.SHOW_BADGES).forEach(([k, visible]) => {
    const node = document.querySelector(`[data-badge="${k}"]`);
    if (node) node.style.display = visible ? '' : 'none';
  });
}

function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const payload = {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || '',
    gclid: params.get('gclid') || '',
    referrer: document.referrer || '',
    landing_page_url: window.location.href,
    stored_at: Date.now()
  };

  const hasFreshParams = Object.values(payload).some((v) => typeof v === 'string' && v.trim());
  if (hasFreshParams) localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (stored.stored_at && Date.now() - stored.stored_at <= ATTR_TTL_MS) return stored;
  } catch (_) {}
  return payload;
}

function formatPostcode(raw) {
  const cleaned = raw.toUpperCase().replace(/\s+/g, '');
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
}

function isValidUKPostcode(postcode) {
  return /^([GIR] 0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i.test(postcode.trim());
}

function isValidUKPhone(phone) {
  const normalized = phone.replace(/[\s()-]/g, '');
  return /^(\+44|0)\d{9,10}$/.test(normalized);
}

function bindPhotoPreview() {
  const input = document.getElementById('photos');
  const preview = document.getElementById('photo-preview');
  if (!input || !preview) return;

  input.addEventListener('change', () => {
    preview.innerHTML = '';
    const files = Array.from(input.files || []).slice(0, 3);
    if ((input.files || []).length > 3) alert('Please upload up to 3 images.');
    files.forEach((file) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return;
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = `Uploaded photo preview: ${file.name}`;
      preview.appendChild(img);
    });
  });
}

function stickyCta() {
  const bar = document.getElementById('sticky-cta');
  if (!bar) return;
  const toggle = () => {
    if (window.scrollY > 420) bar.classList.add('visible');
    else bar.classList.remove('visible');
  };
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
}

async function submitForm(form, attribution) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.postcode = formatPostcode(payload.postcode || '');
  payload.timestamp = new Date().toISOString();
  Object.assign(payload, attribution);

  const files = (form.querySelector('#photos')?.files || []);
  payload.photos = Array.from(files).slice(0, 3).map((f) => ({ name: f.name, size: f.size, type: f.type }));

  if (!CONFIG.WEBHOOK_URL) {
    const subject = encodeURIComponent(`Scaffolding lead: ${payload.postcode}`);
    const body = encodeURIComponent(JSON.stringify(payload, null, 2));
    window.location.href = `mailto:info@example.com?subject=${subject}&body=${body}`;
    return true;
  }

  const res = await fetch(CONFIG.WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.ok;
}

function formHandler() {
  const form = document.getElementById('lead-form');
  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');
  if (!form) return;

  const attribution = captureAttribution();

  form.postcode.addEventListener('blur', () => {
    form.postcode.value = formatPostcode(form.postcode.value);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    if (Date.now() - lastSubmitAt < 30000) {
      errorEl.textContent = 'Please wait 30 seconds before submitting again.';
      return;
    }
    lastSubmitAt = Date.now();

    if (form.company.value) return;

    if (!isValidUKPhone(form.phone.value)) {
      errorEl.textContent = 'Please enter a valid UK phone number.';
      return;
    }
    if (!isValidUKPostcode(formatPostcode(form.postcode.value))) {
      errorEl.textContent = 'Please enter a valid UK postcode.';
      return;
    }

    const towerHireOnly = form.tower_hire_only.value === 'Yes';
    if (towerHireOnly && !CONFIG.TOWER_HIRE_ALLOWED) {
      errorEl.textContent = 'We don’t supply tower hire-only. For erected scaffolding quotes, select No.';
      return;
    }

    const upload = form.querySelector('#photos');
    if (upload.files.length > 3) {
      errorEl.textContent = 'Please upload up to 3 images.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const ok = await submitForm(form, attribution);
      if (!ok) throw new Error('Webhook failed');
      window.location.href = 'thank-you.html';
    } catch (err) {
      errorEl.textContent = 'Could not send right now. Please call us to continue your quote.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send quote request';
    }
  });
}

applyConfig();
bindPhotoPreview();
stickyCta();
formHandler();
