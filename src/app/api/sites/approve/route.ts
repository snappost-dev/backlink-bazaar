import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// POST: Site'i onayla (status: APPROVED, verificationStatus: VERIFIED)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, finalPrice } = body;

    if (!siteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'siteId is required',
        },
        { status: 400 }
      );
    }

    // Site'i bul
    const site = await prisma.site.findUnique({
      where: { id: siteId },
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

    // Site'i onayla
    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        status: 'approved', // APPROVED olarak işaretle
        verificationStatus: 'VERIFIED', // VERIFIED olarak işaretle
        finalPrice: finalPrice ? Number(finalPrice) : site.finalPrice, // Fiyat güncellenirse
        verifiedAt: new Date(), // Doğrulama tarihi
      },
    });

    // Cache'i temizle
    revalidatePath('/agency/vetting');
    revalidatePath('/buyer/marketplace');

    return NextResponse.json(
      {
        success: true,
        data: updatedSite,
        message: 'Site approved successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error approving site:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to approve site',
      },
      { status: 500 }
    );
  }
}

