import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data } = await supabase.from('site_settings').select('*').single()
    setSettings(data)
  }

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('site_settings')
      .update({
        phone_number: settings.phone_number,
        email: settings.email,
        facebook_pixel_id: settings.facebook_pixel_id,
        instagram_url: settings.instagram_url,
        facebook_url: settings.facebook_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id)
    setSaving(false)
    if (!error) flash('تم حفظ الإعدادات')
  }

  if (!settings) return <div>...جارٍ التحميل</div>

  return (
    <div className="max-w-xl space-y-6">
      {message && (
        <div className="bg-green-100 text-green-700 text-sm px-4 py-2 rounded-lg">
          {message}
        </div>
      )}

      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold">معلومات التواصل</h2>

        <div>
          <label className="text-xs text-gray-500 block mb-1">رقم الهاتف</label>
          <input
            type="text"
            value={settings.phone_number || ''}
            onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="07.83.91.69.24"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            value={settings.email || ''}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">رابط انستغرام</label>
          <input
            type="text"
            value={settings.instagram_url || ''}
            onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="https://instagram.com/..."
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">رابط فيسبوك</label>
          <input
            type="text"
            value={settings.facebook_url || ''}
            onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="https://facebook.com/..."
          />
        </div>
      </section>

      <section className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold">Facebook Pixel</h2>
        <p className="text-xs text-gray-500">
          الصق رقم الـ Pixel ID هنا، وسيتم تفعيله تلقائيًا في صفحة الهبوط لتتبع الزيارات والطلبات
        </p>
        <input
          type="text"
          value={settings.facebook_pixel_id || ''}
          onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="123456789012345"
        />
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-gray-900 text-white text-sm font-bold px-6 py-3 rounded-lg"
      >
        {saving ? '...جارٍ الحفظ' : 'حفظ الإعدادات'}
      </button>
    </div>
  )
}