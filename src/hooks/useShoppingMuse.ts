import { useMutation } from '@tanstack/react-query';
import { useConfig } from '../context/ConfigContext';

export interface ShoppingMuseWidgetSlot {
  slotId?: string;
  sku?: string;
  productData?: Record<string, unknown>;
}

export interface ShoppingMuseWidget {
  title?: string;
  slots?: ShoppingMuseWidgetSlot[];
}

export interface ShoppingMuseResponse {
  assistant: string;
  chatId: string | null;
  support: boolean;
  widgets: ShoppingMuseWidget[];
  warnings: Array<{ code?: string; message?: string }>;
  rawResponse?: unknown;
}

interface ShoppingMuseRequest {
  text: string;
  chatId?: string;
}

function getCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  if (!cookie) {
    return undefined;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}

export function useShoppingMuse() {
  const { config } = useConfig();

  return useMutation({
    mutationFn: async ({ text, chatId }: ShoppingMuseRequest): Promise<ShoppingMuseResponse> => {
      const locale = config.useLocale && config.locale ? config.locale : config.language;
      const dyid = getCookieValue('_dyid') || config.uid;
      const dyidServer = getCookieValue('_dyid_server') || dyid;
      const sessionDy = getCookieValue('dy');

      const response = await fetch('/api/shopping-muse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          chatId,
          locale,
          dyid,
          dyidServer,
          sessionDy,
          pageLocation: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `Shopping Muse failed: ${response.statusText}`
        );
      }

      return response.json();
    },
  });
}
