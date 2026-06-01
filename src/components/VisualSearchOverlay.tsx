import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Camera, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { imageToBase64 } from '../utils/imageToBase64';
import { useVisualSearch, VisualSearchInput } from '../hooks/useVisualSearch';
import { ScoreInfo } from './ScoreInfoIcon';

interface VisualSearchOverlayProps {
  productImageUrl?: string;
  onClose: () => void;
}

export const VisualSearchOverlay: React.FC<VisualSearchOverlayProps> = ({
  productImageUrl,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(productImageUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useMode, setUseMode] = useState<'product' | 'upload'>(productImageUrl ? 'product' : 'upload');
  const [searchPayload, setSearchPayload] = useState<VisualSearchInput | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { results, totalResults, loading: isSearching, error: searchError } = useVisualSearch(searchPayload);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setConversionError('Please select a valid image file');
      return;
    }

    setSelectedFile(file);
    setSelectedImage(URL.createObjectURL(file));
    setUseMode('upload');
    setSearchPayload(null);
    setConversionError(null);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const runVisualSearch = async () => {
    setIsConverting(true);
    setConversionError(null);

    try {
      if (useMode === 'product' && productImageUrl) {
        setSearchPayload({ imageUrl: productImageUrl });
        return;
      }

      if (useMode === 'upload' && selectedFile) {
        const base64 = await imageToBase64(selectedFile);
        setSearchPayload({ imageBase64: base64 });
        return;
      }

      setConversionError('No image selected');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to prepare image for visual search';
      setConversionError(errorMsg);
      console.error('[Visual Search] Conversion error:', errorMsg);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSwitchMode = (mode: 'product' | 'upload') => {
    setUseMode(mode);
    setSearchPayload(null);
    setConversionError(null);

    if (mode === 'product') {
      setSelectedImage(productImageUrl || null);
    } else {
      setSelectedImage(selectedFile ? URL.createObjectURL(selectedFile) : null);
    }
  };

  const handleScrollContainerWheel = (e: React.WheelEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtTop = scrollTop === 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight;
    const isScrollingDown = e.deltaY > 0;
    const isScrollingUp = e.deltaY < 0;

    // Prevent default if at boundary and trying to scroll further
    if ((isAtTop && isScrollingUp) || (isAtBottom && isScrollingDown)) {
      e.preventDefault();
    }
    e.stopPropagation();
  };

  const currentDisplayImage = useMode === 'product' ? productImageUrl : selectedImage;
  const canSearch = currentDisplayImage && !isConverting && !isSearching;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start md:items-center justify-center p-2 md:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          onMouseDown={(e) => e.stopPropagation()}
          className="relative my-2 md:my-0 w-full max-w-6xl md:max-w-7xl max-h-[95vh] md:max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Camera size={20} className="text-black" />
              <h2 className="text-lg font-bold uppercase tracking-wider">Visual Search</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto md:overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 p-4 md:p-6 h-auto lg:h-full">
              {/* Image Selection Section */}
              <div className="space-y-4 lg:col-span-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  Select Image
                </h3>

                {/* Mode Toggle Buttons */}
                <div className="flex gap-2">
                  {productImageUrl && (
                    <button
                      onClick={() => handleSwitchMode('product')}
                      className={`flex-1 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                        useMode === 'product'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-black hover:bg-gray-200'
                      }`}
                    >
                      Product Image
                    </button>
                  )}
                  <button
                    onClick={() => handleSwitchMode('upload')}
                    className={`flex-1 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                      useMode === 'upload'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                  >
                    Upload Image
                  </button>
                </div>

                {/* Image Preview */}
                {currentDisplayImage ? (
                  <div className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                    <img
                      src={currentDisplayImage}
                      alt="Selected"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/400x400?text=Image+Error';
                      }}
                    />
                  </div>
                ) : null}

                {/* Upload Area (conditionally shown) */}
                {useMode === 'upload' && !selectedImage && (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-100 transition-all"
                  >
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Drag & drop image here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">or click to select</p>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  aria-label="Upload image"
                />

                {/* Change Image Button (for upload mode) */}
                {useMode === 'upload' && selectedImage && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 bg-gray-100 text-black text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-200 transition-all"
                  >
                    Change Image
                  </button>
                )}

                {/* Error Display */}
                {conversionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
                    {conversionError}
                  </div>
                )}

                {searchError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
                    {searchError}
                  </div>
                )}

                {/* Search Button */}
                <button
                  onClick={runVisualSearch}
                  disabled={!canSearch}
                  className={`w-full px-4 py-3 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                    canSearch
                      ? 'bg-black text-white hover:bg-gray-900'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {isConverting || isSearching ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin">⋯</span>
                      Searching...
                    </span>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>

              {/* Results Section */}
              <div className="flex flex-col min-h-72 lg:h-full lg:min-h-0 lg:col-span-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4">
                  Results {totalResults > 0 ? `(${totalResults})` : results.length > 0 ? `(${results.length})` : ''}
                </h3>

                {isSearching ? (
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin text-4xl mb-4">⋯</div>
                      <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">
                        Searching...
                      </p>
                    </div>
                  </div>
                ) : searchPayload ? (
                  results.length === 0 ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                      <div className="text-center">
                        <Camera size={32} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">
                          No results found
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      ref={scrollContainerRef}
                      onWheel={handleScrollContainerWheel}
                      className="flex-1 min-h-0 max-h-[55vh] lg:max-h-none w-full overflow-y-auto pr-2 custom-scrollbar bg-gray-50 rounded">
                      <div className="space-y-2 p-2">
                        {results.slice(0, 20).map((item: any, idx: number) => (
                          <div key={`${item.id || item.sku || idx}`} className="relative border border-gray-100 rounded p-2 hover:border-black transition-colors bg-white shadow-sm group">
                            {/* Score Info Icon */}
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <ScoreInfo item={item} />
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-gray-100">
                                <img
                                  src={
                                    item.image_url ||
                                    item.image_url_small ||
                                    item.imageUrl ||
                                    item.productData?.image_url ||
                                    item.productData?.imageUrl ||
                                    'https://placehold.co/200x200?text=No+Image'
                                  }
                                  alt={item.name || item.productData?.name || 'Product'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+Image';
                                  }}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold line-clamp-2 mb-1">
                                  {item.name || item.productData?.name || 'Unknown'}
                                </p>
                                <p className="text-sm font-bold text-sinsay-red">
                                  {item.price || item.dy_display_price || item.productData?.dy_display_price || 'N/A'} PLN
                                </p>
                                <p className="text-[11px] text-gray-400 truncate mt-1">
                                  SKU: {item.sku || item.productData?.sku || item.id || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center text-gray-500">
                      <Camera size={32} className="mx-auto mb-4" />
                      <p className="text-sm uppercase tracking-wider font-medium">
                        Select or upload an image to begin visual search.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
