import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, role, interest, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 },
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 },
      );
    }

    // In production, you would send an email, save to DB, etc.
    // For now, just log and return success
    console.log('Contact form submission:', {
      name,
      email,
      company,
      role,
      interest,
      message,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message. We will be in touch shortly.',
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
