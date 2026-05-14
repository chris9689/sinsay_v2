import { useState } from 'react';
import { useConfig, DYConfig } from '../context/ConfigContext';
import { X, Terminal, Save, Database, RefreshCw, Globe, Cpu, Search, Layout, Codepen, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const ConfigPanel = ({ onClose }: { onClose: () => void }) => {
  const { config, setConfig, lastRequestPayload } = useConfig();
  const [localConfig, setLocalConfig] = useState<DYConfig>(config);
  const [activeTab, setActiveTab] = useState<'config' | 'debug'>('config');
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    setConfig(localConfig);
    onClose();
  };

  const handleReset = () => {
    localStorage.removeItem('dy_sinsay_config');
    window.location.reload();
  };

  const handleCopyRequest = () => {
    if (lastRequestPayload) {
      navigator.clipboard.writeText(JSON.stringify(lastRequestPayload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateField = (field: keyof DYConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl bg-[#0f0f0f] border-l border-white/10 text-gray-300 h-full p-8 font-mono text-[10px] overflow-y-auto custom-scrollbar"
      >
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <div className="flex flex-col">
            <h2 className="text-green-500 text-base flex items-center gap-2 font-bold tracking-tight">
              <Terminal size={20}/> DY_PREVIEW_DEBUG_v3
            </h2>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setActiveTab('config')}
                className={`text-[9px] uppercase tracking-wider font-bold transition-colors ${activeTab === 'config' ? 'text-white border-b border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Configuration
              </button>
              <button 
                onClick={() => setActiveTab('debug')}
                className={`text-[9px] uppercase tracking-wider font-bold transition-colors ${activeTab === 'debug' ? 'text-white border-b border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Request Inspector
              </button>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-white transition-colors p-2 hover:bg-white/5 rounded">
            <X size={24} />
          </button>
        </div>

        {activeTab === 'config' ? (
          <div className="space-y-10 pb-20">
            {/* Section: Core API */}
            <section>
              <SectionHeader icon={<Database size={14}/>} title="Core API Resolution" />
              <div className="grid grid-cols-2 gap-4">
                <ConfigField label="Section ID" value={localConfig.sectionId} onChange={(v: string) => updateField('sectionId', v)} />
                <ConfigField label="Feed ID" value={localConfig.feedId} onChange={(v: string) => updateField('feedId', v)} />
                <ConfigField label="Widget ID" value={localConfig.widgetId} onChange={(v: string) => updateField('widgetId', v)} />
                <ConfigField label="Endpoint URL" value={localConfig.endpoint} onChange={(v: string) => updateField('endpoint', v)} className="col-span-2" />
              </div>
            </section>

            {/* Section: Strategy & Search */}
            <section>
              <SectionHeader icon={<Search size={14}/>} title="Search & Strategy" />
              <div className="grid grid-cols-2 gap-4">
                <ConfigField label="Strategy" value={localConfig.strategy} onChange={(v: string) => updateField('strategy', v)} />
                <ConfigField label="Max Products" type="number" value={localConfig.maxProducts} onChange={(v: string) => updateField('maxProducts', parseInt(v))} />
                <ConfigField label="Items Per Page" type="number" value={localConfig.itemsPerPage} onChange={(v: string) => updateField('itemsPerPage', parseInt(v))} />
                <ConfigField label="Bucket Size" type="number" value={localConfig.bucketSize} onChange={(v: string) => updateField('bucketSize', parseInt(v))} />
                <div className="flex flex-wrap items-center gap-4 mt-2 col-span-2">
                  <Toggle label="Suggest Mode" checked={localConfig.suggestMode} onChange={(v: boolean) => updateField('suggestMode', v)} />
                  <Toggle label="Explain Mode" checked={localConfig.explainMode} onChange={(v: boolean) => updateField('explainMode', v)} />
                  <Toggle label="Translation" checked={localConfig.translationEnabled} onChange={(v: boolean) => updateField('translationEnabled', v)} />
                  <Toggle label="PLP Mode" checked={localConfig.plpSearchMode} onChange={(v: boolean) => updateField('plpSearchMode', v)} />
                </div>
              </div>
            </section>

            {/* Section: KNN & AI Parameters */}
            <section>
              <SectionHeader icon={<Cpu size={14}/>} title="Semantic & KNN Parameters" />
              <div className="grid grid-cols-2 gap-4">
                <ConfigField label="K (Neighbors)" type="number" value={localConfig.k} onChange={(v: string) => updateField('k', parseInt(v))} />
                <ConfigField label="Num Candidates" type="number" value={localConfig.numCandidates} onChange={(v: string) => updateField('numCandidates', parseInt(v))} />
                <ConfigField label="Text KNN Threshold" type="number" step="0.01" value={localConfig.textKnnThreshold} onChange={(v: string) => updateField('textKnnThreshold', parseFloat(v))} />
                <ConfigField label="Image KNN Threshold" type="number" step="0.01" value={localConfig.imageKnnThreshold} onChange={(v: string) => updateField('imageKnnThreshold', parseFloat(v))} />
                <ConfigField label="Image Boost" type="number" step="0.1" value={localConfig.imageBoost} onChange={(v: string) => updateField('imageBoost', parseFloat(v))} />
                <ConfigField label="Search Formula" value={localConfig.searchFormula} onChange={(v: string) => updateField('searchFormula', v)} className="col-span-2" />
              </div>
            </section>

            {/* Section: Context & Geo */}
            <section>
              <SectionHeader icon={<Globe size={14}/>} title="Localization & Environment" />
              <div className="grid grid-cols-2 gap-4">
                <ConfigField label="Context Type (type)" value={localConfig.ctxType} onChange={(v: string) => updateField('ctxType', v)} description="e.g. HOMEPAGE" />
                <ConfigField label="Language (lng)" value={localConfig.language} onChange={(v: string) => updateField('language', v)} />
                <ConfigField label="Locale" value={localConfig.locale} onChange={(v: string) => updateField('locale', v)} />
                <ConfigField label="Geo Code" value={localConfig.geoCode} onChange={(v: string) => updateField('geoCode', v)} />
                <ConfigField label="Geo Region" value={localConfig.geoRegionCode} onChange={(v: string) => updateField('geoRegionCode', v)} />
                <ConfigField label="Visitor ID (uid)" value={localConfig.uid} onChange={(v: string) => updateField('uid', v)} className="col-span-2" />
              </div>
            </section>

            {/* Section: Mapping */}
            <section>
              <SectionHeader icon={<Layout size={14}/>} title="Field Priority Mapping" />
              <div className="space-y-4">
                <ConfigField 
                  label="Title (priority list)" 
                  value={localConfig.mapping.title.join(', ')} 
                  onChange={(v: string) => setLocalConfig({...localConfig, mapping: {...localConfig.mapping, title: v.split(',').map((s: string) => s.trim())}})} 
                />
                <ConfigField 
                  label="Images (priority list)" 
                  value={localConfig.mapping.image.join(', ')} 
                  onChange={(v: string) => setLocalConfig({...localConfig, mapping: {...localConfig.mapping, image: v.split(',').map((s: string) => s.trim())}})} 
                />
                <ConfigField 
                  label="Price (priority list)" 
                  value={localConfig.mapping.price.join(', ')} 
                  onChange={(v: string) => setLocalConfig({...localConfig, mapping: {...localConfig.mapping, price: v.split(',').map((s: string) => s.trim())}})} 
                />
              </div>
            </section>

            {/* Actions */}
            <div className="sticky bottom-0 bg-[#0f0f0f] pt-6 pb-2 border-t border-gray-800 flex flex-col gap-3">
              <button 
                onClick={handleSave}
                className="w-full bg-[#cc0000] hover:bg-[#b00000] text-white font-bold py-4 rounded uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Save size={18} /> Update API Session
              </button>
              <button 
                onClick={handleReset}
                className="w-full bg-transparent border border-gray-700 hover:bg-gray-800 text-gray-500 py-3 rounded flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw size={14} /> Factory Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="pb-20">
            <div className="flex justify-between items-center mb-4">
              <SectionHeader icon={<Codepen size={14}/>} title="Final Request Payload" />
              {lastRequestPayload && (
                <button 
                  onClick={handleCopyRequest}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all text-[9px] uppercase font-bold ${
                    copied 
                    ? 'bg-green-500/20 border-green-500/50 text-green-500' 
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {copied ? <Check size={12}/> : <Copy size={12}/>}
                  {copied ? 'Copied' : 'Copy Payload'}
                </button>
              )}
            </div>
            <p className="text-zinc-500 text-[9px] mb-4">Copy-paste this payload into API clients for direct testing.</p>
            <div className="relative bg-black/40 border border-white/5 p-4 rounded-lg overflow-x-auto group">
              <pre className="text-green-500/80 text-[9px] selection:bg-green-500/20">
                {lastRequestPayload ? JSON.stringify(lastRequestPayload, null, 2) : "// No request captured yet. Perform a search first."}
              </pre>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const SectionHeader = ({ icon, title }: any) => (
  <h3 className="text-zinc-500 mb-6 uppercase flex items-center gap-2 font-bold tracking-[0.2em] text-[9px]">
    {icon} {title}
  </h3>
);

const ConfigField = ({ label, value, onChange, description, type = "text", step, className = "" }: any) => (
  <div className={className}>
    <div className="flex justify-between mb-1.5 px-0.5">
      <label className="text-zinc-400 font-bold uppercase tracking-tighter text-[9px]">{label}</label>
      {description && <span className="text-zinc-600 italic text-[8px]">{description}</span>}
    </div>
    <input 
      type={type}
      step={step}
      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded text-zinc-100 focus:border-green-500/50 focus:bg-zinc-800/50 outline-none transition-all placeholder:text-zinc-700"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const Toggle = ({ label, checked, onChange }: any) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <div 
      onClick={() => onChange(!checked)}
      className={`relative w-8 h-4 rounded-full transition-colors ${checked ? 'bg-green-600' : 'bg-zinc-800'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
    <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase text-[9px] font-bold">{label}</span>
  </label>
);
