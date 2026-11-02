export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is missing from Vercel env vars.' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { subject, content, replyTo, emails } = await req.json();

    if (!emails || emails.length === 0) throw new Error('No emails provided.');
    if (!subject || !content) throw new Error('Subject and content required.');

    // Clean up the email list (remove spaces, empty lines, invalid emails)
    const cleanEmails = emails
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (cleanEmails.length === 0) throw new Error('No valid emails found.');

    // Convert line breaks to <br> for HTML formatting
    const htmlContent = content.split('\n').map((p: string) => p.trim() ? `<p>${p}</p>` : '').join('');
    
    // Resend limits batch size to 100. For larger lists, we'd need a queue.
    // For now, we'll send them in batches.
    const BATCH_SIZE = 100;
    let successCount = 0;

    for (let i = 0; i < cleanEmails.length; i += BATCH_SIZE) {
      const batch = cleanEmails.slice(i, i + BATCH_SIZE);
      
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(
          batch.map((email: string) => ({
            from: 'G1 Newsletter <newsletter@g1-id.vercel.app>', // Requires domain verification later
            to: email,
            subject,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #17211C; line-height: 1.6;">${htmlContent}</div>`,
            reply_to: replyTo,
          }))
        ),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Resend Error:', err);
        throw new Error('Failed to send batch: ' + err);
      }
      
      successCount += batch.length;
    }

    return new Response(JSON.stringify({ success: true, count: successCount }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}