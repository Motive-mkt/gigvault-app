// Deploy this as a Vercel serverless function (free tier is plenty — it's
// stateless, no database). This is the ONLY place your Whop company API key
// should ever live.
//
// Setup:
// 1. Put this file at /api/verify-license.js in a new (or your existing) Vercel project.
// 2. In the Vercel dashboard, add an environment variable: WHOP_API_KEY = <your company API key>
// 3. Deploy. Copy the resulting URL (e.g. https://gigvault-license.vercel.app/api/verify-license)
//    into PROXY_URL in src/services/whopLicense.js.
//
// This function does nothing except relay the request to Whop and return the status —
// it never stores anything, so there's no ongoing cost or database to maintain.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { licenseKey, deviceId } = req.body || {};
  if (!licenseKey || !deviceId) {
    return res.status(400).json({ error: 'Missing licenseKey or deviceId' });
  }

  try {
    const whopResponse = await fetch(
      `https://api.whop.com/api/v2/memberships/${encodeURIComponent(licenseKey)}/validate_license`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: { device_id: deviceId },
        }),
      }
    );

    // Forward Whop's status code as-is (201 = valid/first bind, 200 = valid/matches,
    // 400 = invalid or bound to a different device).
    const data = await whopResponse.json().catch(() => ({}));
    return res.status(whopResponse.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Whop' });
  }
}
