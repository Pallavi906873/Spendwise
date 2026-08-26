'use client'
import React,{ useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('') // CHANGED: use category name not ID
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const router = useRouter()

  const token = typeof window!== 'undefined'? localStorage.getItem('token') : null
  const API = 'http://localhost:3000'

  useEffect(() => {
    if(!token) router.push('/login')
    else {
      fetchCategories()
      fetchExpenses()
    }
  }, [search, filterCat])

  const fetchCategories = async () => {
    const res = await fetch(`${API}/categories`)
    const data = await res.json()
    setCategories(data)
    if(data.length > 0 &&!category) setCategory(data[0].name)
  }

  const fetchExpenses = async () => {
    setLoading(true)
    let url = `${API}/expenses`
    const params = []
    if(search) params.push(`search=${search}`)
    if(filterCat) params.push(`category=${filterCat}`)
    if(params.length) url += '?' + params.join('&')

    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    const data = await res.json()
    setExpenses(data)
    setLoading(false)
  }

  const handleSave = async () => {
    setError('')
    if(!title) return setError("Title is required")
    if(!amount || amount <= 0) return setError("Valid amount is required")

    const body = { title, amount: Number(amount), category, description, date }
    const method = editingId? 'PUT' : 'POST'
    const url = editingId? `${API}/expenses/${editingId}` : `${API}/expenses`
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if(!res.ok){
      const err = await res.json()
      setError(err.error || "Something went wrong")
      return
    }
    resetForm()
    fetchExpenses()
  }

  const handleEdit = (e) => {
    setEditingId(e._id)
    setTitle(e.title)
    setAmount(e.amount)
    setCategory(e.category)
    setDescription(e.description || '')
    setDate(e.date? e.date.split('T')[0] : new Date().toISOString().split('T')[0])
  }

  const handleDelete = async (id) => {
    if(!confirm("Delete this expense?")) return
    await fetch(`${API}/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchExpenses()
  }

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setAmount('')
    setCategory(categories[0]?.name || '')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
    setError('')
  }

  const logout = () => { localStorage.removeItem('token'); router.push('/login') }
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">SpendWise 💰</h1>
          <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-semibold shadow">Logout</button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-lg mb-6 flex gap-3">
          <input placeholder="Search expenses..." className="border-2 p-2 rounded-lg flex-1" value={search} onChange={e => setSearch(e.target.value)}/>
          <select className="border-2 p-2 rounded-lg" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg"><p className="text-gray-500">Total Spent</p><p className="text-3xl font-bold text-indigo-600">₹{total}</p></div>
          <div className="bg-white p-6 rounded-2xl shadow-lg"><p className="text-gray-500">Total Items</p><p className="text-3xl font-bold text-indigo-600">{expenses.length}</p></div>
          <div className="bg-white p-6 rounded-2xl shadow-lg"><p className="text-gray-500">This Month</p><p className="text-3xl font-bold text-indigo-600">₹{total}</p></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">{editingId? '✏️ Edit Expense' : '➕ Add New Expense'}</h2>
          {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-3">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input className="border-2 p-3 rounded-lg" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}/>
            <input className="border-2 p-3 rounded-lg" placeholder="Amount ₹" type="number" value={amount} onChange={e => setAmount(e.target.value)}/>
            <input className="border-2 p-3 rounded-lg" type="date" value={date} onChange={e => setDate(e.target.value)}/>
            <select className="border-2 p-3 rounded-lg" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <input className="border-2 p-3 rounded-lg md:col-span-2" placeholder="Description - Optional" value={description} onChange={e => setDescription(e.target.value)}/>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow">{editingId? 'Update' : 'Add Expense'}</button>
            {editingId && <button onClick={resetForm} className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold">Cancel</button>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Your Expenses</h2>
          {loading? <p>Loading...</p> : expenses.length === 0?
            <div className="text-center py-10 text-gray-400">No expenses yet. Add your first one! 🎉</div> :
            <div className="space-y-3">
              {expenses.map(e => (
                <div key={e._id} className="border p-4 rounded-xl flex justify-between items-center hover:shadow-md transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bold text-lg">{e.title}</p>
                      <span className="text-xs px-3 py-1 rounded-full font-semibold bg-gray-100">{e.category}</span>
                    </div>
                    <p className="text-gray-600 text-sm">₹{e.amount} • {new Date(e.date).toLocaleDateString('en-IN')} • {e.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(e)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">Edit</button>
                    <button onClick={() => handleDelete(e._id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  )
}