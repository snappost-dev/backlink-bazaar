import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Ajansın onay bekleyen siparişlerini listele
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status') || 'pending';

    // Mock: Şimdilik tüm pending siparişleri getir
    // Gerçek uygulamada agencyId ile filtreleme yapılacak
    const orders = await prisma.order.findMany({
      where: {
        status: status,
      },
      include: {
        site: {
          select: {
            id: true,
            domain: true,
            category: true,
            finalPrice: true,
          },
        },
        buyer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch orders',
      },
      { status: 500 }
    );
  }
}

// POST: Yeni sipariş oluştur (The Briefcase)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, buyerId, draftBrief, price, deadline } = body;

    // Validation
    if (!siteId || !buyerId || !draftBrief) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: siteId, buyerId, draftBrief',
        },
        { status: 400 }
      );
    }

    // Site'i kontrol et
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, finalPrice: true },
    });

    if (!site) {
      return NextResponse.json(
        {
          success: false,
          error: 'Site not found',
        },
        { status: 404 }
      );
    }

    // Order oluştur
    const order = await prisma.order.create({
      data: {
        siteId,
        buyerId,
        status: 'pending',
        price: price || site.finalPrice,
        finalPrice: null, // Agency onayladıktan sonra set edilecek
        draftBrief: draftBrief,
        approvedBrief: null,
        briefStatus: 'PENDING',
        deadline: deadline ? new Date(deadline) : null,
      },
      include: {
        site: {
          select: {
            id: true,
            domain: true,
            category: true,
          },
        },
        buyer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: order,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create order',
      },
      { status: 500 }
    );
  }
}

