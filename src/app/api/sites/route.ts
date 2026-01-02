import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Yeni site ekle (Publisher veya Agency kapısından)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      domain,
      category,
      basePrice,
      finalPrice,
      origin = 'PUBLISHER_OWNED',
      verificationStatus = 'PENDING',
      isPrivate = false,
      publisherId,
      agencyId,
    } = body;

    // Validation
    if (!domain || !category || !basePrice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: domain, category, basePrice',
        },
        { status: 400 }
      );
    }

    // Check if domain already exists
    const existingSite = await prisma.site.findUnique({
      where: { domain },
    });

    if (existingSite) {
      return NextResponse.json(
        {
          success: false,
          error: 'Site with this domain already exists',
        },
        { status: 409 }
      );
    }

    // Create site
    const site = await prisma.site.create({
      data: {
        domain,
        status: verificationStatus === 'VERIFIED' ? 'verified' : 'pending',
        category,
        basePrice: Number(basePrice),
        finalPrice: Number(finalPrice || basePrice * 1.2),
        metrics: {
          da: 0,
          dr: 0,
          spam: 0,
        },
        traffic: {
          monthly: 0,
          organic: 0,
          referral: 0,
        },
        origin,
        verificationStatus,
        isPrivate,
        publisherId: origin === 'PUBLISHER_OWNED' ? publisherId : null,
        verifiedAt: verificationStatus === 'VERIFIED' ? new Date() : null,
      },
      include: {
        publisher: {
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
        data: site,
        message: 'Site created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create site',
      },
      { status: 500 }
    );
  }
}

