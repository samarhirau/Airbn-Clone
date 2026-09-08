import { useEffect } from 'react';

/**
 * Universal SEO & Social OpenGraph Meta Manager
 * Updates document.title and standard meta tags dynamically
 */
export default function SEO({
  title = 'Vacation Homes & Condo Rentals',
  description = 'Find the perfect place to stay at an amazing price across 191+ countries. Belong anywhere with StayHub.',
  image = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  url = window.location.href,
}) {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title.includes('StayHub') ? title : `${title} • StayHub`;
    document.title = formattedTitle;

    // Helper to update or create meta tags
    const updateMetaTag = (selector, attribute, value) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const [attrKey, attrVal] = selector.replace(/[\[\]"]/g, '').split('=');
        element.setAttribute(attrKey, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    // 2. Standard Meta Tags
    updateMetaTag('meta[name="description"]', 'content', description);

    // 3. OpenGraph Social Sharing (Facebook, LinkedIn, iMessage, WhatsApp)
    updateMetaTag('meta[property="og:title"]', 'content', formattedTitle);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:image"]', 'content', image);
    updateMetaTag('meta[property="og:url"]', 'content', url);
    updateMetaTag('meta[property="og:type"]', 'content', 'website');

    // 4. Twitter Summary Card
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', formattedTitle);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);
    updateMetaTag('meta[name="twitter:image"]', 'content', image);
  }, [title, description, image, url]);

  return null;
}
