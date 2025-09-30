import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
  email: string
  name: string
  event: {
    id: string
    title: string
    description: string
    start_date: string
    location?: string
  }
  sessionToken: string
  shareableCode: string
}

const createEmailTemplate = (data: EmailRequest) => {
  const votingUrl = `${Deno.env.get('SITE_URL')}/vote/${data.shareableCode}?token=${data.sessionToken}`
  const eventUrl = `${Deno.env.get('SITE_URL')}/event/${data.shareableCode}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Voting Access - ${data.event.title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #ffffff;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px;
            margin: 20px 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            font-size: 2.5em;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .event-title {
            font-size: 2em;
            font-weight: bold;
            margin: 20px 0;
            background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .event-details {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 16px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        .voting-button {
            background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
            box-shadow: 0 4px 16px rgba(0, 184, 148, 0.3);
            font-size: 18px;
            padding: 20px 40px;
        }
        .section {
            margin: 32px 0;
        }
        .emoji-icon {
            font-size: 2em;
            margin-bottom: 16px;
            display: block;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .info-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 16px;
            border-radius: 12px;
            text-align: center;
        }
        .footer {
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            margin-top: 40px;
        }
        .social-links {
            text-align: center;
            margin: 24px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            color: white;
            text-decoration: none;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="glass-card">
            <div class="header">
                <div class="logo">Buckets</div>
                <h1 class="event-title">${data.event.title}</h1>
                <p style="font-size: 18px; color: rgba(255, 255, 255, 0.8);">You're invited to vote!</p>
            </div>

            <div class="section" style="text-align: center;">
                <span class="emoji-icon">🎉</span>
                <h2>Hi ${data.name}!</h2>
                <p>You've successfully registered for voting access. Get ready to discover amazing talent and help shape the competition!</p>
            </div>

            <div class="event-details">
                <h3 style="margin-top: 0; color: #ffeaa7;">📅 Event Details</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>📍 Location</strong><br>
                        ${data.event.location || 'Virtual Event'}
                    </div>
                    <div class="info-item">
                        <strong>🗓️ Date</strong><br>
                        ${new Date(data.event.start_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                    </div>
                </div>
                <p style="margin: 16px 0; color: rgba(255, 255, 255, 0.9);">
                    ${data.event.description}
                </p>
            </div>

            <div class="section" style="text-align: center;">
                <span class="emoji-icon">🗳️</span>
                <h2>Ready to Vote?</h2>
                <p style="margin-bottom: 32px;">When voting opens, use the button below to access your personal voting portal:</p>

                <a href="${votingUrl}" class="button voting-button">
                    ✨ Enter Voting Portal
                </a>
            </div>

            <div class="section">
                <h3 style="color: #74b9ff;">🔒 Your Voting Access</h3>
                <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 12px; font-family: monospace;">
                    <strong>Session Token:</strong> ${data.sessionToken}<br>
                    <strong>Event Code:</strong> ${data.shareableCode}
                </div>
                <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-top: 12px;">
                    💡 Keep this email safe! You can return to vote anytime using the link above.
                </p>
            </div>

            <div class="section">
                <h3 style="color: #fd79a8;">🎯 How Voting Works</h3>
                <div style="text-align: left;">
                    <p>🎪 <strong>Discover Artists:</strong> Browse participating artists and their performances</p>
                    <p>⭐ <strong>Score Categories:</strong> Rate artists on Energy, Vocals, Stage Presence, and more</p>
                    <p>💭 <strong>Leave Feedback:</strong> Share your thoughts and encourage the artists</p>
                    <p>🏆 <strong>See Results:</strong> Watch live leaderboards and see who's winning</p>
                </div>
            </div>

            <div class="social-links">
                <a href="${eventUrl}">🔗 Event Page</a>
                <a href="mailto:support@buckets.com">📧 Support</a>
                <a href="#">📱 Follow Updates</a>
            </div>

            <div class="footer">
                <p>Powered by <strong>Buckets</strong> - Where talent meets opportunity</p>
                <p>This email was sent to ${data.email} for the event "${data.event.title}"</p>
            </div>
        </div>
    </div>
</body>
</html>
`
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const data: EmailRequest = await req.json()

    // Validate required fields
    if (!data.email || !data.name || !data.event || !data.sessionToken) {
      throw new Error('Missing required fields')
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Buckets Events <events@buckets.com>',
        to: [data.email],
        subject: `🎫 Your voting access for "${data.event.title}" is ready!`,
        html: createEmailTemplate(data),
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Email sending failed: ${error}`)
    }

    const emailResult = await emailResponse.json()

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResult.id,
      message: 'Email sent successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Error sending email:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})