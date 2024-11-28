import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';

// CORS headers function
// function corsHeaders() {
//   return {
//     'Access-Control-Allow-Origin': '*', // Allow all origins
//     'Access-Control-Allow-Methods': 'DELETE, GET, POST, OPTIONS',
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     'Access-Control-Allow-Credentials': 'true',
//   };
// }
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Encrypted-Payload',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(request: NextRequest) {
  // Handle preflight and CORS
  // if (request.method === 'OPTIONS') {
  //   return new NextResponse(null, {
  //     status: 204,
  //     headers: corsHeaders(),
  //   });
  // }

  try {
    const { email, password } = await request.json();

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        {
          status: 401,
          headers: corsHeaders(),
        }
      );
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        {
          status: 401,
          headers: corsHeaders(),
        }
      );
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user info without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        ...userWithoutPassword,
        token,
      },
      {
        status: 200,
        headers: corsHeaders(),
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: corsHeaders(),
      }
    );
  }
}
