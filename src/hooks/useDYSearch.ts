import { useQuery } from '@tanstack/react-query';
import { useConfig } from '../context/ConfigContext';

export interface DYSearchResponse {
  slots: Array<{
    item: any;
    strId: string | number;
    md: any;
    fallback: boolean;
  }>;
  totalNumResults: number;
  facets: {
    [key: string]: Array<{
      value: string;
      count: number;
    }>;
  };
  spellCheckedQuery: string | null;
  translatedQuery: string | null;
  errorMessage: string | null;
}

export const useDYSearch = (query: string, offset: number, filters: any[] = []) => {
  const { config, setLastRequestPayload } = useConfig();

  return useQuery({
    queryKey: ['dySearch', query, offset, filters, config.sectionId, config.feedId, config],
    queryFn: async (): Promise<DYSearchResponse> => {
      // If we don't have IDs, return early (though Query will be disabled)
      if (!config.sectionId || !config.feedId) {
        throw new Error('Section ID and Feed ID are required');
      }

      const fId = isNaN(Number(config.feedId)) ? config.feedId : Number(config.feedId);

      const payload = {
        data: [
          {
            fId: fId,
            wId: config.widgetId || null,
            maxProducts: config.maxProducts,
            rules: [],
            filtering: [],
            strategy: config.strategy,
            searchFilters: [],
            search: {
              text: query || "*",
              pagination: {
                numItems: config.itemsPerPage,
                offset: offset,
              },
              suggestMode: config.suggestMode,
              explain_mode: config.explainMode,
              translation_enabled: config.translationEnabled,
              plp_search_mode: config.plpSearchMode,
              image_boost: config.imageBoost,
              image_knn_threshold: config.imageKnnThreshold,
              text_knn_threshold: config.textKnnThreshold,
              k: config.k,
              num_candidates: config.numCandidates,
              search_formula: config.searchFormula,
              bucket_size: config.bucketSize,
              sortBy: config.sortByField ? {
                field: config.sortByField,
                order: config.sortByOrder
              } : undefined,
              priorityFactors: [],
              affinityProfile: {},
              locale: config.locale,
            },
          },
        ],
        ctx: { 
          lng: config.language, 
          type: config.ctxType 
        },
        geoLocation: {
          geoCode: config.geoCode,
          geoRegionCode: config.geoRegionCode
        },
        uid: config.uid || undefined
      };

      setLastRequestPayload(payload);

      const endpoint = config.endpoint.endsWith('/') ? config.endpoint : config.endpoint + '/';
      const response = await fetch(`${endpoint}${config.sectionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DY API Error: ${response.status} - ${errorText}`);
      }

      const json = await response.json();
      
      // LOG RAW RESPONSE FOR DEBUGGING (Required by user)
      console.log('DY Search Response Data:', json);

      if (!json.response || !Array.isArray(json.response) || json.response.length === 0) {
        console.error('DY API: Unexpected response structure', json);
        throw new Error('Invalid response format: Missing "response" array or empty response.');
      }

      const result = json.response[0];

      if (!result.slots) {
        console.warn('DY API: No slots field in response[0]', result);
        return { ...result, slots: [] };
      }

      return result;
    },
    enabled: !!config.sectionId && !!config.feedId,
  });
};
