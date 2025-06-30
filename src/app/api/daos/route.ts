import { NextRequest, NextResponse } from 'next/server';
import { daoService, DAODetails } from '@/services/daoService';

// GET: 全DAOを取得
export async function GET() {
  try {
    console.log('🔥 API: Getting all DAOs from Firebase...');
    const daos = await daoService.getAllDAOs();
    console.log(`🔥 API: Successfully fetched ${daos.length} DAOs`);
    return NextResponse.json({ success: true, data: daos });
  } catch (error) {
    console.error('🔥 API: Failed to get DAOs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get DAOs' },
      { status: 500 }
    );
  }
}

// POST: 新しいDAOを追加
export async function POST(request: NextRequest) {
  try {
    console.log('🔥 API: Creating new DAO...');
    const body = await request.json();
    
    const daoData = {
      name: body.name,
      description: body.description || '',
      location: body.location || 'オンライン',
      size: body.size || 'medium',
      memberCount: body.memberCount || 1,
      logoUrl: body.logoUrl || 'https://placehold.co/100x100?text=DAO',
      website: body.website || '',
      contactEmail: body.contactEmail || '',
      contactPerson: body.contactPerson || '',
      trustScore: body.trustScore || 100,
      status: body.status || 'active',
      ownerId: body.ownerId || '',
      adminAddress: body.adminAddress || undefined,
      foundingDate: body.foundingDate || undefined,
      attestationUID: body.attestationUID || undefined,
      documents: body.documents || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Omit<DAODetails, 'id'>;

    const daoId = await daoService.createDAO(daoData);
    const createdDao = await daoService.getDAO(daoId);
    
    console.log('🔥 API: DAO created successfully with ID:', daoId);
    return NextResponse.json({ success: true, data: createdDao });
  } catch (error) {
    console.error('🔥 API: Failed to create DAO:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create DAO' },
      { status: 500 }
    );
  }
} 