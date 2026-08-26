import request from 'supertest'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import app from './index'
import prisma from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'spendwise_secret_123'

describe('SpendWise API', () => {
  let userId: number
  let token: string
  let expenseId: number

  beforeAll(async () => {
    const email = `test-${Date.now()}@example.com`
    const password = await bcrypt.hash('password123', 10)

    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        password
      }
    })

    userId = user.id

    token = jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: '1h' }
    )
  })

  afterAll(async () => {
    await prisma.expense.deleteMany({
      where: { userId }
    })

    await prisma.user.delete({
      where: { id: userId }
    })

    await prisma.$disconnect()
  })

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const res = await request(app).get('/health')

      expect(res.status).toBe(200)
      expect(res.body).toEqual({ status: 'ok' })
    })
  })

  describe('Authentication', () => {
    it('should reject /expenses without a token', async () => {
      const res = await request(app).get('/expenses')

      expect(res.status).toBe(401)
    })
  })

  describe('Expenses', () => {
    it('should create an expense', async () => {
      const res = await request(app)
        .post('/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Expense',
          amount: 100,
          category: 'Food',
          description: 'Testing',
          date: '2026-08-13'
        })

      expect(res.status).toBe(201)
      expect(res.body.title).toBe('Test Expense')
      expect(res.body.amount).toBe(100)

      expenseId = res.body._id
    })

    it('should return the user expenses', async () => {
      const res = await request(app)
        .get('/expenses')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.some((expense: any) => expense._id === expenseId)).toBe(true)
    })

    it('should search expenses by title', async () => {
      const res = await request(app)
        .get('/expenses?search=Test')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('should update an expense', async () => {
      const res = await request(app)
        .put(`/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Expense',
          amount: 150,
          category: 'Food',
          description: 'Updated',
          date: '2026-08-13'
        })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Updated Expense')
      expect(res.body.amount).toBe(150)
    })

    it('should reject an invalid amount', async () => {
      const res = await request(app)
        .post('/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Invalid Expense',
          amount: -50,
          category: 'Food'
        })

      expect(res.status).toBe(400)
    })

    it('should delete an expense', async () => {
      const res = await request(app)
        .delete(`/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Expense deleted successfully')
    })
  })
})