interface ShoppingMuseRequestBody {
  text?: string;
  chatId?: string;
}

interface ShoppingMuseApiResponse {
  choices?: Array<{
    variations?: Array<{
      payload?: {
        data?: {
          assistant?: string;
          chatId?: string;
          support?: boolean;
          widgets?: Array<{
            title?: string;
            slots?: Array<{
              slotId?: string;
              sku?: string;
              productData?: Record<string, unknown>;
            }>;
          }> | null;
        };
      };
    }>;
  }>;
  warnings?: Array<{
    code?: string;
    message?: string;
  }>;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body ?? {}) as ShoppingMuseRequestBody;
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const chatId = typeof body.chatId === 'string' ? body.chatId.trim() : '';

  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  if (text.length > 250) {
    return res.status(400).json({ error: 'text must be 250 characters or fewer' });
  }

  const apiKey = process.env.SHOPPINGMUSE_API_KEY;
  if (!apiKey) {
    console.error('[Shopping Muse] API key not configured');
    return res.status(500).json({ error: 'Shopping Muse API key not configured' });
  }

  const payload: Record<string, unknown> = {
    user: {
      active_consent_accepted: false,
    },
    session: {},
    context: {
      page: {
        type: 'HOMEPAGE',
        location: 'https://www.mypage.com',
      },
    },
    selector: {
      names: ['Shopping Muse'],
    },
    query: {
      text,
    },
    options: {
      returnAnalyticsMetadata: false,
    },
  };

  if (chatId) {
    (payload.query as Record<string, unknown>).chatId = chatId;
  }

  try {
    const response = await fetch('https://dy-api.com/v2/serve/user/agent-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'dy-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('[Shopping Muse] API error:', response.status, details);
      return res.status(response.status).json({
        error: 'Shopping Muse request failed',
        details,
      });
    }

    const data = (await response.json()) as ShoppingMuseApiResponse;
    const museData = data.choices?.[0]?.variations?.[0]?.payload?.data;

    return res.status(200).json({
      assistant: museData?.assistant ?? '',
      chatId: museData?.chatId ?? null,
      support: Boolean(museData?.support),
      widgets: museData?.widgets ?? [],
      warnings: data.warnings ?? [],
      rawResponse: data,
    });
  } catch (error) {
    console.error('[Shopping Muse] Proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
