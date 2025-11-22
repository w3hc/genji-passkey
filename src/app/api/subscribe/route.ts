import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'MAILING_LIST.txt')

    // Read existing emails or create empty string if file doesn't exist
    let existingEmails = ''
    try {
      existingEmails = await fs.readFile(filePath, 'utf-8')
    } catch (error) {
      // File doesn't exist yet, will be created
    }

    // Check if email already exists
    const emailList = existingEmails.split(',').map(e => e.trim()).filter(e => e)
    if (emailList.includes(email)) {
      return NextResponse.json({ message: 'Email already subscribed' }, { status: 200 })
    }

    // Append new email
    const newContent = existingEmails
      ? `${existingEmails.trimEnd()}, ${email}`
      : email

    await fs.writeFile(filePath, newContent, 'utf-8')

    return NextResponse.json({ message: 'Successfully subscribed' }, { status: 200 })
  } catch (error) {
    console.error('Error saving email:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
