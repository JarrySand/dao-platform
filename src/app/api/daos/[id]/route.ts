import { NextRequest, NextResponse } from 'next/server';
import { daoService } from '@/services/daoService';

// GET: 特定のDAOを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔥 API: Getting DAO with ID: ${params.id}`);
    const dao = await daoService.getDAO(params.id);
    
    if (!dao) {
      console.log('🔥 API: DAO not found');
      return NextResponse.json(
        { success: false, error: 'DAO not found' },
        { status: 404 }
      );
    }

    console.log('🔥 API: DAO found successfully');
    return NextResponse.json({ success: true, data: dao });
  } catch (error) {
    console.error('🔥 API: Failed to get DAO:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get DAO' },
      { status: 500 }
    );
  }
}

// PUT: DAOの情報を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔥 API: Updating DAO with ID: ${params.id}`);
    const updatedData = await request.json();
    
    await daoService.updateDAO(params.id, updatedData);
    const updatedDao = await daoService.getDAO(params.id);

    console.log('🔥 API: DAO updated successfully');
    return NextResponse.json({
      success: true,
      data: updatedDao
    });
  } catch (error) {
    console.error('🔥 API: Failed to update DAO:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update DAO' },
      { status: 500 }
    );
  }
} 