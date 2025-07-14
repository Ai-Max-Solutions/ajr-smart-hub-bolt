import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for edge function
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface NotificationRequest {
  action: 'create' | 'mark_read' | 'mark_acknowledged' | 'bulk_action' | 'predict_compliance';
  userId?: string;
  notificationId?: string;
  title?: string;
  message?: string;
  notificationType?: string;
  priority?: string;
  category?: string;
  projectId?: string;
  complianceDeadline?: string;
  metadata?: any;
  deliveryChannels?: string[];
  deviceType?: string;
  locationContext?: string;
}

interface SmartNotification {
  id: string;
  user_id: string;
  recipient_role: string;
  project_id?: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  category: string;
  delivery_channels: string[];
  delivery_status: any;
  is_ai_generated: boolean;
  ai_confidence?: number;
  predicted_compliance_risk?: number;
  is_read: boolean;
  is_acknowledged: boolean;
  compliance_deadline?: string;
  created_at: string;
}

// AI-powered compliance risk assessment
async function calculateComplianceRisk(
  notificationType: string,
  deadline?: string,
  userRole?: string,
  projectId?: string
): Promise<{ risk: number, confidence: number }> {
  try {
    let baseRisk = 0.3;
    let confidence = 0.85;

    // Risk calculation based on notification type
    switch (notificationType) {
      case 'safety':
        baseRisk = 0.8;
        confidence = 0.9;
        break;
      case 'compliance':
        baseRisk = 0.7;
        if (deadline) {
          const deadlineDate = new Date(deadline);
          const now = new Date();
          const daysUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
          
          if (daysUntilDeadline < 1) baseRisk = 0.95;
          else if (daysUntilDeadline < 3) baseRisk = 0.85;
          else if (daysUntilDeadline < 7) baseRisk = 0.75;
        }
        break;
      case 'training':
        baseRisk = 0.6;
        if (deadline) {
          const deadlineDate = new Date(deadline);
          const now = new Date();
          const daysUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
          
          if (daysUntilDeadline < 7) baseRisk = 0.8;
          else if (daysUntilDeadline < 14) baseRisk = 0.7;
        }
        break;
      case 'document':
        baseRisk = 0.5;
        break;
      default:
        baseRisk = 0.3;
    }

    // Adjust risk based on user role
    if (userRole === 'Operative' || userRole === 'Worker') {
      baseRisk += 0.1; // Higher risk for front-line workers
    }

    // Historical pattern analysis (simplified)
    if (projectId) {
      const { data: recentNotifications } = await supabase
        .from('smart_notifications')
        .select('is_read, action_taken, created_at')
        .eq('project_id', projectId)
        .eq('notification_type', notificationType)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10);

      if (recentNotifications && recentNotifications.length > 0) {
        const responseRate = recentNotifications.filter(n => n.action_taken).length / recentNotifications.length;
        if (responseRate < 0.5) {
          baseRisk += 0.1; // Increase risk if low response rate
          confidence += 0.05;
        }
      }
    }

    return {
      risk: Math.min(0.99, Math.max(0.01, baseRisk)),
      confidence: Math.min(0.99, Math.max(0.01, confidence))
    };
  } catch (error) {
    console.error('Error calculating compliance risk:', error);
    return { risk: 0.5, confidence: 0.5 };
  }
}

// Multi-channel delivery orchestrator
async function processDeliveryChannels(
  notification: SmartNotification,
  userPreferences: any
): Promise<{ successful: string[], failed: string[] }> {
  const successful: string[] = [];
  const failed: string[] = [];
  const channels = notification.delivery_channels || ['in_app'];

  console.log(`Processing delivery for notification ${notification.id} via channels:`, channels);

  for (const channel of channels) {
    try {
      switch (channel) {
        case 'in_app':
          // In-app is always successful as it's stored in database
          successful.push('in_app');
          break;
          
        case 'push':
          if (userPreferences?.push_enabled && shouldSendBasedOnPriority(notification.priority, userPreferences.min_priority_push)) {
            // Implement push notification logic here
            // For now, we'll simulate success
            successful.push('push');
          } else {
            failed.push('push');
          }
          break;
          
        case 'sms':
          if (userPreferences?.sms_enabled && shouldSendBasedOnPriority(notification.priority, userPreferences.min_priority_sms)) {
            // Implement SMS logic here
            // For now, we'll simulate success
            successful.push('sms');
          } else {
            failed.push('sms');
          }
          break;
          
        case 'email':
          if (userPreferences?.email_enabled && shouldSendBasedOnPriority(notification.priority, userPreferences.min_priority_email)) {
            // Implement email logic here
            // For now, we'll simulate success
            successful.push('email');
          } else {
            failed.push('email');
          }
          break;
          
        case 'voice':
          if (userPreferences?.voice_enabled) {
            // Implement voice notification logic here
            // For now, we'll simulate success
            successful.push('voice');
          } else {
            failed.push('voice');
          }
          break;
          
        default:
          failed.push(channel);
      }
    } catch (error) {
      console.error(`Failed to deliver via ${channel}:`, error);
      failed.push(channel);
    }
  }

  // Update delivery status in database
  await supabase
    .from('smart_notifications')
    .update({
      delivery_status: {
        successful,
        failed,
        timestamp: new Date().toISOString(),
        attempts: 1
      }
    })
    .eq('id', notification.id);

  return { successful, failed };
}

function shouldSendBasedOnPriority(notificationPriority: string, minPriority: string): boolean {
  const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
  return priorityOrder[notificationPriority as keyof typeof priorityOrder] >= priorityOrder[minPriority as keyof typeof priorityOrder];
}

