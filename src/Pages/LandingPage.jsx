import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LandingPage() {
  const [product, setProduct] = useState(null);
  const [offers, setOffers] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedColorCounts, setSelectedColorCounts] = useState({});
  const [heroIndex, setHeroIndex] = useState(0);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    wilaya: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const availableColors = (product?.available_colors || []).map((entry) => {
    const [name, hex] = entry.split("|");
    return { name, hex };
  });

  const totalColorsSelected = Object.values(selectedColorCounts).reduce(
    (a, b) => a + b,
    0,
  );

  useEffect(() => {
    async function load() {
      const { data: productData } = await supabase
        .from("product")
        .select("*")
        .single();
      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .order("sort_order");
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("*")
        .single();
      setProduct(productData);
      setOffers(offersData || []);
      setSiteSettings(settingsData);
    }
    load();
  }, []);

  useEffect(() => {
    if (!product?.carousel_images?.length) return;
    const interval = setInterval(() => {
      setHeroIndex((i) => (i + 1) % product.carousel_images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [product]);

  useEffect(() => {
    if (!siteSettings?.facebook_pixel_id) return;

    const id = siteSettings.facebook_pixel_id;

    if (window.fbq) {
      window.fbq("init", id);
      window.fbq("track", "PageView");
      return;
    }

    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    window.fbq("init", id);
    window.fbq("track", "PageView");
  }, [siteSettings]);

  function pickOffer(offer) {
    setSelectedOffer(offer);
    setSelectedColorCounts({});
  }

  function incrementColor(hex) {
    if (!selectedOffer) return;
    setSelectedColorCounts((prev) => {
      const total = Object.values(prev).reduce((a, b) => a + b, 0);
      if (total >= selectedOffer.quantity) return prev;
      return { ...prev, [hex]: (prev[hex] || 0) + 1 };
    });
  }

  function decrementColor(hex) {
    setSelectedColorCounts((prev) => {
      const current = prev[hex] || 0;
      if (current <= 1) {
        const { [hex]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [hex]: current - 1 };
    });
  }

  const canSubmit =
    selectedOffer &&
    totalColorsSelected > 0 &&
    form.name.trim() &&
    form.phone.trim() &&
    form.address.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const selectedColorsArray = Object.entries(selectedColorCounts).flatMap(
      ([hex, count]) => Array(count).fill(hex),
    );

    const { error } = await supabase.from("orders").insert({
      customer_name: form.name,
      phone: form.phone,
      address: form.address,
      wilaya: form.wilaya,
      offer_id: selectedOffer.id,
      quantity: selectedOffer.quantity,
      selected_colors: selectedColorsArray,
      total_price: selectedOffer.price,
      status: "pending",
    });
    setSubmitting(false);
    if (!error) {
      if (window.fbq) {
        window.fbq("track", "Lead", {
          value: selectedOffer.price,
          currency: "DZD",
        });
      }
      setSubmitted(true);
      setForm({ name: "", phone: "", address: "", wilaya: "" });
      setSelectedOffer(null);
      setSelectedColorCounts({});
    }
  }

  function scrollToForm() {
    document
      .getElementById("order-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  const DotRibbon = () => (
    <div
      className="flex items-center justify-center gap-3 py-6"
      aria-hidden="true"
    >
      {["#C4326B", "#D4A537", "#1F8A83", "#7A4FB5", "#E0752B", "#1F6FB2"].map(
        (c, i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              backgroundColor: c,
              width: i % 2 === 0 ? "10px" : "6px",
              height: i % 2 === 0 ? "10px" : "6px",
              opacity: 0.8,
            }}
          />
        ),
      )}
    </div>
  );

  return (
    <div
      dir="rtl"
      className="min-h-screen text-[var(--paper)]"
      style={{ backgroundColor: "var(--ink)" }}
    >
      {/* ORDER CONFIRMATION POPUP */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
              style={{ backgroundColor: "var(--teal)", color: "white" }}
            >
              ✓
            </div>
            <h3 className="font-display text-xl font-extrabold mb-2">
              تم استلام طلبك بنجاح
            </h3>
            <p className="text-sm text-black/60 mb-6">
              سنتصل بك قريبًا لتأكيد الطلب. الدفع عند الاستلام.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="w-full font-display font-bold py-3 rounded-full"
              style={{ backgroundColor: "var(--gold)", color: "var(--ink)" }}
            >
              حسنًا
            </button>
          </div>
        </div>
      )}

      {/* ============ DESKTOP HERO + BUY BOX (lg and up) ============ */}
      <section className="hidden lg:block px-8 xl:px-16 pt-10 pb-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-12 items-start">
          {/* LEFT: image carousel */}
          <div>
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden">
              {product?.carousel_images?.length ? (
                product.carousel_images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                    style={{ opacity: i === heroIndex ? 1 : 0 }}
                  />
                ))
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1f1f27]">
                  <span className="font-display text-3xl text-[var(--gold)]">
                    ملونات ميكا
                  </span>
                </div>
              )}
              {product?.carousel_images?.length > 1 && (
                <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
                  {product.carousel_images.map((_, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          i === heroIndex ? "var(--gold)" : "rgba(247,244,239,0.4)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* thumbnail strip */}
            {product?.carousel_images?.length > 1 && (
              <div className="flex gap-3 mt-4">
                {product.carousel_images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIndex(i)}
                    className="w-16 h-16 rounded-xl overflow-hidden border-2"
                    style={{
                      borderColor: i === heroIndex ? "var(--gold)" : "transparent",
                    }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: buy box */}
          <div>
            <h1 className="font-display text-4xl xl:text-5xl font-black text-[var(--paper)] mb-4">
              {product?.name || "ملونات ميكا"}
            </h1>
            <p className="text-base text-[var(--paper)]/70 leading-relaxed mb-8 max-w-lg">
              {product?.description ||
                "الاستعمالات: تلوين الصابون، مستحضرات التجميل، الشموع، Résine، epoxy، الطلاء"}
            </p>

            <div
              className="rounded-2xl p-7"
              style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}
            >
              <h2 className="font-display text-xl font-extrabold mb-1">
                استمارة الطلب
              </h2>
              <p className="text-sm text-black/60 mb-5">
                اختر العرض ثم اختر ألوانك
              </p>
              <DesktopOrderForm
                offers={offers}
                selectedOffer={selectedOffer}
                pickOffer={pickOffer}
                availableColors={availableColors}
                selectedColorCounts={selectedColorCounts}
                totalColorsSelected={totalColorsSelected}
                incrementColor={incrementColor}
                decrementColor={decrementColor}
                form={form}
                setForm={setForm}
                canSubmit={canSubmit}
                submitting={submitting}
                handleSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ MOBILE HERO (below lg) ============ */}
      <section className="lg:hidden relative w-full aspect-[4/3] sm:aspect-[16/7] overflow-hidden">
        {product?.carousel_images?.length ? (
          product.carousel_images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={{ opacity: i === heroIndex ? 1 : 0 }}
            />
          ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1f1f27]">
            <span className="font-display text-2xl text-[var(--gold)]">
              ملونات ميكا
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent" />
        {product?.carousel_images?.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {product.carousel_images.map((_, i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    i === heroIndex ? "var(--gold)" : "rgba(247,244,239,0.4)",
                }}
              />
            ))}
          </div>
        )}
      </section>

      <div className="lg:hidden">
        {/* TITLE + CTA */}
        <section className="px-5 pt-8 pb-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-black text-[var(--paper)]">
            {product?.name || "ملونات ميكا"}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--paper)]/70 leading-relaxed max-w-md mx-auto">
            {product?.description ||
              "الاستعمالات: تلوين الصابون، مستحضرات التجميل، الشموع، Résine، epoxy، الطلاء"}
          </p>
          <button
            onClick={scrollToForm}
            className="mt-6 font-display font-bold text-lg px-8 py-3 rounded-full"
            style={{ backgroundColor: "var(--gold)", color: "var(--ink)" }}
          >
            اطلب الآن
          </button>
        </section>

        <DotRibbon />

        {/* MOBILE ORDER FORM */}
        <section id="order-form" className="px-4 pb-10">
          <div
            className="max-w-xl mx-auto rounded-2xl p-5 sm:p-7"
            style={{ backgroundColor: "var(--paper)", color: "var(--ink)" }}
          >
            <h2 className="font-display text-xl font-extrabold mb-1">
              استمارة الطلب
            </h2>
            <p className="text-sm text-black/60 mb-5">
              اختر العرض ثم اختر ألوانك
            </p>
            <DesktopOrderForm
              offers={offers}
              selectedOffer={selectedOffer}
              pickOffer={pickOffer}
              availableColors={availableColors}
              selectedColorCounts={selectedColorCounts}
              totalColorsSelected={totalColorsSelected}
              incrementColor={incrementColor}
              decrementColor={decrementColor}
              form={form}
              setForm={setForm}
              canSubmit={canSubmit}
              submitting={submitting}
              handleSubmit={handleSubmit}
            />
          </div>
        </section>
      </div>

      <DotRibbon />

      {/* TRUST BADGES */}
      <section className="px-4 lg:px-8 pb-10 lg:pb-14">
        <div className="max-w-xl lg:max-w-4xl mx-auto grid grid-cols-3 gap-3 lg:gap-6 text-center">
          {[
            { label: "توصيل سريع", icon: "🚚" },
            { label: "الدفع عند الاستلام", icon: "💵" },
            { label: "جودة مضمونة", icon: "✨" },
          ].map((b) => (
            <div
              key={b.label}
              className="rounded-xl lg:rounded-2xl p-4 lg:p-6"
              style={{ backgroundColor: "rgba(247,244,239,0.06)" }}
            >
              <div className="text-2xl lg:text-3xl mb-1 lg:mb-2">{b.icon}</div>
              <div className="text-xs lg:text-sm text-[var(--paper)]/80">{b.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT SHOWCASE */}
      <section className="px-4 lg:px-8 pb-14 lg:pb-20">
        <div className="max-w-xl lg:max-w-3xl mx-auto text-center mb-6 lg:mb-10">
          <h2 className="font-display text-2xl lg:text-4xl font-extrabold">
            أكثر من 20 لون
          </h2>
          <p className="text-sm lg:text-base text-[var(--paper)]/70 mt-2 lg:mt-3">
            مثالية لتلوين الصابون، الشموع، الراتنج، والإبوكسي بجودة احترافية
          </p>
        </div>
        <div className="max-w-xl lg:max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          {product?.carousel_images?.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="w-full aspect-square object-cover rounded-xl lg:rounded-2xl"
            />
          ))}
        </div>
      </section>

      {/* STICKY CTA (mobile only) */}
      <div
        className="lg:hidden sticky bottom-0 left-0 right-0 p-3 backdrop-blur border-t border-white/10"
        style={{ backgroundColor: "rgba(20,20,26,0.92)" }}
      >
        <button
          onClick={scrollToForm}
          className="w-full font-display font-bold py-3 rounded-full"
          style={{ backgroundColor: "var(--gold)", color: "var(--ink)" }}
        >
          اطلب الآن
        </button>
      </div>
    </div>
  );
}

