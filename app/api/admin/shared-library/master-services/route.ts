import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { isSuperAdmin } from '@/lib/admin/permissions';
import { readServicesMaster, writeServicesMaster } from '@/lib/admin/servicesLibrary';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const data = await readServicesMaster();
  return NextResponse.json({ content: JSON.stringify(data, null, 2) });
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (!isSuperAdmin(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const payload = await request.json();
  if (typeof payload?.content !== 'string') {
    return NextResponse.json({ message: 'content is required' }, { status: 400 });
  }

  try {
    const parsed = JSON.parse(payload.content);
    await writeServicesMaster(parsed);
    return NextResponse.json({ success: true, message: 'Master services saved.' });
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
}
