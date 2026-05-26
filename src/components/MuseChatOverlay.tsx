import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
import { useShoppingMuse, ShoppingMuseWidget } from '../hooks/useShoppingMuse';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  widgets?: ShoppingMuseWidget[];
  support?: boolean;
}

interface MuseChatOverlayProps {
  onClose: () => void;
}

function getSlotDisplayName(slot: { sku?: string; productData?: Record<string, unknown> }): string {
  const candidateKeys = ['name', 'title', 'productName'];
  for (const key of candidateKeys) {
    const value = slot.productData?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return slot.sku ?? 'Unnamed product';
}

export const MuseChatOverlay: React.FC<MuseChatOverlayProps> = ({ onClose }) => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi, I am Muse. Tell me what you want to shop for and I will help you find products.',
    },
  ]);

  const { mutateAsync, isPending, error } = useShoppingMuse();
  const listRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(() => draft.trim().length > 0 && draft.trim().length <= 250 && !isPending, [draft, isPending]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isPending]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || text.length > 250 || isPending) {
      return;
    }

    setDraft('');

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        text,
      },
    ]);

    try {
      const response = await mutateAsync({ text, chatId: chatId ?? undefined });

      if (response.chatId) {
        setChatId(response.chatId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: response.assistant || 'I do not have a response yet. Try refining your request.',
          widgets: response.widgets,
          support: response.support,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Shopping Muse request failed';
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          text: `Sorry, I ran into an error: ${message}`,
        },
      ]);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full max-w-2xl h-[80vh] max-h-[760px] bg-white rounded-lg shadow-2xl border border-black/5 flex flex-col"
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">Ask Muse</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#fcfcfc]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed border ${
                    msg.role === 'user'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-200'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.support ? (
                    <p className="mt-2 text-xs uppercase tracking-wider opacity-80">Support suggested</p>
                  ) : null}

                  {msg.widgets && msg.widgets.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {msg.widgets.map((widget, widgetIdx) => (
                        <div key={`${msg.id}-widget-${widgetIdx}`} className="rounded border border-gray-100 p-2 bg-[#fafafa]">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                            {widget.title || 'Recommendations'}
                          </p>
                          <ul className="mt-2 space-y-1 text-xs text-gray-700">
                            {(widget.slots || []).slice(0, 5).map((slot, slotIdx) => (
                              <li key={`${slot.slotId || slot.sku || slotIdx}`} className="flex justify-between gap-3">
                                <span className="truncate">{getSlotDisplayName(slot)}</span>
                                <span className="text-gray-400">{slot.sku || 'N/A'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {isPending ? (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white text-gray-500">
                  Muse is thinking...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-gray-100 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask for products, outfits, style ideas, or recommendations..."
                rows={2}
                maxLength={250}
                className="flex-1 resize-none bg-black/5 hover:bg-black/8 focus:bg-white border border-transparent focus:border-black rounded-sm py-2 px-3 text-sm transition-all outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!canSend}
                className={`h-10 px-4 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors ${
                  canSend ? 'bg-black text-white hover:bg-gray-900' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Send size={14} />
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider">
              <span>Enter to send, Shift+Enter for new line</span>
              <span>{draft.trim().length}/250</span>
            </div>
            {error ? <p className="mt-2 text-xs text-red-600">{error.message}</p> : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
