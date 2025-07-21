import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryContext {
  chunk_text: string;
  document_title: string;
  document_type: string;
  similarity_score?: number;
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

    const { 
      query, 
      project_id, 
      document_id = null, 
      user_id,
      query_type = 'general' 
    } = await req.json();

    console.log(`Processing RAG query: "${query}" for project ${project_id}`);

    const startTime = Date.now();

    // 1. Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query, OPENAI_API_KEY);

    // 2. Search for relevant chunks
    const relevantChunks = await searchRelevantChunks(
      queryEmbedding, 
      project_id, 
      document_id, 
      supabase,
      PINECONE_API_KEY
    );

    console.log(`Found ${relevantChunks.length} relevant chunks`);

    // 3. Generate response using retrieved context
    const response = await generateRAGResponse(
      query, 
      relevantChunks, 
      OPENAI_API_KEY
    );

    const responseTime = Date.now() - startTime;

    // 4. Store query history
    await supabase
      .from('rag_query_history')
      .insert({
        user_id,
        project_id,
        document_id,
        query_text: query,
        response_text: response.content,
        retrieved_chunks: relevantChunks.map(chunk => ({
          document_title: chunk.document_title,
          document_type: chunk.document_type,
          chunk_preview: chunk.chunk_text.substring(0, 200) + '...',
          similarity_score: chunk.similarity_score
        })),
        query_type,
        response_time_ms: responseTime
      });

    console.log(`RAG query completed in ${responseTime}ms`);

    return new Response(JSON.stringify({
      response: response.content,
      sources: response.sources,
      context_chunks: relevantChunks.length,
      response_time_ms: responseTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in RAG query:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateQueryEmbedding(query: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

async function searchRelevantChunks(
  queryEmbedding: number[], 
  projectId: string, 
  documentId: string | null,
  supabase: any,
  pineconeApiKey: string
): Promise<QueryContext[]> {
  
  // For now, simulate semantic search by using text similarity from Supabase
  // In production, this would query Pinecone for vector similarity
  
  let query = supabase
    .from('document_embeddings')
    .select(`
      chunk_text,
      document_id,
      document_registry!inner(title, document_type)
    `)
    .eq('pinecone_namespace', `project_${projectId}`)
    .limit(5);

  if (documentId) {
    query = query.eq('document_id', documentId);
  }

  const { data: chunks, error } = await query;

  if (error) throw error;

  // Simulate similarity scoring (in production, this comes from Pinecone)
  const contextChunks: QueryContext[] = (chunks || []).map((chunk: any) => ({
    chunk_text: chunk.chunk_text,
    document_title: chunk.document_registry.title,
    document_type: chunk.document_registry.document_type,
    similarity_score: Math.random() * 0.3 + 0.7 // Simulated score 0.7-1.0
  }));

  // Sort by similarity score (descending)
  return contextChunks.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
}

async function generateRAGResponse(
  query: string, 
  contexts: QueryContext[], 
  apiKey: string
): Promise<{ content: string; sources: string[] }> {
  
  const contextText = contexts.map((ctx, index) => 
    `[Document ${index + 1}: ${ctx.document_title} (${ctx.document_type})]\n${ctx.chunk_text}`
  ).join('\n\n---\n\n');

  const sources = [...new Set(contexts.map(ctx => ctx.document_title))];

  const systemPrompt = `You are Grok, an AI assistant specialized in analyzing project documentation. You have access to relevant document excerpts to answer user questions.

INSTRUCTIONS:
- Answer based ONLY on the provided document context
- Be precise and cite specific documents when making claims
- If the context doesn't contain relevant information, say so clearly
- Use bullet points for lists and clear formatting
- Always mention which documents you're referencing
- Keep responses concise but informative

CONTEXT DOCUMENTS:
${contextText}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 1000
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;

  return {
    content,
    sources
  };
}