/**
 * Visual Search API Proxy Handler
 * Handles POST requests to /api/visual-search
 * Forwards requests to dy-api.com Visual Search endpoint with API key
 */

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64 } = req.body;

  // Validate input
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'imageBase64 is required and must be a string' });
  }

  // Get API key from environment (server-side only)
  const apiKey = process.env.VISUALSEARCH_API_KEY;
  if (!apiKey) {
    console.error('[Visual Search] API key not configured');
    return res.status(500).json({ error: 'Visual Search API key not configured' });
  }

  try {
    // Construct the Visual Search API payload according to spec
    const payload = {
      user: {
        active_consent_accepted: false,
      },
      query: {
        sortBy: {
          order: 'asc',
          field: 'popularity',
        },
        imageBase64,
      },
      context: {
        page: {
          type: 'HOMEPAGE',
          location: 'https://www.mypage.com',
          data: ['12345'],
        },
      },
      selector: {
        name: 'Visual Search',
      },
      options: {
        returnAnalyticsMetadata: false,
        isImplicitClientData: false,
      },
    };

    // Make request to Visual Search API
    const response = await fetch('https://dy-api.com/v2/serve/user/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'dy-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        '[Visual Search] API Error:',
        response.status,
        errorText
      );
      return res.status(response.status).json({
        error: `Visual Search API error: ${response.statusText}`,
        details: errorText,
      });
    }

    const data = await response.json();

    // Extract results from the response
    // The API typically returns: { response: [{ slots: [...], facets: [...] }] }
    const results = extractVisualSearchResults(data);

    return res.status(200).json({
      results,
      rawResponse: data,
    });
  } catch (error) {
    console.error('[Visual Search] Proxy Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Extract product results from Visual Search API response
 */
function extractVisualSearchResults(response: any): any[] {
  try {
    const items: any[] = [];

    // Handle response structure: response[0].slots contain items
    if (
      Array.isArray(response.response) &&
      response.response.length > 0 &&
      Array.isArray(response.response[0].slots)
    ) {
      for (const slot of response.response[0].slots) {
        if (slot.item) {
          items.push(slot.item);
        }
      }
    }

    return items;
  } catch (error) {
    console.error('[Visual Search] Error extracting results:', error);
    return [];
  }
}
