'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCart, clearCart } from '@/lib/cart';
import { theme } from '@/lib/theme';
import { useLang } from '@/components/LangProvider';
import LangToggle from '@/components/LangToggle';
import { t, money, translateError } from '@/lib/i18n';
import { deliveryFeeFor, amountToFree } from '@/lib/shipping';
import { GOVERNORATES, SERVED, cleanMapUrl } from '@/lib/address';

export default function CheckoutPage() {
  const lang = useLang();
  const ar = lang === 'ar';
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState(SERVED[0] || 'عمّان');
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [locMsg, setLocMsg] = useState('');
  const [locBusy, setLocBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(getCart());
    setReady(true);
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const fee = deliveryFeeFor(subtotal);
  const left = amountToFree(subtotal);
  const total = subtotal + fee;

  const input = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: `1px solid ${theme.line}`,
    background: theme.card,
    fontSize: 16,
    marginTop: 6,
    outline: 'none',
    boxSizing: 'border-box',
  };
  const label = { fontSize: 14, fontWeight: 600 };

  function useMyLocation() {
    setLocMsg('');
    if (!navigator.geolocation) {
      setLocMsg(ar ? 'جهازك ما بيدعم تحديد الموقع. الصق رابط موقعك.' : 'Location is not supported. Please paste a map link.');
      return;
    }
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        setMapUrl(`https://www.google.com/maps?q=${lat},${lng}`);
        setLocMsg(ar ? 'تم تحديد موقعك ✓' : 'Location captured ✓');
        setLocBusy(false);
      },
      () => {
        setLocMsg(ar ? 'تعذّر تحديد موقعك. الصق رابط الموقع بدلاً منه.' : 'Could not get your location. Please paste a link instead.');
        setLocBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function placeOrder() {
    setError('');
    if (!name.trim() || !phone.trim() || !area.trim() || !street.trim()) {
      setError(t(lang, 'errFill'));
      return;
    }
    if (mapUrl.trim() && !cleanMapUrl(mapUrl)) {
      setError(
        ar
          ? 'رابط الموقع غير صالح. الصق رابط من خرائط Google أو اتركه فاضي.'
          : 'The location link is not valid. Paste a Google Maps link or leave it empty.'
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          governorate,
          area,
          street,
          landmark,
          mapUrl: mapUrl.trim() ? cleanMapUrl(mapUrl) : '',
          notes,
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            color: i.color,
            qty: i.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(translateError(lang, data.error));
        setLoading(false);
        return;
      }
      clearCart();
      router.push(`/order/${data.orderId}`);
    } catch {
      setError(t(lang, 'errNetwork'));
      setLoading(false);
    }
  }

  const govOptions = GOVERNORATES.filter((g) => SERVED.includes(g[0]));

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/cart" style={{ color: theme.ink, textDecoration: 'none', fontSize: 14 }}>
          {ar ? '→ ' : '← '}
          {t(lang, 'backToCart')}
        </Link>
        <LangToggle />
      </div>
      <div style={{ margin: '14px 0 16px' }}>
        <h1 style={{ fontFamily: theme.serif, fontSize: 28, fontWeight: 600, margin: 0 }}>{t(lang, 'checkout')}</h1>
        <div style={{ width: 36, height: 3, background: theme.gold, borderRadius: 2, marginTop: 6 }} />
      </div>

      {ready && items.length === 0 && <p style={{ color: theme.muted }}>{t(lang, 'cartEmpty')}</p>}

      {items.length > 0 && (
        <>
          <label style={label}>
            {t(lang, 'fullName')}
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div style={{ height: 14 }} />
          <label style={label}>
            {t(lang, 'phone')}
            <input
              style={{ ...input, textAlign: ar ? 'right' : 'left' }}
              dir="ltr"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <div style={{ marginTop: 22, fontFamily: theme.serif, fontSize: 18, fontWeight: 600 }}>
            {ar ? 'عنوان التوصيل' : 'Delivery address'}
          </div>
          <div style={{ width: 28, height: 3, background: theme.gold, borderRadius: 2, marginTop: 4 }} />

          <div style={{ height: 12 }} />
          <label style={label}>
            {ar ? 'المحافظة' : 'Governorate'}
            <select style={input} value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
              {govOptions.map(([a, e]) => (
                <option key={a} value={a}>
                  {ar ? a : e}
                </option>
              ))}
            </select>
          </label>
          <div style={{ height: 14 }} />
          <label style={label}>
            {ar ? 'المنطقة أو الحي' : 'Area / neighborhood'}
            <input
              style={input}
              value={area}
              placeholder={ar ? 'مثال: الجبيهة' : 'e.g. Jubaiha'}
              onChange={(e) => setArea(e.target.value)}
            />
          </label>
          <div style={{ height: 14 }} />
          <label style={label}>
            {ar ? 'الشارع ورقم البناية والطابق' : 'Street, building and floor'}
            <input style={input} value={street} onChange={(e) => setStreet(e.target.value)} />
          </label>
          <div style={{ height: 14 }} />
          <label style={label}>
            {ar ? 'معلم قريب (اختياري)' : 'Nearby landmark (optional)'}
            <input
              style={input}
              value={landmark}
              placeholder={ar ? 'مثال: مقابل صيدلية...' : 'e.g. opposite the pharmacy'}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </label>

          <div style={{ height: 14 }} />
          <div style={label}>{ar ? 'موقعك على الخريطة (اختياري)' : 'Your map location (optional)'}</div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 2, lineHeight: 1.7 }}>
            {ar
              ? 'بيساعد المندوب يوصلك أسرع. بنستخدمه للتوصيل بس.'
              : 'Helps the courier find you faster. Used for delivery only.'}
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locBusy}
            style={{
              marginTop: 8,
              padding: '10px 18px',
              borderRadius: 999,
              border: `1px solid ${theme.ink}`,
              background: theme.card,
              color: theme.ink,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {locBusy ? (ar ? 'جارٍ التحديد...' : 'Locating...') : ar ? '📍 استخدم موقعي' : '📍 Use my location'}
          </button>
          {locMsg && (
            <div style={{ fontSize: 13, marginTop: 6, color: locMsg.includes('✓') ? '#177a3c' : '#b00' }}>{locMsg}</div>
          )}
          <input
            style={{ ...input, marginTop: 10 }}
            dir="ltr"
            value={mapUrl}
            placeholder={ar ? 'أو الصق رابط الموقع (خرائط Google / واتساب)' : 'Or paste a map link (Google Maps / WhatsApp)'}
            onChange={(e) => setMapUrl(e.target.value)}
          />

          <div style={{ height: 14 }} />
          <label style={label}>
            {t(lang, 'notes')}
            <input style={input} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <div
            style={{
              marginTop: 16,
              background: theme.goldSoft,
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {t(lang, 'paymentCod')}
          </div>

          <div style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 14, marginTop: 18, lineHeight: 1.9 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t(lang, 'items')}</span>
              <span>{money(lang, subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t(lang, 'delivery')}</span>
              <span style={fee === 0 ? { color: '#177a3c', fontWeight: 700 } : undefined}>
                {fee === 0 ? (ar ? 'مجاني' : 'Free') : money(lang, fee)}
              </span>
            </div>
            {left > 0 && (
              <div style={{ fontSize: 12, color: theme.muted }}>
                {ar ? `أضف ${money(lang, left)} للتوصيل المجاني` : `Add ${money(lang, left)} more for free delivery`}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
              <b style={{ fontFamily: theme.serif }}>{t(lang, 'total')}</b>
              <b>{money(lang, total)}</b>
            </div>
          </div>

          {error && <p style={{ color: '#b00' }}>{error}</p>}

          <button
            type="button"
            onClick={placeOrder}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: 14,
              padding: 16,
              borderRadius: 999,
              border: 'none',
              background: loading ? '#bbb' : theme.ink,
              color: loading ? '#fff' : theme.gold,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: lang === 'en' ? 0.5 : 0,
            }}
          >
            {loading ? t(lang, 'placing') : t(lang, 'placeOrder')}
          </button>
        </>
      )}
    </main>
  );
}
