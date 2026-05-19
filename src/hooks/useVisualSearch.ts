import { useQuery } from '@tanstack/react-query';

export interface VisualSearchResult {
  results: any[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for performing visual search using an image
 * @param imageBase64 - Base64 encoded image data
 * @returns Object with results, loading state, and error
 */
export function useVisualSearch(imageBase64: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['visualSearch', imageBase64],
    queryFn: async () => {
      if (!imageBase64) {
        throw new Error('No image provided');
      }

      const response = await fetch('/api/visual-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Visual search failed: ${response.statusText}`
        );
      }

      return response.json();
    },
    enabled: !!imageBase64,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    results: data?.results || [],
    loading: isLoading,
    error: error ? error.message : null,
    refetch,
  };
}
