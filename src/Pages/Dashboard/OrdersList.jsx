import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'قيد الانتظار', color: '#D4A537' },
  { value: 'confirmed', label: 'مؤكد', color: '#1F6FB2' },
  { value: 'delivered', label: 'تم التوصيل', color: '#1F8A83' },
  { value: 'cancelled', label: 'ملغي', color: '#C4326B' },
]

function statusStyle(status) {
  const found = STATUS_OPTIONS.find((s) => s.value === status)
  return found || STATUS_OPTIONS[0]
}

function groupColors(colors) {
  const counts = {}
  ;(colors || []).forEach((hex) => {
    counts[hex] = (counts[hex] || 0) + 1
  })
  return Object.entries(counts).map(([hex, count]) => ({ hex, count }))
}

export default function OrdersList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(orderId, newStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
  }

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  if (loading) return <div>...جارٍ التحميل</div>

  return (
    <div className="max-w-3xl space-y-4">
      {/* FILTER TABS */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`text-sm font-bold px-3 py-1.5 rounded-full border ${
            filter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          الكل ({orders.length})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`text-sm font-bold px-3 py-1.5 rounded-full border ${
              filter === s.value ? 'text-white border-transparent' : 'bg-white text-gray-500 border-gray-200'
            }`}
            style={filter === s.value ? { backgroundColor: s.color } : {}}
          >
            {s.label} ({orders.filter((o) => o.status === s.value).length})
          </button>
        ))}
      </div>

      {/* ORDERS */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center text-sm text-gray-400">
          لا توجد طلبات
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const style = statusStyle(order.status)
            const groupedColors = groupColors(order.selected_colors)
            return (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold">{order.customer_name}</div>
                    <div className="text-sm text-gray-500">{order.phone}</div>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="text-xs font-bold px-2 py-1.5 rounded-lg border"
                    style={{ borderColor: style.color, color: style.color }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  {order.wilaya && <span>{order.wilaya} — </span>}
                  {order.address}
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {order.quantity} ألوان:
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {groupedColors.map(({ hex, count }, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: hex }}
                          />
                          {count > 1 && (
                            <span className="text-xs text-gray-500 font-bold">
                              ×{count}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="font-bold text-sm">{order.total_price} دج</div>
                </div>

                <div className="text-xs text-gray-400 mt-2">
                  {new Date(order.created_at).toLocaleString('ar-DZ')}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}