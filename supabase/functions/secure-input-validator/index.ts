import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationRequest {
  data: Record<string, any>
  validationType: 'workLog' | 'assignment' | 'rate'
}

interface ValidationResult {
  isValid: boolean
  sanitizedData?: Record<string, any>
  errors?: string[]
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, validationType }: ValidationRequest = await req.json()

    console.log(`Validating ${validationType} data:`, data)

    const result = await validateAndSanitize(data, validationType, supabase)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Validation error:', error)
    return new Response(
      JSON.stringify({ isValid: false, errors: ['Validation failed'] }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function validateAndSanitize(
  data: Record<string, any>,
  type: string,
  supabase: any
): Promise<ValidationResult> {
  const errors: string[] = []
  const sanitizedData: Record<string, any> = {}

  // Common sanitization functions
  const sanitizeText = (text: string): string => {
    if (typeof text !== 'string') return ''
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;&|`$]/g, '') // Remove command injection chars
      .substring(0, 1000) // Limit length
  }

  const sanitizeNumber = (num: any): number | null => {
    const parsed = parseFloat(num)
    return isNaN(parsed) ? null : Math.max(0, parsed)
  }

  switch (type) {
    case 'workLog':
      // Validate required fields
      if (!data.plot_id) errors.push('Plot ID is required')
      if (!data.work_category_id) errors.push('Work category is required')
      if (!data.user_id) errors.push('User ID is required')
      
      // Sanitize and validate hours
      const hours = sanitizeNumber(data.hours)
      if (hours === null || hours <= 0 || hours > 24) {
        errors.push('Hours must be between 0 and 24')
      } else {
        sanitizedData.hours = hours
      }

      // Sanitize text fields
      if (data.notes) {
        sanitizedData.notes = sanitizeText(data.notes)
      }
      
      if (data.voice_transcript) {
        sanitizedData.voice_transcript = sanitizeText(data.voice_transcript)
      }

      // Copy safe fields
      sanitizedData.plot_id = data.plot_id
      sanitizedData.work_category_id = data.work_category_id
      sanitizedData.user_id = data.user_id
      sanitizedData.status = ['pending', 'in_progress', 'completed'].includes(data.status) 
        ? data.status : 'pending'

      // Verify user is authorized for this work
      const { data: assignment } = await supabase
        .from('unit_work_assignments')
        .select('id')
        .eq('plot_id', data.plot_id)
        .eq('work_category_id', data.work_category_id)
        .eq('assigned_user_id', data.user_id)
        .single()

      if (!assignment) {
        errors.push('User not authorized for this work assignment')
      }

      break

    case 'assignment':
      if (!data.plot_id) errors.push('Plot ID is required')
      if (!data.work_category_id) errors.push('Work category is required')
      if (!data.assigned_user_id) errors.push('Assigned user is required')

      sanitizedData.plot_id = data.plot_id
      sanitizedData.work_category_id = data.work_category_id
      sanitizedData.assigned_user_id = data.assigned_user_id
      
      if (data.notes) {
        sanitizedData.notes = sanitizeText(data.notes)
      }

      const estimatedHours = sanitizeNumber(data.estimated_hours)
      if (estimatedHours && estimatedHours > 0) {
        sanitizedData.estimated_hours = estimatedHours
      }

      break

    case 'rate':
      const rate = sanitizeNumber(data.rate)
      if (!rate || rate <= 0) {
        errors.push('Rate must be greater than 0')
      } else {
        sanitizedData.rate = rate
      }

      const bonusRate = sanitizeNumber(data.bonus_rate)
      if (bonusRate !== null) {
        sanitizedData.bonus_rate = Math.max(0, bonusRate)
      }

      if (data.user_id) sanitizedData.user_id = data.user_id
      if (data.job_type) sanitizedData.job_type = sanitizeText(data.job_type)

      break

    default:
      errors.push('Invalid validation type')
  }

  return {
    isValid: errors.length === 0,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
    errors: errors.length > 0 ? errors : undefined
  }
}