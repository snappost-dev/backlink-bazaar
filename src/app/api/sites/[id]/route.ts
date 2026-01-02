import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// PATCH: Site'i güncelle (Price ve Status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const siteId = params.id;
    const body = await request.json();
    const { basePrice, status } = body;

    if (!siteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Site ID is required',
        },
        { status: 400 }
      );
    }

    // Site'i bul
    const existingSite = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!existingSite) {
      return NextResponse.json(
        {
          success: false,
          error: 'Site not found',
        },
        { status: 404 }
      );
    }

    // Final price hesapla (30% marj)
    const finalPrice = basePrice ? basePrice * 1.3 : existingSite.finalPrice;

    // Status değişikliğine göre verificationStatus'u güncelle
    let verificationStatus = existingSite.verificationStatus;
    if (status === 'approved') {
      verificationStatus = 'VERIFIED';
    } else if (status === 'rejected') {
      verificationStatus = 'REJECTED';
    } else if (status === 'pending') {
      verificationStatus = 'PENDING';
    }

    // Site'i güncelle
    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        ...(basePrice && { basePrice: Number(basePrice) }),
        finalPrice: finalPrice,
        ...(status && { status: status }),
        verificationStatus: verificationStatus,
        ...(status === 'approved' && { verifiedAt: new Date() }),
      },
    });

    // Cache'i temizle
    revalidatePath('/agency/inventory');
    revalidatePath(`/agency/inventory/${siteId}`);
    revalidatePath('/buyer/marketplace');

    return NextResponse.json(
      {
        success: true,
        data: updatedSite,
        message: 'Site updated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating site:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update site',
      },
      { status: 500 }
    );
  }
}

