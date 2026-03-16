import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

import { isDemoMode } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function inferFileType(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.md')) return 'markdown';
  return 'txt';
}

async function extractText(file: File, fileType: 'pdf' | 'markdown' | 'txt') {
  if (fileType === 'pdf') {
    const parser = new PDFParse({ data: Buffer.from(await file.arrayBuffer()) });
    const parsed = await parser.getText();
    await parser.destroy();
    return parsed.text;
  }

  return Buffer.from(await file.arrayBuffer()).toString('utf-8');
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const worldId = String(formData.get('worldId') ?? '');
  const file = formData.get('file');

  if (!worldId || !(file instanceof File)) {
    return NextResponse.json({ error: 'worldId and file are required.' }, { status: 400 });
  }

  if (isDemoMode) {
    return NextResponse.redirect(new URL(`/worlds/${worldId}/documents?demoUpload=1`, request.url));
  }

  try {
    const fileType = inferFileType(file.name) as 'pdf' | 'markdown' | 'txt';
    const extractedText = await extractText(file, fileType);
    const storagePath = `${worldId}/${randomUUID()}-${file.name}`;
    const supabase = await createServerSupabaseClient();

    const uploadResult = await supabase.storage.from('canonkeep-documents').upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    const { error } = await supabase.from('source_documents').insert({
      world_id: worldId,
      title: file.name,
      file_type: fileType,
      storage_path: storagePath,
      extracted_text: extractedText.slice(0, 50000),
      access_scope: 'private',
      parse_status: 'parsed',
    });

    if (error) {
      throw error;
    }

    return NextResponse.redirect(new URL(`/worlds/${worldId}/documents?uploaded=1`, request.url));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to upload document.' }, { status: 500 });
  }
}
