import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Send,
  Sparkles,
  Home as HomeIcon,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  ChevronRight,
  Info,
  CheckCheck,
  Clock,
  ArrowLeft,
  X,
  PhoneCall,
  MoreVertical,
  Smile,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCurrency } from '../../hooks/useCurrency';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SEED_THREADS = [
  {
    id: 'thread-1',
    participant: {
      id: 'host-elena',
      name: 'Elena Rostova',
      role: 'Host',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      online: true,
      superhost: true,
    },
    property: {
      id: 'prop-goa-villa',
      title: 'Luxury Beachfront Villa with Private Infinity Pool',
      city: 'Goa, India',
      image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80',
      pricePerNight: 250,
      checkIn: 'Oct 12, 2026',
      checkOut: 'Oct 17, 2026',
      guests: 2,
    },
    unreadCount: 1,
    messages: [
      {
        id: 'm-1',
        sender: 'host',
        text: 'Hello! Thank you for reserving the Beachfront Villa. We look forward to hosting your getaway in Goa!',
        timestamp: 'Yesterday at 4:15 PM',
      },
      {
        id: 'm-2',
        sender: 'guest',
        text: 'Hi Elena! We are super excited. Could we request an early check-in around 1:00 PM?',
        timestamp: 'Yesterday at 5:30 PM',
      },
      {
        id: 'm-3',
        sender: 'host',
        text: 'Absolutely! Our housekeeping will have the villa prepared by 12:30 PM. The digital door code is 4829. Let me know if you need anything else!',
        timestamp: '10m ago',
      },
    ],
  },
  {
    id: 'thread-2',
    participant: {
      id: 'host-marcus',
      name: 'Marcus Vance',
      role: 'Host',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      online: false,
      superhost: true,
    },
    property: {
      id: 'prop-swiss-chalet',
      title: 'Panoramic Alpine Chalet with Hot Tub & Matterhorn View',
      city: 'Zermatt, Switzerland',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=80',
      pricePerNight: 420,
      checkIn: 'Nov 05, 2026',
      checkOut: 'Nov 10, 2026',
      guests: 4,
    },
    unreadCount: 0,
    messages: [
      {
        id: 'm-4',
        sender: 'host',
        text: 'Greetings from Zermatt! Snow conditions on the glacier are pristine right now. Please remember vehicles are electric-only in town.',
        timestamp: '2 days ago',
      },
      {
        id: 'm-5',
        sender: 'guest',
        text: 'Thanks for the tip Marcus! Is there a ski equipment rental shop near the station?',
        timestamp: '2 days ago',
      },
      {
        id: 'm-6',
        sender: 'host',
        text: 'Yes! Glacier Sports is directly across from the train station. Mention my name for a 15% discount on ski passes and gear.',
        timestamp: '1 day ago',
      },
    ],
  },
  {
    id: 'thread-3',
    participant: {
      id: 'support-stayhub',
      name: 'StayHub Concierge & Support',
      role: 'Support Specialist',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      online: true,
      superhost: false,
    },
    property: null,
    unreadCount: 0,
    messages: [
      {
        id: 'm-7',
        sender: 'host',
        text: 'Welcome to StayHub! Your account is verified for priority check-in and instantaneous host messaging.',
        timestamp: '3 days ago',
      },
    ],
  },
];

const QUICK_PROMPTS = [
  'What is the WiFi network & password?',
  'Is early check-in possible?',
  'Can I request late checkout?',
  'Where is the keybox or smartlock?',
];

