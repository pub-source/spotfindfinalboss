import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const leoAIApiKey = Deno.env.get('LEO_AI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!leoAIApiKey) {
      throw new Error('LEO_AI_API_KEY is not configured');
    }

    const { message } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const response = await fetch('https://api.leo.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${leoAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'leo-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are Leo, a helpful AI assistant for a tourist spot finder application. Help users discover amazing travel destinations, provide travel tips, and answer questions about tourism and travel planning.' 
          },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Leo.ai API error:', response.status, errorData);
      throw new Error(`Leo.ai API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in leo-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while processing your request' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});