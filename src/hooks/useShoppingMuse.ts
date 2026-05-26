import { useMutation } from '@tanstack/react-query';

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

export function useShoppingMuse() {
  return useMutation({
    mutationFn: async ({ text, chatId }: ShoppingMuseRequest): Promise<ShoppingMuseResponse> => {
      const response = await fetch('/api/shopping-muse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, chatId }),
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