function DesktopOrderForm({
  offers,
  selectedOffer,
  pickOffer,
  availableColors,
  selectedColorCounts,
  totalColorsSelected,
  incrementColor,
  decrementColor,
  form,
  setForm,
  canSubmit,
  submitting,
  handleSubmit,
}) {
  return (
    <div>
      {/* OFFERS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {offers.map((offer) => {
          const active = selectedOffer?.id === offer.id;
          return (
            <button
              key={offer.id}
              onClick={() => pickOffer(offer)}
              className="rounded-xl p-4 text-right border-2 transition"
              style={{
                borderColor: active ? "var(--magenta)" : "rgba(0,0,0,0.1)",
                backgroundColor: active ? "rgba(196,50,107,0.06)" : "white",
              }}
            >
              <div className="font-display font-bold text-base">
                {offer.quantity} ألوان
              </div>
              <div className="mt-1 flex items-center gap-2">
                {offer.original_price && (
                  <span className="text-xs line-through text-black/40">
                    {offer.original_price} دج
                  </span>
                )}
                <span className="font-bold" style={{ color: "var(--magenta)" }}>
                  {offer.price} دج
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-black/50 text-center mb-6">
        للطلب بكميات اكبر يرجى التواصل معنا على الرقم{" "}
        <a href="tel:0783916924" className="font-bold" style={{ color: "var(--magenta)" }}>
          07.83.91.69.24
        </a>
      </p>

      {/* COLOR PICKER */}
      {selectedOffer && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">اختر الألوان</h3>
            <span
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{
                backgroundColor:
                  totalColorsSelected > 0 ? "var(--teal)" : "rgba(0,0,0,0.08)",
                color: totalColorsSelected > 0 ? "white" : "black",
              }}
            >
              {totalColorsSelected}/{selectedOffer.quantity}
            </span>
          </div>

          {availableColors.length === 0 ? (
            <p className="text-xs text-black/50">لم يتم إضافة الألوان بعد</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {availableColors.map((c) => {
                const count = selectedColorCounts[c.hex] || 0;
                const capReached = totalColorsSelected >= selectedOffer.quantity;
                return (
                  <div key={c.hex} className="flex flex-col items-center gap-1 w-14">
                    <button
                      type="button"
                      disabled={capReached && count === 0}
                      onClick={() => incrementColor(c.hex)}
                      className="relative"
                      style={{ opacity: capReached && count === 0 ? 0.35 : 1 }}
                    >
                      <span
                        className="w-9 h-9 rounded-full border-2 block"
                        style={{
                          backgroundColor: c.hex,
                          borderColor: count > 0 ? "var(--magenta)" : "transparent",
                          boxShadow:
                            count > 0
                              ? "0 0 0 2px var(--paper), 0 0 0 3px var(--magenta)"
                              : "none",
                        }}
                      />
                      {count > 0 && (
                        <span
                          className="absolute -top-1.5 -right-1.5 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                          style={{ backgroundColor: "var(--magenta)", color: "white" }}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                    <span className="text-[10px] text-black/60">{c.name}</span>
                    {count > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          type="button"
                          onClick={() => decrementColor(c.hex)}
                          className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                          style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          disabled={capReached}
                          onClick={() => incrementColor(c.hex)}
                          className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center disabled:opacity-30"
                          style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CUSTOMER INFO */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="الاسم الكامل"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[var(--magenta)]"
        />
        <input
          type="tel"
          placeholder="رقم الهاتف"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full rounded-lg border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[var(--magenta)]"
        />
        <input
          type="text"
          placeholder="الولاية"
          value={form.wilaya}
          onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
          className="w-full rounded-lg border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[var(--magenta)]"
        />
        <textarea
          placeholder="العنوان بالتفصيل"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-black/15 px-4 py-3 text-sm focus:outline-none focus:border-[var(--magenta)]"
        />

        {selectedOffer && (
          <div className="flex items-center justify-between pt-2 text-sm font-bold">
            <span>المجموع</span>
            <span style={{ color: "var(--magenta)" }}>{selectedOffer.price} دج</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="w-full font-display font-bold text-lg py-3 rounded-full mt-2 disabled:opacity-40"
          style={{ backgroundColor: "var(--magenta)", color: "white" }}
        >
          {submitting ? "...جارٍ الإرسال" : "تأكيد الطلب — الدفع عند الاستلام"}
        </button>
      </form>
    </div>
  );
}