import React from 'react'
import { render, screen } from '@testing-library/react'
import Dashboard from '../src/app/page'

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
);

test('shows dashboard title', () => {
  render(<Dashboard />)
  expect(screen.getByText(/SpendWise/i)).toBeInTheDocument() // <- CHANGED THIS
})

test('shows button', () => {
  render(<Dashboard />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})