import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
}))

import Dashboard from '../src/app/page'

test('shows dashboard title', () => {
  render(<Dashboard />)
  expect(screen.getByText(/SpendWise/i)).toBeInTheDocument()
})

test('shows button', () => {
  render(<Dashboard />)
 expect(screen.getByRole('button', { name: /Add Expense/i })).toBeInTheDocument()
})