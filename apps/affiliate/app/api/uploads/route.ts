import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf'
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const kind = (formData.get('kind')?.toString() ?? 'document').replace(/[^a-z0-9-_]/gi, '');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'File is required.' }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum allowed size is 5MB.' },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES[file.type]) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload images or PDF documents only.' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension =
    path.extname(file.name) || ALLOWED_MIME_TYPES[file.type] || `.${file.type.split('/')[1] ?? 'bin'}`;

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const fileName = `${kind || 'document'}-${randomUUID()}${extension.toLowerCase()}`;
  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, buffer);

  return NextResponse.json({ url: `/uploads/${fileName}` });
}
