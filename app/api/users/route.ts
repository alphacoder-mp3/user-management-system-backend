import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Optionally add token verification
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract pagination parameters from the URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '0', 10);

    // If limit is 0 or not provided, return all users (backward compatibility)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      ...(limit > 0
        ? {
            skip: (page - 1) * limit,
            take: limit,
          }
        : {}),
    });

    // If pagination is used, include total count and pagination info
    if (limit > 0) {
      const totalUsers = await prisma.user.count();
      const totalPages = Math.ceil(totalUsers / limit);

      return NextResponse.json({
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          pageSize: limit,
        },
      });
    }

    // For backward compatibility, return users directly when no pagination
    return NextResponse.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, middleName, lastName, email, password } =
      await request.json();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        middleName,
        lastName,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
