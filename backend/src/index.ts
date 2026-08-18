import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from './db'

const app = express()

const PORT = Number(process.env.PORT) || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'spendwise_secret_123'

app.use(cors())
app.use(express.json())

interface AuthRequest extends express.Request {
  userId?: number
}

// ==================== HEALTH ====================

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// ==================== AUTH MIDDLEWARE ====================

const authMiddleware = (
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : undefined

  if (!token) {
    return res.status(401).json({ error: 'No token. Please login' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// ==================== REGISTER ====================

app.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already exists'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    return res.status(201).json({
      message: 'User created',
      userId: user.id
    })
  } catch (error) {
    console.error('REGISTER ERROR:', error)
    return res.status(500).json({
      error: 'Registration failed'
    })
  }
})

// ==================== LOGIN ====================

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      })
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    )

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      })
    }

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('LOGIN ERROR:', error)
    return res.status(500).json({
      error: 'Login failed'
    })
  }
})

// ==================== GET EXPENSES ====================

app.get('/expenses', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { search, category } = req.query

    const where: any = {
      userId: req.userId!
    }

    if (typeof search === 'string' && search.trim()) {
      where.title = {
        contains: search.trim(),
        mode: 'insensitive'
      }
    }

    if (
      typeof category === 'string' &&
      category.trim() &&
      category !== 'All'
    ) {
      where.category = {
        name: category
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: true,
        category: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    const formatted = expenses.map(expense => ({
      _id: expense.id,
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      category: expense.category.name,
      user: expense.user.name
    }))

    return res.json(formatted)
  } catch (error) {
    console.error('GET EXPENSES ERROR:', error)

    return res.status(500).json({
      error: 'Failed to fetch expenses'
    })
  }
})
// ==================== GET SINGLE EXPENSE ====================

app.get('/expenses/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'Invalid expense ID'
      })
    }

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: req.userId!
      },
      include: {
        user: true,
        category: true
      }
    })

    if (!expense) {
      return res.status(404).json({
        error: 'Expense not found'
      })
    }

    return res.json({
      _id: expense.id,
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      category: expense.category.name,
      user: expense.user.name
    })
  } catch (error) {
    console.error('GET SINGLE EXPENSE ERROR:', error)

    return res.status(500).json({
      error: 'Failed to fetch expense'
    })
  }
})

// ==================== CREATE EXPENSE ====================

app.post('/expenses', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      title,
      amount,
      category,
      date,
      description
    } = req.body

    if (!title || !amount || !category) {
      return res.status(400).json({
        error: 'Title, amount and category are required'
      })
    }

    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0'
      })
    }

    const expenseDate = date ? new Date(date) : new Date()

    if (Number.isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date'
      })
    }

    let cat = await prisma.category.findUnique({
      where: { name: category }
    })

    if (!cat) {
      cat = await prisma.category.create({
        data: { name: category }
      })
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: numericAmount,
        userId: req.userId!,
        categoryId: cat.id,
        date: expenseDate,
        description: description || ''
      },
      include: {
        user: true,
        category: true
      }
    })

    return res.status(201).json({
      _id: expense.id,
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      category: expense.category.name,
      user: expense.user.name
    })
  } catch (error) {
    console.error('CREATE EXPENSE ERROR:', error)

    return res.status(500).json({
      error: 'Failed to create expense'
    })
  }
})

// ==================== UPDATE EXPENSE ====================

app.put('/expenses/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: 'Invalid expense ID'
      })
    }

    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        userId: req.userId!
      }
    })

    if (!existingExpense) {
      return res.status(404).json({
        error: 'Expense not found'
      })
    }

    const {
      title,
      amount,
      category,
      date,
      description
    } = req.body

    if (!title || !amount || !category) {
      return res.status(400).json({
        error: 'Title, amount and category are required'
      })
    }

    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0'
      })
    }

    const expenseDate = date ? new Date(date) : existingExpense.date

    if (Number.isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date'
      })
    }

    let cat = await prisma.category.findUnique({
      where: { name: category }
    })

    if (!cat) {
      cat = await prisma.category.create({
        data: { name: category }
      })
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        title,
        amount: numericAmount,
        categoryId: cat.id,
        date: expenseDate,
        description: description || ''
      },
      include: {
        user: true,
        category: true
      }
    })

    return res.json({
      _id: updated.id,
      title: updated.title,
      amount: updated.amount,
      date: updated.date,
      description: updated.description,
      category: updated.category.name,
      user: updated.user.name
    })
  } catch (error) {
    console.error('UPDATE EXPENSE ERROR:', error)

    return res.status(500).json({
      error: 'Failed to update expense'
    })
  }
})

// ==================== DELETE EXPENSE ====================

app.delete(
  '/expenses/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id)

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          error: 'Invalid expense ID'
        })
      }

      const expense =
        await prisma.expense.findFirst({
          where: {
            id,
            userId: req.userId!
          }
        })

      if (!expense) {
        return res.status(404).json({
          error: 'Expense not found'
        })
      }

      await prisma.expense.delete({
        where: {
          id: expense.id
        }
      })

      return res.json({
        message: 'Expense deleted successfully'
      })
    } catch (error) {
      console.error(
        'DELETE EXPENSE ERROR:',
        error
      )

      return res.status(500).json({
        error: 'Failed to delete expense'
      })
    }
  }
)

// ==================== CATEGORIES ====================

app.get('/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return res.json(categories)
  } catch (error) {
    console.error('GET CATEGORIES ERROR:', error)

    return res.status(500).json({
      error: 'Failed to fetch categories'
    })
  }
})

// Export for Jest/Supertest
export default app

// Start server only when this file is run directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`)
  })
}