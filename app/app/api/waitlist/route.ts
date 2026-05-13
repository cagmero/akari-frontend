import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Initialize Supabase Client inside handler to prevent Next.js build-time errors
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase Environment Variables");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { name, email, entity, location, volume } = body;

    if (!name || !email || !entity || !location || !volume) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Store in Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('waitlist')
      .insert([{ name, email, entity, location, volume }])
      .select();

    if (dbError) {
      console.error('Supabase insert error details:', dbError);
      return NextResponse.json({ error: 'Failed to save waitlist entry' }, { status: 500 });
    }

    // 2. Send event to Loops.so to trigger the Welcome Email workflow for the user
    const loopsApiKey = process.env.LOOPS_API_KEY;

    if (loopsApiKey) {
      // Trigger the workflow for the user who signed up
      const userLoopsResponse = await fetch('https://app.loops.so/api/v1/events/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loopsApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email, // Target the user's email to send them the welcome email
          eventName: 'Waitlist Joined', // Standard event name to trigger workflow in Loops
          eventProperties: {
            name: name,
            entity: entity,
            location: location,
            volume: volume
          }
        })
      });

      if (!userLoopsResponse.ok) {
        console.error('Loops User Event API error:', await userLoopsResponse.text());
      }

      // Optional: Also send notification event to Admin if configured
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
      if (adminEmail) {
        const adminLoopsResponse = await fetch('https://app.loops.so/api/v1/events/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${loopsApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: adminEmail,
            eventName: 'New Waitlist Submission',
            eventProperties: {
              submitterName: name,
              submitterEmail: email,
              entity,
              location,
              volume
            }
          })
        });

        if (!adminLoopsResponse.ok) {
          console.error('Loops Admin Event API error:', await adminLoopsResponse.text());
        }
      }
    }

    return NextResponse.json({ success: true, data: dbData });
  } catch (err: any) {
    console.error('Waitlist API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
