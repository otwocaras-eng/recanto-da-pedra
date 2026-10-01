/**
 * RECANTO DA PEDRA — POUSADA & GASTRONOMIA
 * Sistema de Internacionalização (i18n), Localização e SEO Multilíngue Avançado
 * Suporte: pt-BR (padrão), en-US, es
 */

(function () {
  'use strict';

  const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es'];
  const DEFAULT_LOCALE = 'pt-BR';
  const STORAGE_KEY = 'recanto-lang';

  // Cache em memória dos arquivos de tradução carregados sob demanda
  const localeCache = {};

  // Resolução de chaves aninhadas (ex: "seo.ogTitle", "hero.titleHtml")
  function getNestedTranslation(obj, keyPath) {
    if (!obj || !keyPath) return null;
    const keys = keyPath.split('.');
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    return current;
  }

  // Detecção de idioma inicial com prioridades
  function detectInitialLanguage() {
    // 1. Detecção por URL / subpasta (/en/, /es/) ou query param (?lang=)
    try {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname.includes('/en/') || pathname.endsWith('/en')) return 'en-US';
      if (pathname.includes('/es/') || pathname.endsWith('/es')) return 'es';

      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang) {
        const cleaned = urlLang.trim().toLowerCase();
        if (cleaned.startsWith('pt')) return 'pt-BR';
        if (cleaned.startsWith('es')) return 'es';
        if (cleaned.startsWith('en')) return 'en-US';
      }
    } catch (e) {
      console.warn('[i18n] Erro ao ler URL:', e);
    }

    // 2. Preferência manual salva em localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LOCALES.includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('[i18n] localStorage indisponível:', e);
    }

    // 3. Idioma do navegador do usuário
    try {
      const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      if (browserLang.startsWith('pt')) return 'pt-BR';
      if (browserLang.startsWith('es')) return 'es';
      return 'en-US'; // Padrão internacional para os demais países
    } catch (e) {
      return DEFAULT_LOCALE;
    }
  }

  // Carregamento sob demanda (lazy-loading do arquivo JSON necessário)
  async function loadTranslations(lang) {
    if (localeCache[lang]) {
      return localeCache[lang];
    }

    try {
      const basePath = window.RECANTO_I18N_BASE_PATH || 'locales/';
      const response = await fetch(`${basePath}${lang}.json?v=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ao carregar ${lang}.json`);
      }
      const data = await response.json();
      localeCache[lang] = data;
      return data;
    } catch (err) {
      console.warn(`[i18n] Falha ao carregar ${lang}.json:`, err);
      if (lang !== DEFAULT_LOCALE && localeCache[DEFAULT_LOCALE]) {
        return localeCache[DEFAULT_LOCALE];
      }
      return {};
    }
  }

  class I18nManager {
    constructor() {
      this.currentLang = detectInitialLanguage();
      this.activeTranslations = null;
      this.fallbackTranslations = null;
      this.isReady = false;

      // Define lang no elemento raiz <html> imediatamente
      document.documentElement.setAttribute('lang', this.currentLang);
    }

    async init() {
      // Carregamento sob demanda: carrega APENAS o idioma ativo inicialmente
      this.activeTranslations = await loadTranslations(this.currentLang);

      // Se o idioma ativo não for pt-BR, podemos carregar pt-BR em segundo plano para fallback resiliente
      if (this.currentLang !== DEFAULT_LOCALE) {
        loadTranslations(DEFAULT_LOCALE).then(fallbackData => {
          this.fallbackTranslations = fallbackData;
        }).catch(() => {});
      } else {
        this.fallbackTranslations = this.activeTranslations;
      }

      this.isReady = true;

      // Aplicar textos no DOM, meta tags e dados estruturados
      this.applyTranslations();
      this.updateSEOMetaTags();
      this.updateStructuredData();
      this.updateLanguageSelectors();

      // Disparar evento para componentes dinâmicos (app.js)
      this.emitChange();
    }

    // Tradução com interpolação e fallback inteligente
    t(keyPath, params = {}) {
      let translation = getNestedTranslation(this.activeTranslations, keyPath);

      if (translation === null || translation === undefined) {
        translation = getNestedTranslation(this.fallbackTranslations, keyPath);
      }

      if (translation === null || translation === undefined) {
        return keyPath;
      }

      if (typeof translation !== 'string') {
        return translation;
      }

      let result = translation;
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
      return result;
    }

    // Troca dinâmica de idioma sem recarregar a página
    async setLanguage(newLang) {
      if (!SUPPORTED_LOCALES.includes(newLang)) return;
      if (newLang === this.currentLang && this.isReady) return;

      this.currentLang = newLang;
      document.documentElement.setAttribute('lang', newLang);

      // Salvar preferência do usuário
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch (e) {
        console.warn('[i18n] Não foi possível salvar preferência:', e);
      }

      // Carregamento sob demanda do novo catálogo
      this.activeTranslations = await loadTranslations(newLang);

      // Atualizar interface e SEO
      this.applyTranslations();
      this.updateSEOMetaTags();
      this.updateStructuredData();
      this.updateLanguageSelectors();
      this.announceLanguageChange();
      this.updateURLRoute();
      this.emitChange();
    }

    // Aplicação no DOM
    applyTranslations() {
      // 1. Título e Descrição básica
      const metaTitle = this.t('meta.title');
      if (metaTitle && metaTitle !== 'meta.title') {
        document.title = metaTitle;
      }

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        const descText = this.t('meta.description');
        if (descText && descText !== 'meta.description') {
          metaDesc.setAttribute('content', descText);
        }
      }

      // 2. Elementos com data-i18n
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = this.t(key);

        if (typeof translated === 'string') {
          if (key.endsWith('Html') || /<\/?[a-z][\s\S]*>/i.test(translated)) {
            el.innerHTML = translated;
          } else {
            el.textContent = translated;
          }
        }
      });

      // 3. Atributos traduzíveis com data-i18n-attr
      document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const config = el.getAttribute('data-i18n-attr');
        if (!config) return;

        const pairs = config.split(',');
        pairs.forEach(pair => {
          const [attr, key] = pair.split(':').map(s => s.trim());
          if (attr && key) {
            const val = this.t(key);
            if (val && typeof val === 'string') {
              el.setAttribute(attr, val);
            }
          }
        });
      });
    }

    // Atualização dinâmica de SEO: Open Graph, Twitter Cards e Canonical
    updateSEOMetaTags() {
      const ogTitle = this.t('seo.ogTitle') || this.t('meta.title');
      const ogDesc = this.t('seo.ogDescription') || this.t('meta.description');
      const ogLocale = this.t('seo.ogLocale') || (this.currentLang === 'pt-BR' ? 'pt_BR' : this.currentLang === 'es' ? 'es_ES' : 'en_US');
      const twTitle = this.t('seo.twitterTitle') || ogTitle;
      const twDesc = this.t('seo.twitterDescription') || ogDesc;

      const setMeta = (selector, content) => {
        const el = document.querySelector(selector);
        if (el && content) el.setAttribute('content', content);
      };

      setMeta('meta[property="og:title"]', ogTitle);
      setMeta('meta[property="og:description"]', ogDesc);
      setMeta('meta[property="og:locale"]', ogLocale);
      setMeta('meta[name="twitter:title"]', twTitle);
      setMeta('meta[name="twitter:description"]', twDesc);

      // Atualizar Canonical conforme o idioma
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      if (canonicalEl) {
        const baseOrigin = window.location.origin;
        let canonicalHref = `${baseOrigin}/recanto-da-pedra/pousada/`;
        if (this.currentLang === 'en-US') canonicalHref += 'en/';
        else if (this.currentLang === 'es') canonicalHref += 'es/';
        canonicalEl.setAttribute('href', canonicalHref);
      }
    }

    // Atualização de dados estruturados Schema.org (Hotel e Restaurante)
    updateStructuredData() {
      // 1. Hotel / LodgingBusiness Schema
      const hotelData = {
        "@context": "https://schema.org",
        "@type": "Hotel",
        "name": this.t('schema.hotelName') || "Recanto da Pedra",
        "description": this.t('schema.hotelDescription') || this.t('meta.description'),
        "url": window.location.href,
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
        "telephone": "+552835341599",
        "priceRange": "R$ 720 - R$ 1.180",
        "checkinTime": "14:00",
        "checkoutTime": "12:00",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Rua Adir, R. Ady Fernandes Mignone",
          "addressLocality": "Iriri, Anchieta",
          "addressRegion": "ES",
          "postalCode": "29230-000",
          "addressCountry": "BR"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": -20.8247926,
          "longitude": -40.6480112
        },
        "amenityFeature": (this.t('schema.amenities') || []).map(am => ({
          "@type": "LocationFeatureSpecification",
          "name": am,
          "value": true
        }))
      };

      let hotelScript = document.getElementById('schema-hotel');
      if (!hotelScript) {
        hotelScript = document.createElement('script');
        hotelScript.id = 'schema-hotel';
        hotelScript.type = 'application/ld+json';
        document.head.appendChild(hotelScript);
      }
      hotelScript.textContent = JSON.stringify(hotelData, null, 2);

      // 2. Restaurant Schema
      const restaurantData = {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": this.t('schema.restaurantName') || "Restaurante Recanto da Pedra",
        "description": this.t('schema.restaurantDescription') || "Restaurante de alta gastronomia capixaba",
        "image": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        "telephone": "+552835341599",
        "servesCuisine": this.t('schema.cuisine') || ["Capixaba", "Frutos do Mar"],
        "priceRange": "$$$",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Rua Adir, R. Ady Fernandes Mignone",
          "addressLocality": "Iriri, Anchieta",
          "addressRegion": "ES",
          "postalCode": "29230-000",
          "addressCountry": "BR"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Monday"],
            "opens": "11:00",
            "closes": "23:00"
          },
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Sunday",
            "opens": "11:00",
            "closes": "16:00"
          }
        ]
      };

      let restaurantScript = document.getElementById('schema-restaurant');
      if (!restaurantScript) {
        restaurantScript = document.createElement('script');
        restaurantScript.id = 'schema-restaurant';
        restaurantScript.type = 'application/ld+json';
        document.head.appendChild(restaurantScript);
      }
      restaurantScript.textContent = JSON.stringify(restaurantData, null, 2);
    }

    // Acessibilidade: Notificar leitores de tela via aria-live
    announceLanguageChange() {
      let announcer = document.getElementById('i18nLiveAnnouncer');
      if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'i18nLiveAnnouncer';
        announcer.className = 'sr-only';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
      }
      const message = this.t('a11y.langAnnouncement') || `Idioma alterado para ${this.currentLang}`;
      announcer.textContent = message;
    }

    // Sincronizar URL para manter consistência sem recarregar
    updateURLRoute() {
      try {
        if (!window.history || !window.history.pushState) return;
        const currentPath = window.location.pathname;
        let newPath = currentPath;

        // Limpa sufixos de idioma anteriores (/en/ ou /es/)
        newPath = newPath.replace(/\/en(\/)?$/i, '/').replace(/\/es(\/)?$/i, '/');
        if (!newPath.endsWith('/')) newPath += '/';

        if (this.currentLang === 'en-US') {
          newPath += 'en/';
        } else if (this.currentLang === 'es') {
          newPath += 'es/';
        }

        // Mantém parâmetros extras e hashes
        const newSearch = window.location.search;
        const newHash = window.location.hash;
        window.history.pushState({ lang: this.currentLang }, '', `${newPath}${newSearch}${newHash}`);
      } catch (e) {
        // Fallback silencioso se pushState sofrer restrições de ambiente
      }
    }

    // Atualiza estado visual e atributos dos seletores
    updateLanguageSelectors() {
      const selectors = document.querySelectorAll('.lang-selector, .mobile-lang-selector');
      selectors.forEach(container => {
        const buttons = container.querySelectorAll('.lang-btn');
        buttons.forEach(btn => {
          const btnLang = btn.getAttribute('data-lang');
          const isActive = btnLang === this.currentLang;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
      });
    }

    emitChange() {
      document.dispatchEvent(new CustomEvent('recantoLanguageChanged', {
        detail: {
          lang: this.currentLang,
          t: this.t.bind(this)
        }
      }));
    }

    // Formatadores locais de data com Intl
    formatDate(date, options) {
      try {
        return new Intl.DateTimeFormat(this.currentLang, options).format(date);
      } catch (e) {
        return date.toLocaleDateString();
      }
    }

    formatMonthShort(date) {
      try {
        const formatter = new Intl.DateTimeFormat(this.currentLang, { month: 'short' });
        let month = formatter.format(date).toUpperCase();
        return month.replace('.', '').trim();
      } catch (e) {
        return '';
      }
    }

    formatWeekday(date) {
      try {
        const formatter = new Intl.DateTimeFormat(this.currentLang, { weekday: 'long' });
        const name = formatter.format(date);
        return name.charAt(0).toUpperCase() + name.slice(1);
      } catch (e) {
        return '';
      }
    }

    formatNumber(num, options = {}) {
      try {
        return new Intl.NumberFormat(this.currentLang, options).format(num);
      } catch (e) {
        return String(num);
      }
    }

    formatCurrencyBRL(num) {
      try {
        return new Intl.NumberFormat(this.currentLang, {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0
        }).format(num);
      } catch (e) {
        return `R$ ${num}`;
      }
    }
  }

  // Instância global
  window.RecantoI18n = new I18nManager();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.RecantoI18n.init());
  } else {
    window.RecantoI18n.init();
  }
})();
