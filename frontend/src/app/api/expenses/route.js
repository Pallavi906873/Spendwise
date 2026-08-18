import { NextResponse } from "next/server"

const BACKEND_URL = "http://localhost:3000"

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/expenses`)
    if (!res.ok) return NextResponse.json([])
    const text = await res.text()
    const data = text ? JSON.parse(text) : []
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json([])
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: "Backend down" }, { status: 500 })
  }
}