export default function Messages() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();

  const [threads, setThreads] = useState(() => {
    try {
      const saved = localStorage.getItem('stayhub_chat_threads');
      return saved ? JSON.parse(saved) : SEED_THREADS;
    } catch {
      return SEED_THREADS;
    }
  });

  const [activeThreadId, setActiveThreadId] = useState(() => {
    return searchParams.get('threadId') || threads[0]?.id || 'thread-1';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  const messagesEndRef = useRef(null);

  // Save threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stayhub_chat_threads', JSON.stringify(threads));
    } catch (e) {
      console.error('Failed saving threads', e);
    }
  }, [threads]);

  // Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThreadId, isTyping]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  // Mark thread as read when opened
  const handleSelectThread = (threadId) => {
    setActiveThreadId(threadId);
    setMobileView('chat');
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
    );
  };

  const handleSendMessage = (textToSend = inputText) => {
    const cleanText = textToSend.trim();
    if (!cleanText || !activeThread) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'guest',
      text: cleanText,
      timestamp: 'Just now',
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: [...t.messages, newMsg] }
          : t
      )
    );
    setInputText('');

    // Simulate real-time host auto-reply after 1.5 seconds
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "Got it! That works perfectly for us. Let me know if you need anything else before your arrival!",
        "Thanks for reaching out! I've noted that down for your stay. See you soon!",
        "Understood! We'll make sure everything is ready for your arrival. Safe travels!",
        "The WiFi network is 'StayHub-Guest' and the password is 'welcomehome'. Enjoy your stay!",
      ];
      const replyText = responses[Math.floor(Math.random() * responses.length)];

      const hostReply = {
        id: `msg-reply-${Date.now()}`,
        sender: 'host',
        text: replyText,
        timestamp: 'Just now',
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, messages: [...t.messages, hostReply] }
            : t
        )
      );
    }, 1500);
  };

  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = t.participant.name.toLowerCase().includes(q);
    const propMatch = t.property?.title?.toLowerCase().includes(q);
    return nameMatch || propMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] min-h-[600px] flex flex-col">
      {/* Container Box */}
      <div className="flex-1 bg-white rounded-3xl border border-surface-border shadow-md overflow-hidden flex divide-x divide-surface-border">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Thread Roster */}
        {/* ========================================================================= */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col bg-surface-card/30 shrink-0 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Top Search & Title */}
          <div className="p-4 border-b border-surface-border">
            <h1 className="text-xl font-extrabold text-charcoal tracking-tight mb-3">
              Messages
            </h1>
            <div className="relative">
              <Search className="w-4 h-4 text-meta absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-white text-xs font-semibold border border-surface-border rounded-full focus:outline-none focus:border-charcoal transition-colors"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-surface-border/60">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-meta text-xs">
                No conversations found matching your search.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === activeThread?.id;
                const lastMsg = thread.messages[thread.messages.length - 1];

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-white shadow-xs border-l-4 border-l-airbnb'
                        : 'hover:bg-neutral-50/80'
                    }`}
                  >
                    {/* Participant Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={thread.participant.avatar}
                        alt={thread.participant.name}
                        className="w-12 h-12 rounded-full object-cover border border-surface-border shadow-2xs"
                      />
                      {thread.participant.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-bold text-charcoal truncate">
                          {thread.participant.name}
                        </h4>
                        <span className="text-[10px] text-meta shrink-0">
                          {lastMsg?.timestamp || ''}
                        </span>
                      </div>

                      {thread.property && (
                        <p className="text-[11px] font-semibold text-airbnb truncate mb-1">
                          {thread.property.title}
                        </p>
                      )}

                      <p className="text-xs text-meta line-clamp-1">
                        {lastMsg ? lastMsg.text : 'No messages yet'}
                      </p>
                    </div>

                    {/* Unread Pill */}
                    {thread.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-airbnb text-white text-[10px] font-black flex items-center justify-center shrink-0 self-center">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: Active Chat Stream */}
        {/* ========================================================================= */}
        {activeThread ? (
          <div
            className={`flex-1 flex flex-col bg-white ${
              mobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Chat Top Header */}
            <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileView('list')}
                  className="p-1.5 rounded-full hover:bg-neutral-100 text-charcoal md:hidden"
                  aria-label="Back to threads list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="relative">
                  <img
                    src={activeThread.participant.avatar}
                    alt={activeThread.participant.name}
                    className="w-10 h-10 rounded-full object-cover border border-surface-border shadow-2xs"
                  />
                  {activeThread.participant.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-charcoal text-sm">
                      {activeThread.participant.name}
                    </h3>
                    {activeThread.participant.superhost && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Superhost
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-meta">
                    {activeThread.participant.online ? 'Online now · Typically replies in minutes' : 'Offline'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeThread.property && (
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2 rounded-xl text-meta hover:text-charcoal hover:bg-neutral-100 transition-colors hidden lg:block"
                    title="Toggle Reservation Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-card/20">
              {/* Automated Security Notice */}
              <div className="text-center my-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white border border-surface-border text-meta shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>StayHub Protected Chat · Payments & agreements remain encrypted</span>
                </span>
              </div>

              {activeThread.messages.map((msg) => {
                const isMe = msg.sender === 'guest';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={activeThread.participant.avatar}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 border border-surface-border"
                      />
                    )}

                    <div className={`max-w-[78%] sm:max-w-md flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                          isMe
                            ? 'bg-charcoal text-white rounded-br-xs'
                            : 'bg-white text-charcoal border border-surface-border rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>

                      <div className="flex items-center gap-1 mt-1 text-[10px] text-meta px-1">
                        <span>{msg.timestamp}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-airbnb" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator bubble */}
              {isTyping && (
                <div className="flex items-end gap-2.5 justify-start animate-in fade-in duration-150">
                  <img
                    src={activeThread.participant.avatar}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                  />
                  <div className="bg-white border border-surface-border p-3 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-meta animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-meta animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-meta animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-5 py-2 border-t border-surface-border/60 bg-white flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-bold text-meta uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-airbnb" />
                Quick Prompts:
              </span>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-card hover:bg-neutral-200/60 text-charcoal border border-surface-border/80 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Composer Bar */}
            <div className="p-4 border-t border-surface-border bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full pl-4 pr-10 py-3 text-xs sm:text-sm font-medium border border-surface-border rounded-full outline-none focus:border-charcoal bg-surface-card/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setInputText((prev) => prev + ' 😊')}
                    className="absolute right-3.5 text-meta hover:text-charcoal transition-colors p-1"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 rounded-full bg-airbnb hover:bg-airbnb-dark text-white disabled:opacity-40 transition-transform active:scale-95 shadow-xs cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Contextual Reservation Summary */}
        {/* ========================================================================= */}
        {activeThread?.property && showSidebar && (
          <div className="w-72 lg:w-80 p-5 bg-white shrink-0 hidden xl:flex flex-col overflow-y-auto border-l border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal">
                Reservation Context
              </h4>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 text-meta hover:text-charcoal rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Property Image & Details */}
            <div className="space-y-4">
              <img
                src={activeThread.property.image}
                alt={activeThread.property.title}
                className="w-full h-40 rounded-2xl object-cover border border-surface-border shadow-xs"
              />

              <div>
                <h5 className="font-extrabold text-charcoal text-sm leading-snug">
                  {activeThread.property.title}
                </h5>
                <p className="text-xs text-meta flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{activeThread.property.city}</span>
                </p>
              </div>

              {/* Dates & Payout Breakdown */}
              <div className="p-3.5 rounded-2xl bg-surface-card border border-surface-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-meta">Check-in</span>
                  <span className="font-bold text-charcoal">{activeThread.property.checkIn}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-meta">Checkout</span>
                  <span className="font-bold text-charcoal">{activeThread.property.checkOut}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-meta">Guests</span>
                  <span className="font-bold text-charcoal">{activeThread.property.guests} guests</span>
                </div>
                <div className="pt-2 border-t border-surface-border flex items-center justify-between font-extrabold text-sm text-charcoal">
                  <span>Price / night</span>
                  <span className="text-airbnb">{formatPrice(activeThread.property.pricePerNight)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Link
                  to="/"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-surface-border hover:bg-surface-card text-charcoal text-xs font-bold transition-colors"
                >
                  <span>Explore Listing</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/bookings"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-charcoal text-white text-xs font-bold hover:bg-neutral-800 transition-colors"
                >
                  <span>Manage in My Trips</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
