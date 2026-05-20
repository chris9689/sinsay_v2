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

  const { imageBase64, imageUrl } = req.body;

  // Validate input
  if ((!imageBase64 || typeof imageBase64 !== 'string') && (!imageUrl || typeof imageUrl !== 'string')) {
    return res.status(400).json({ error: 'imageBase64 or imageUrl is required and must be a string' });
  }

  const apiKey = process.env.VISUALSEARCH_API_KEY;
  if (!apiKey) {
    console.error('[Visual Search] API key not configured');
    return res.status(500).json({ error: 'Visual Search API key not configured' });
  }

  try {
    const resolvedBase64 = imageBase64 ?? await fetchImageUrlAsBase64(imageUrl);

    const payload = {
      user: {
        active_consent_accepted: false,
      },
      query: {
        sortBy: {
          order: 'asc',
          field: 'popularity',
        },
        imageBase64: resolvedBase64,
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
      console.error('[Visual Search] API Error:', response.status, errorText);
      return res.status(response.status).json({
        error: `Visual Search API error: ${response.statusText}`,
        details: errorText,
      });
    }

    const data = await response.json();
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

async function fetchImageUrlAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image URL: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const maxBytes = 10 * 1024 * 1024;
  if (arrayBuffer.byteLength > maxBytes) {
    throw new Error('Image size exceeds 10MB limit');
  }

  return Buffer.from(arrayBuffer).toString('base64');
}

/**
 * Extract product results from Visual Search API response
 */
function extractVisualSearchResults(response: any): any[] {
  try {
    const slots: any[] = [];

    if (
      Array.isArray(response.response) &&
      response.response.length > 0 &&
      Array.isArray(response.response[0].slots)
    ) {
      slots.push(...response.response[0].slots);
    }

    if (Array.isArray(response.choices)) {
      for (const choice of response.choices) {
        const variations = Array.isArray(choice.variations) ? choice.variations : [];
        for (const variation of variations) {
          const payloadData = variation.payload?.data;
          if (payloadData && Array.isArray(payloadData.slots)) {
            slots.push(...payloadData.slots);
          }
        }
      }
    }

    return slots.map((slot) => {
      if (slot.item) {
        return slot.item;
      }

      if (slot.productData) {
        return {
          ...slot.productData,
          sku: slot.sku ?? slot.productData.sku,
          slotId: slot.slotId,
        };
      }

      return slot;
    });
  } catch (error) {
    console.error('[Visual Search] Error extracting results:', error);
    return [];
  }
}
