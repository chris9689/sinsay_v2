export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { region, sectionId, ...dyPayload } = req.body;

  // Configuration-driven endpoint selection
  const dyRegion = region || 'US';
  const dySectionId = sectionId || '8770123';
  const baseUrl = dyRegion === 'EU' ? 'https://recs-search-eu.dynamicyield.com/search/' : 'https://recs-search.dynamicyield.com/search/';

  try {
    const response = await fetch(`${baseUrl}${dySectionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dyPayload),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}