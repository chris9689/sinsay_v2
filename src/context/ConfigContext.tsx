import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DYConfig {
  sectionId: string;
  feedId: string;
  widgetId: string;
  endpoint: string;
  locale: string;
  language: string;
  ctxType: string;
  itemsPerPage: number;
  maxProducts: number;
  strategy: string;
  suggestMode: boolean;
  explainMode: boolean;
  translationEnabled: boolean;
  plpSearchMode: boolean;
  imageBoost: number;
  imageKnnThreshold: number;
  textKnnThreshold: number;
  k: number;
  numCandidates: number;
  searchFormula: string;
  bucketSize: number;
  sortByField: string;
  sortByOrder: 'asc' | 'desc';
  uid: string;
  geoCode: string;
  geoRegionCode: string;
  mapping: {
    title: string[];
    image: string[];
    url: string[];
    price: string[];
    brand: string;
  };
}

const defaultConfig: DYConfig = {
  sectionId: '8770123',
  feedId: '85470',
  widgetId: '12345',
  endpoint: 'https://recs-search.dynamicyield.com/search',
  locale: 'en_US',
  language: 'en_US',
  ctxType: 'HOMEPAGE',
  itemsPerPage: 12,
  maxProducts: 1000,
  strategy: 'SEMANTIC_SEARCH',
  suggestMode: true,
  explainMode: false,
  translationEnabled: false,
  plpSearchMode: false,
  imageBoost: 0.5,
  imageKnnThreshold: 0.8,
  textKnnThreshold: 0.7,
  k: 100,
  numCandidates: 500,
  searchFormula: '',
  bucketSize: 10,
  sortByField: 'price',
  sortByOrder: 'asc',
  uid: '9190339902873124000',
  geoCode: 'US',
  geoRegionCode: 'US_VA',
  mapping: {
    title: ['name', 'productName'],
    image: ['image_url', 'image_url_small', 'imageUrl'],
    url: ['url', 'product_url'],
    price: ['price', 'dy_display_price'],
    brand: 'brand'
  }
};

const ConfigContext = createContext<{ 
  config: DYConfig; 
  setConfig: (c: DYConfig) => void;
  lastRequestPayload: any;
  setLastRequestPayload: (p: any) => void;
} | null>(null);

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastRequestPayload, setLastRequestPayload] = useState<any>(null);
  const [config, setConfig] = useState<DYConfig>(() => {
    const saved = localStorage.getItem('dy_sinsay_config');
    try {
      return saved ? JSON.parse(saved) : defaultConfig;
    } catch (e) {
      return defaultConfig;
    }
  });

  useEffect(() => {
    localStorage.setItem('dy_sinsay_config', JSON.stringify(config));
  }, [config]);

  return (
    <ConfigContext.Provider value={{ config, setConfig, lastRequestPayload, setLastRequestPayload }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
