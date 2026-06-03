import { useState } from 'react';
import { Heart, ShoppingBag, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoreInfo } from './ScoreInfoIcon';
import { useConfig } from '../context/ConfigContext';

interface ProductCardProps {
  item: any;
  onVisualSearch?: (imageUrl: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onVisualSearch }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { config } = useConfig();

  if (!item) return null;

  const title = item.name || item.productName || 'Unknown Product';
  const price = item.price !== undefined ? item.price : (item.dy_display_price || '0.00');
  const imageUrl = item.image_url || item.image_url_small || item.imageUrl || '';
  const productUrl = item.url || item.product_url || '#';
  const brand = typeof item.brand === 'string' ? item.brand.trim() : '';
  const secondaryImageUrl = item.image_url_secondary || imageUrl;
  const currency = (config.currency || 'PLN').toUpperCase();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => productUrl !== '#' && window.open(productUrl, '_blank')}
    >
      {/* Image Container with Frosted Glass Overlay */}
      <div className="relative aspect-3/4 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img 
            src={isHovered ? (secondaryImageUrl || imageUrl) : imageUrl} 
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/400x600?text=No+Image';
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-300">
            <ShoppingBag size={48} strokeWidth={1} />
          </div>
        )}
        
        {/* Score Info Icon */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <ScoreInfo item={item} />
        </div>
        
        {/* SALE Badge - Sinsay Style */}
        {item.on_sale && (
          <div className="absolute top-2 left-2 bg-sinsay-red text-white text-[10px] font-bold px-2 py-1 tracking-wider">
            SALE
          </div>
        )}

        {/* ECO Badge */}
        {item.eco_aware && (
          <div className="absolute bottom-2 left-2 bg-green-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
            ECO AWARE
          </div>
        )}

        {/* Wishlist Button */}
        <button className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 transition-colors">
          <Heart size={18} className={`text-gray-900 group-hover:text-black drop-shadow-sm`} />
        </button>

        {/* Quick Add Overlay - Frosted Glass */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-x-0 bottom-0 frosted-glass p-4 space-y-2"
            >
              <button className="w-full bg-black text-white py-2 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors">
                <ShoppingBag size={14} /> Add to Cart
              </button>
              {onVisualSearch && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const selectedImageUrl = imageUrl || item.image_url_small || item.imageUrl || '';
                    if (selectedImageUrl) {
                      onVisualSearch(selectedImageUrl);
                    }
                  }}
                  className="w-full bg-white/85 text-black py-2 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-colors border border-black/20"
                  title="Search with this product image"
                >
                  <Camera size={14} /> Visual Search
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Container */}
      <div className="mt-3 space-y-1">
        {brand ? <p className="text-[10px] text-gray-400 uppercase tracking-widest">{brand}</p> : null}
        <h3 className="text-[13px] font-normal text-gray-800 line-clamp-1 leading-tight">{title}</h3>
        <div className="flex items-baseline gap-2">
          {item.discount_percentage ? (
            <>
              <p className="text-[14px] font-bold text-sinsay-red">{price} {currency}</p>
              <p className="text-[11px] text-gray-400 line-through">{(price * 1.3).toFixed(2)} {currency}</p>
            </>
          ) : (
            <p className="text-[14px] font-bold">{price} {currency}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