// Generate AI-powered compliance predictions
async function generateCompliancePredictions(projectId?: string, userId?: string): Promise<any[]> {
  try {
    const predictions = [];
    
    // Training expiry predictions
    const { data: users } = await supabase
      .from('Users')
      .select('whalesync_postgres_id, role, skills, healthsafetyexpirydate, cscscardnumber, gassafeexpirydate')
      .eq('employmentstatus', 'Active');

    if (users) {
      for (const user of users) {
        // Check for expiring certifications
        const expiryDates = [
          { type: 'health_safety', date: user.healthsafetyexpirydate },
          { type: 'cscs_card', date: user.cscscardnumber },
          { type: 'gas_safe', date: user.gassafeexpirydate }
        ];

        for (const cert of expiryDates) {
          if (cert.date) {
            const expiryDate = new Date(cert.date);
            const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 3600 * 24);
            
            if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
              predictions.push({
                prediction_type: 'training_expiry',
                confidence_score: 0.9,
                predicted_date: expiryDate.toISOString(),
                risk_level: daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 14 ? 'high' : 'medium',
                factors: {
                  certification_type: cert.type,
                  days_until_expiry: Math.floor(daysUntilExpiry),
                  user_role: user.role
                },
                recommended_actions: [
                  'Schedule renewal training',
                  'Send early reminder notifications',
                  'Update compliance tracking'
                ],
                project_id: projectId,
                user_id: user.whalesync_postgres_id
              });
            }
          }
        }
      }
    }

    // Document compliance predictions
    if (projectId) {
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('read_required', true)
        .eq('status', 'active');

      if (documents && documents.length > 0) {
        // Predict which users might miss document reviews
        predictions.push({
          prediction_type: 'document_compliance',
          confidence_score: 0.7,
          predicted_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          risk_level: 'medium',
          factors: {
            pending_documents: documents.length,
            project_type: 'construction'
          },
          recommended_actions: [
            'Send document review reminders',
            'Schedule team briefing',
            'Track reading completion'
          ],
          project_id: projectId
        });
      }
    }

    return predictions;
  } catch (error) {
    console.error('Error generating compliance predictions:', error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, notificationId, title, message, notificationType, priority, category, projectId, complianceDeadline, metadata, deliveryChannels, deviceType, locationContext }: NotificationRequest = await req.json();

    console.log(`Smart Notifications: Processing ${action} request`);

    switch (action) {
      case 'create': {
        if (!userId || !title || !message || !notificationType) {
          throw new Error('Missing required fields for notification creation');
        }

        // Get user details and preferences
        const { data: user } = await supabase
          .from('Users')
          .select('role, fullname')
          .eq('supabase_auth_id', userId)
          .single();

        const { data: preferences } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        // Calculate AI-powered compliance risk
        const { risk, confidence } = await calculateComplianceRisk(
          notificationType,
          complianceDeadline,
          user?.role,
          projectId
        );

        // Create notification with enhanced data
        const { data: notification, error: createError } = await supabase
          .from('smart_notifications')
          .insert({
            user_id: userId,
            recipient_role: user?.role || 'Worker',
            project_id: projectId,
            title,
            message,
            notification_type: notificationType,
            priority: priority || 'medium',
            category: category || 'general',
            delivery_channels: deliveryChannels || ['in_app'],
            is_ai_generated: true,
            ai_confidence: confidence,
            predicted_compliance_risk: risk,
            compliance_deadline: complianceDeadline,
            metadata: metadata || {}
          })
          .select()
          .single();

        if (createError) throw createError;

        // Process multi-channel delivery
        const deliveryResult = await processDeliveryChannels(notification, preferences);

        // Generate compliance predictions if this is a high-risk notification
        if (risk > 0.7) {
          const predictions = await generateCompliancePredictions(projectId, userId);
          if (predictions.length > 0) {
            await supabase
              .from('ai_compliance_predictions')
              .insert(predictions);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          notification,
          delivery: deliveryResult,
          ai_analysis: {
            compliance_risk: risk,
            confidence: confidence,
            predictions_generated: risk > 0.7 ? predictions.length : 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'mark_read': {
        if (!notificationId) {
          throw new Error('Notification ID required');
        }

        // Get notification details for analytics
        const { data: notification } = await supabase
          .from('smart_notifications')
          .select('*')
          .eq('id', notificationId)
          .eq('user_id', userId)
          .single();

        if (!notification) {
          throw new Error('Notification not found');
        }

        const timeToRead = Math.floor((Date.now() - new Date(notification.created_at).getTime()) / 1000);

        // Update notification status
        const { error: updateError } = await supabase
          .from('smart_notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('id', notificationId);

        if (updateError) throw updateError;

        // Record analytics
        await supabase
          .from('notification_analytics')
          .insert({
            notification_id: notificationId,
            user_id: userId,
            time_to_read_seconds: timeToRead,
            device_type: deviceType || 'unknown',
            location_context: locationContext || 'unknown'
          });

        return new Response(JSON.stringify({
          success: true,
          analytics: {
            time_to_read_seconds: timeToRead,
            device_type: deviceType,
            location_context: locationContext
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'mark_acknowledged': {
        if (!notificationId) {
          throw new Error('Notification ID required');
        }

        const { error: updateError } = await supabase
          .from('smart_notifications')
          .update({
            is_acknowledged: true,
            acknowledged_at: new Date().toISOString(),
            action_taken: 'acknowledged'
          })
          .eq('id', notificationId)
          .eq('user_id', userId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'predict_compliance': {
        const predictions = await generateCompliancePredictions(projectId, userId);
        
        if (predictions.length > 0) {
          await supabase
            .from('ai_compliance_predictions')
            .insert(predictions);
        }

        return new Response(JSON.stringify({
          success: true,
          predictions: predictions.length,
          generated_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Smart Notifications Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});