'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const router = useRouter()

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null

  const API = 'http://localhost:3000'

  // ================= FETCH CATEGORIES =================

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API}/categories`)

      if (!res.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await res.json()

      setCategories(data)

      if (data.length > 0 && !category) {
        setCategory(data[0].name)
      }
    } catch (err) {
      console.error('Category error:', err)
      setError('Failed to load categories')
    }
  }, [category])

  // ================= FETCH EXPENSES =================

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)

      let url = `${API}/expenses`

      const params = []

      if (search) {
        params.push(`search=${encodeURIComponent(search)}`)
      }

      if (filterCat) {
        params.push(`category=${encodeURIComponent(filterCat)}`)
      }

      if (params.length > 0) {
        url += '?' + params.join('&')
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch expenses')
      }

      const data = await res.json()

      setExpenses(data)
    } catch (err) {
      console.error('Expense error:', err)
      setError('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [search, filterCat, token])

  // ================= AUTH + INITIAL LOAD =================

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchCategories()
    fetchExpenses()
  }, [token, router, fetchCategories, fetchExpenses])

  // ================= SAVE EXPENSE =================

  const handleSave = async () => {
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!amount || Number(amount) <= 0) {
      setError('Valid amount is required')
      return
    }

    if (!category) {
      setError('Category is required')
      return
    }

    const body = {
      title: title.trim(),
      amount: Number(amount),
      category,
      description: description.trim(),
      date,
    }

    const method = editingId ? 'PUT' : 'POST'

    const url = editingId
      ? `${API}/expenses/${editingId}`
      : `${API}/expenses`

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Something went wrong')
        return
      }

      resetForm()

      await fetchExpenses()
    } catch (err) {
      console.error('Save error:', err)
      setError('Unable to save expense')
    }
  }

  // ================= EDIT EXPENSE =================

  const handleEdit = (expense) => {
    setEditingId(expense._id)

    setTitle(expense.title)
    setAmount(expense.amount)
    setCategory(expense.category)
    setDescription(expense.description || '')

    setDate(
      expense.date
        ? expense.date.split('T')[0]
        : new Date().toISOString().split('T')[0]
    )

    setError('')
  }

  // ================= DELETE EXPENSE =================

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) {
      return
    }

    try {
      const res = await fetch(`${API}/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error('Delete failed')
      }

      await fetchExpenses()
    } catch (err) {
      console.error('Delete error:', err)
      setError('Unable to delete expense')
    }
  }

  // ================= RESET FORM =================

  const resetForm = () => {
    setEditingId(null)

    setTitle('')
    setAmount('')
    setCategory(categories[0]?.name || '')
    setDescription('')

    setDate(new Date().toISOString().split('T')[0])

    setError('')
  }

  // ================= LOGOUT =================

  const logout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  // ================= TOTAL =================

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  )

  // ================= UI =================

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '30px',
        background: '#f5f7fb',
      }}
    >
      {/* ================= HEADER ================= */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '700',
            }}
          >
            SpendWise
          </h1>

          <p
            style={{
              marginTop: '5px',
              color: '#666',
            }}
          >
            Expense Dashboard
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderRadius: '8px',
            background: '#dc3545',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Logout
        </button>
      </div>

      {/* ================= SUMMARY ================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <p style={{ margin: 0, color: '#777' }}>
            Total Expenses
          </p>

          <h2 style={{ marginTop: '10px' }}>
            ₹{total.toFixed(2)}
          </h2>
        </div>

        <div
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <p style={{ margin: 0, color: '#777' }}>
            Number of Expenses
          </p>

          <h2 style={{ marginTop: '10px' }}>
            {expenses.length}
          </h2>
        </div>
      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div
          style={{
            background: '#ffe5e5',
            color: '#b00020',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* ================= ADD / EDIT FORM ================= */}

      <section
        style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <h2>
          {editingId ? 'Edit Expense' : 'Add Expense'}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginTop: '20px',
          }}
        >
          {/* TITLE */}

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />

          {/* AMOUNT */}

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          >
            <option value="">
              Select Category
            </option>

            {categories.map((cat) => (
              <option
                key={cat._id || cat.id || cat.name}
                value={cat.name}
              >
                {cat.name}
              </option>
            ))}
          </select>

          {/* DATE */}

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputStyle}
          />

          {/* DESCRIPTION */}

          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            style={inputStyle}
          />
        </div>

        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            gap: '10px',
          }}
        >
          <button
            onClick={handleSave}
            style={{
              padding: '11px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#198754',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            {editingId ? 'Update Expense' : 'Add Expense'}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              style={{
                padding: '11px 20px',
                border: 'none',
                borderRadius: '8px',
                background: '#6c757d',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      {/* ================= SEARCH / FILTER ================= */}

      <section
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '15px',
          }}
        >
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />

          <select
            value={filterCat}
            onChange={(e) =>
              setFilterCat(e.target.value)
            }
            style={inputStyle}
          >
            <option value="">
              All Categories
            </option>

            {categories.map((cat) => (
              <option
                key={cat._id || cat.id || cat.name}
                value={cat.name}
              >
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* ================= EXPENSE LIST ================= */}

      <section
        style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <h2>Expenses</h2>

        {loading ? (
          <p>Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p style={{ color: '#777' }}>
            No expenses found.
          </p>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              marginTop: '20px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td style={tdStyle}>
                      {expense.title}
                    </td>

                    <td style={tdStyle}>
                      ₹{Number(expense.amount).toFixed(2)}
                    </td>

                    <td style={tdStyle}>
                      {expense.category}
                    </td>

                    <td style={tdStyle}>
                      {expense.description || '-'}
                    </td>

                    <td style={tdStyle}>
                      {expense.date
                        ? new Date(
                            expense.date
                          ).toLocaleDateString()
                        : '-'}
                    </td>

                    <td style={tdStyle}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                        }}
                      >
                        <button
                          onClick={() =>
                            handleEdit(expense)
                          }
                          style={{
                            padding: '7px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#0d6efd',
                            color: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(expense._id)
                          }
                          style={{
                            padding: '7px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#dc3545',
                            color: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

// ================= STYLES =================

const inputStyle = {
  width: '100%',
  padding: '11px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  fontSize: '14px',
  boxSizing: 'border-box',
}

const thStyle = {
  textAlign: 'left',
  padding: '12px',
  borderBottom: '1px solid #ddd',
}

const tdStyle = {
  padding: '12px',
  borderBottom: '1px solid #eee',
}