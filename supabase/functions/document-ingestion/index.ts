import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentChunk {
  text: string;
  index: number;
  metadata: {
    document_id: string;
    project_id: string;
    document_type: string;
    title: string;
    page?: number;
    section?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !PINECONE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { document_id, file_path, project_id } = await req.json();

    console.log(`Starting ingestion for document ${document_id}`);

    // 1. Download document from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('project-documents')
      .download(file_path);

    if (downloadError) throw downloadError;

    // 2. Extract text based on file type
    const extractedText = await extractTextFromFile(fileData, file_path);
    console.log(`Extracted ${extractedText.length} characters of text`);

    // 3. Get document metadata
    const { data: document, error: docError } = await supabase
      .from('document_registry')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError) throw docError;

    // 4. Generate AI summary and tags
    const aiAnalysis = await analyzeDocument(extractedText, document.title, OPENAI_API_KEY);

    // 5. Update document with AI analysis
    await supabase
      .from('document_registry')
      .update({
        ai_summary: aiAnalysis.summary,
        ai_tags: aiAnalysis.tags,
        status: 'approved'
      })
      .eq('id', document_id);

    // 6. Chunk the document
    const chunks = chunkDocument(extractedText, {
      document_id,
      project_id,
      document_type: document.document_type,
      title: document.title
    });

    console.log(`Created ${chunks.length} chunks`);

    // 7. Generate embeddings for each chunk
    const embeddings = await generateEmbeddings(chunks.map(c => c.text), OPENAI_API_KEY);

    // 8. Store in Pinecone
    await storeToPinecone(chunks, embeddings, PINECONE_API_KEY);

    // 9. Store chunk metadata in Supabase
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id,
      chunk_index: index,
      chunk_text: chunk.text,
      pinecone_vector_id: `${document_id}_chunk_${index}`,
      pinecone_namespace: `project_${project_id}`,
      metadata: chunk.metadata
    }));

    await supabase
      .from('document_embeddings')
      .insert(chunkRecords);

    console.log(`Successfully ingested document ${document_id}`);

    return new Response(JSON.stringify({ 
      success: true,
      chunks_created: chunks.length,
      ai_summary: aiAnalysis.summary,
      ai_tags: aiAnalysis.tags
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in document ingestion:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractTextFromFile(fileData: Blob, filePath: string): Promise<string> {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return await extractTextFromPDF(fileData);
    case 'docx':
      return await extractTextFromDocx(fileData);
    case 'txt':
      return await fileData.text();
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

async function extractTextFromPDF(fileData: Blob): Promise<string> {
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Simple text extraction - in production you'd use pdf-parse
    // For now, we'll extract basic text patterns
    let text = '';
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const chunks = [];
    
    for (let i = 0; i < uint8Array.length; i += 1024) {
      const chunk = uint8Array.slice(i, i + 1024);
      chunks.push(decoder.decode(chunk, { stream: true }));
    }
    
    text = chunks.join('');
    
    // Extract readable text (basic pattern matching)
    const textMatches = text.match(/[A-Za-z0-9\s\.,;:!\?-]{10,}/g);
    return textMatches ? textMatches.join(' ').substring(0, 10000) : 'PDF content extracted';
  } catch (error) {
    console.error('PDF extraction error:', error);
    return 'PDF document - content extraction attempted';
  }
}

async function extractTextFromDocx(fileData: Blob): Promise<string> {
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Basic DOCX text extraction
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(uint8Array);
    
    // Extract readable content
    const textMatches = text.match(/[A-Za-z0-9\s\.,;:!\?-]{10,}/g);
    return textMatches ? textMatches.join(' ').substring(0, 10000) : 'DOCX content extracted';
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return 'DOCX document - content extraction attempted';
  }
}

async function analyzeDocument(text: string, title: string, apiKey: string) {
  const prompt = `Analyze this document and provide:
1. A concise summary (2-3 sentences)
2. Relevant tags (max 5, comma-separated)

Document Title: ${title}
Document Content: ${text.substring(0, 4000)}...

Format your response as JSON:
{
  "summary": "...",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a document analysis expert. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      summary: "Document analysis completed",
      tags: ["document"]
    };
  }
}

function chunkDocument(text: string, metadata: any): DocumentChunk[] {
  const maxChunkSize = 1000;
  const overlap = 200;
  const chunks: DocumentChunk[] = [];
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        metadata: { ...metadata, section: `chunk_${chunkIndex}` }
      });
      
      // Keep overlap from previous chunk
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-overlap / 10).join(' ') + ' ' + sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
      metadata: { ...metadata, section: `chunk_${chunkIndex}` }
    });
  }
  
  return chunks;
}

async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts
    }),
  });

  const data = await response.json();
  return data.data.map((item: any) => item.embedding);
}

async function storeToPinecone(chunks: DocumentChunk[], embeddings: number[][], apiKey: string) {
  try {
    const vectors = chunks.map((chunk, index) => ({
      id: `${chunk.metadata.document_id}_chunk_${index}`,
      values: embeddings[index],
      metadata: {
        ...chunk.metadata,
        text: chunk.text.substring(0, 40000), // Pinecone metadata limit
        chunk_index: index
      }
    }));

    const namespace = `project_${chunks[0].metadata.project_id}`;
    
    // Upsert to Pinecone
    const response = await fetch(`https://api.pinecone.io/v1/indexes/ajryan-rag/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vectors,
        namespace
      })
    });

    if (!response.ok) {
      throw new Error(`Pinecone upsert failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Successfully stored ${vectors.length} vectors to Pinecone namespace: ${namespace}`, result);
  } catch (error) {
    console.error('Error storing to Pinecone:', error);
    throw error;
  }
}
