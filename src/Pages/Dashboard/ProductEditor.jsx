import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function ProductEditor() {
  const [product, setProduct] = useState(null)
  const [offers, setOffers] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newColorName, setNewColorName] = useState('')
  const [newColorHex, setNewColorHex] = useState('#C4326B')
  const [message, setMessage] = useState('')

  useEffect(() => {
  loadData()
}, [])

  async function loadData() {
    const { data: productData } = await supabase.from('product').select('*').single()
    const { data: offersData } = await supabase.from('offers').select('*').order('sort_order')
    setProduct(productData)
    setOffers(offersData || [])
  }

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  // ---------- IMAGES ----------
  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)

    const fileName = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)

    if (uploadError) {
      flash('خطأ في رفع الصورة')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    const updatedImages = [...(product.carousel_images || []), urlData.publicUrl]

    const { error: updateError } = await supabase
      .from('product')
      .update({ carousel_images: updatedImages })
      .eq('id', product.id)

    setUploading(false)

    if (!updateError) {
      setProduct({ ...product, carousel_images: updatedImages })
      flash('تمت إضافة الصورة')
    }
  }

  async function removeImage(url) {
    const updatedImages = product.carousel_images.filter((img) => img !== url)
    const { error } = await supabase
      .from('product')
      .update({ carousel_images: updatedImages })
      .eq('id', product.id)

    if (!error) {
      setProduct({ ...product, carousel_images: updatedImages })
      flash('تم حذف الصورة')
    }
  }

  // ---------- COLORS ----------
  async function addColor() {
    if (!newColorName.trim()) return
    const updatedColors = [
      ...(product.available_colors || []),
      `${newColorName}|${newColorHex}`,
    ]
    const { error } = await supabase
      .from('product')
      .update({ available_colors: updatedColors })
      .eq('id', product.id)

    if (!error) {
      setProduct({ ...product, available_colors: updatedColors })
      setNewColorName('')
      flash('تمت إضافة اللون')
    }
  }

  async function removeColor(colorEntry) {
    const updatedColors = product.available_colors.filter((c) => c !== colorEntry)
    const { error } = await supabase
      .from('product')
      .update({ available_colors: updatedColors })
      .eq('id', product.id)

    if (!error) {
      setProduct({ ...product, available_colors: updatedColors })
      flash('تم حذف اللون')
    }
  }

  // ---------- OFFERS ----------
  function updateOfferField(id, field, value) {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    )
  }

  async function saveOffer(offer) {
    setSaving(true)
    const { error } = await supabase
      .from('offers')
      .update({
        quantity: Number(offer.quantity),
        price: Number(offer.price),
        original_price: offer.original_price ? Number(offer.original_price) : null,
        label: offer.label,
      })
      .eq('id', offer.id)
    setSaving(false)
    if (!error) flash('تم حفظ العرض')
  }

  // ---------- PRODUCT TEXT ----------
  async function saveProductText() {
    setSaving(true)
    const { error } = await supabase
      .from('product')
      .update({ name: product.name, description: product.description })
      .eq('id', product.id)
    setSaving(false)
    if (!error) flash('تم حفظ معلومات المنتج')
  }

  if (!product) return <div>...جارٍ التحميل</div>

  return (
    <div className="space-y-8 max-w-2xl">
      {message && (
        <div className="bg-green-100 text-green-700 text-sm px-4 py-2 rounded-lg">
          {message}
        </div>
      )}

      {/* PRODUCT INFO */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-bold mb-4">معلومات المنتج</h2>
        <input
          type="text"
          value={product.name || ''}
          onChange={(e) => setProduct({ ...product, name: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          placeholder="اسم المنتج"
        />
        <textarea
          value={product.description || ''}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          rows={3}
          placeholder="وصف المنتج"
        />
        <button
          onClick={saveProductText}
          disabled={saving}
          className="bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          حفظ
        </button>
      </section>

      {/* CAROUSEL IMAGES */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-bold mb-4">صور الهيدر (الكاروسيل)</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(product.carousel_images || []).map((img) => (
            <div key={img} className="relative">
              <img src={img} alt="" className="w-full aspect-square object-cover rounded-lg" />
              <button
                onClick={() => removeImage(img)}
                className="absolute top-1 left-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <label className="inline-block bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-lg cursor-pointer">
          {uploading ? '...جارٍ الرفع' : '+ إضافة صورة'}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
        </label>
      </section>

      {/* COLORS */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-bold mb-4">الألوان المتوفرة</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {(product.available_colors || []).map((entry) => {
            const [name, hex] = entry.split('|')
            return (
              <div key={entry} className="flex items-center gap-2 border rounded-full pl-1 pr-3 py-1">
                <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: hex }} />
                <span className="text-xs">{name}</span>
                <button onClick={() => removeColor(entry)} className="text-red-500 text-xs font-bold">✕</button>
              </div>
            )
          })}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="اسم اللون"
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1"
          />
          <input
            type="color"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="w-10 h-10 rounded-lg border cursor-pointer"
          />
          <button
            onClick={addColor}
            className="bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-lg"
          >
            إضافة
          </button>
        </div>
      </section>

      {/* OFFERS */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-bold mb-4">العروض والأسعار</h2>
        <div className="space-y-4">
          {offers.map((offer) => (
            <div key={offer.id} className="border rounded-lg p-4">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <label className="text-xs text-gray-500">عدد الألوان</label>
                  <input
                    type="number"
                    value={offer.quantity}
                    onChange={(e) => updateOfferField(offer.id, 'quantity', e.target.value)}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">السعر</label>
                  <input
                    type="number"
                    value={offer.price}
                    onChange={(e) => updateOfferField(offer.id, 'price', e.target.value)}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">السعر الأصلي</label>
                  <input
                    type="number"
                    value={offer.original_price || ''}
                    onChange={(e) => updateOfferField(offer.id, 'original_price', e.target.value)}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => saveOffer(offer)}
                disabled={saving}
                className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg mt-1"
              >
                حفظ العرض
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}