/**
 * RECANTO DA PEDRA — POUSADA & GASTRONOMIA
 * Iriri, Costa Azul — Espírito Santo
 * Interações, Console de Reserva de Luxo e Navegação Fluida
 */

document.addEventListener('DOMContentLoaded', () => {
  // Sinalizar inicialização do JS (garantia de fallback para manter conteúdo visível se o JS falhar)
  document.documentElement.classList.add('js-ready');

  // 0. Gerenciamento de Tema (Modo Escuro / Modo Claro)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const navThemeToggle = document.getElementById('navThemeToggle');

  const getPreferredTheme = () => {
    const saved = localStorage.getItem('recanto-theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('recanto-theme', theme);

    const isDark = theme === 'dark';
    const label = isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro';
    const title = isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro';

    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('aria-label', label);
      themeToggleBtn.setAttribute('title', title);
      themeToggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }
    if (navThemeToggle) {
      navThemeToggle.setAttribute('aria-label', label);
      navThemeToggle.setAttribute('title', title);
    }
  };

  // Sincronizar tema no carregamento
  applyTheme(getPreferredTheme());

  const handleThemeToggle = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', handleThemeToggle);
  }
  if (navThemeToggle) {
    navThemeToggle.addEventListener('click', handleThemeToggle);
  }

  // Ouvir alterações de tema do sistema operacional se o usuário não salvou manualmente
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('recanto-theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // 1. Header Translúcido (> 60px), Barra de Progresso e Parallax do Hero com rAF
  const header = document.querySelector('.site-header');
  const readingProgressBar = document.getElementById('readingProgressBar');
  const heroSection = document.querySelector('.hero-section');
  const heroParallaxWrap = document.querySelector('.hero-parallax-wrap');
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let isHeroVisible = true;
  let scrollTicking = false;

  // Monitorar visibilidade do Hero para calcular parallax exclusivamente enquanto ele estiver visível na viewport
  if (heroSection && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isHeroVisible = entry.isIntersecting;
      });
    }, { threshold: 0 });
    heroObserver.observe(heroSection);
  }

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // Header translúcido ao rolar mais de 60px
    if (header) {
      if (currentScrollY > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // 10. Barra de Progresso de Leitura Fixa no Topo (scaleX de 0 a 1)
    if (readingProgressBar && !prefersReducedMotion) {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? Math.min(Math.max(currentScrollY / scrollableHeight, 0), 1) : 0;
      readingProgressBar.style.transform = `scaleX(${progress})`;
    }

    // Parallax suave no fundo do Hero: controlado pela variável CSS --hero-parallax-speed (padrão: 40% do scroll)
    // Desativado em telas menores que 768px (mobile) e para quem ativou redução de movimento
    if (heroParallaxWrap && isHeroVisible && !prefersReducedMotion && window.innerWidth > 768) {
      const rawSpeed = getComputedStyle(document.documentElement).getPropertyValue('--hero-parallax-speed').trim();
      const parallaxSpeed = parseFloat(rawSpeed) || 0.40;
      const translateY = currentScrollY * parallaxSpeed;
      heroParallaxWrap.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
    }

    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(handleScroll);
      scrollTicking = true;
    }
  }, { passive: true });

  // Executar no carregamento
  handleScroll();

  // Resetar transform se o usuário redimensionar para mobile
  window.addEventListener('resize', () => {
    if (heroParallaxWrap && window.innerWidth <= 768) {
      heroParallaxWrap.style.transform = 'none';
    }
  }, { passive: true });

  // 1.1 Scroll Reveal com IntersectionObserver (threshold ~0.15) e Cascata em Grupos (+0.1s)
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    // Configurar delays em cascata nos grupos (cards de suítes, gastronomia, experiências, etc.)
    document.querySelectorAll('[data-reveal-group]').forEach(group => {
      const groupItems = group.querySelectorAll('[data-reveal]');
      groupItems.forEach((item, index) => {
        if (!item.hasAttribute('data-reveal-delay')) {
          item.setAttribute('data-reveal-delay', (index * 0.1).toFixed(2));
        }
      });
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const delay = target.getAttribute('data-reveal-delay');
          if (delay) {
            target.style.transitionDelay = `${delay}s`;
          }
          target.classList.add('is-revealed');
          observer.unobserve(target); // Anima apenas uma vez
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('[data-reveal]').forEach(el => {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: se não houver IntersectionObserver ou houver preferência por menos movimento, exibe tudo
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-revealed'));
  }

  // 1.2 Destaque do Link Ativo no Menu Superior conforme a Seção Visível
  const navAnchorLinks = document.querySelectorAll('.main-nav .nav-link');
  const sectionTargetIds = ['o-refugio', 'acomodacoes', 'gastronomia', 'experiencias', 'informacoes', 'localizacao'];
  const trackedTargetSections = sectionTargetIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && trackedTargetSections.length > 0) {
    const navScrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          navAnchorLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      rootMargin: '-30% 0px -55% 0px',
      threshold: 0
    });

    trackedTargetSections.forEach(sec => navScrollObserver.observe(sec));
  }

  // 1.3 Rolagem Suave com Compensação do Cabeçalho Fixo ao Clicar em Âncoras
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerEl = document.querySelector('.site-header');
        const headerOffset = headerEl ? headerEl.offsetHeight : 80;
        const targetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: targetTop,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      }
    });
  });

  // 1.4 Efeito Magnético em Botões e Inclinação 3D (Tilt) em Cards
  // Ativado exclusivamente em dispositivos com capacidade real de hover (cursor fino/mouse)
  const isHoverCapable = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (isHoverCapable && !prefersReducedMotion) {
    // Efeito Magnético: botões seguem sutilmente a posição do cursor sem interferir na transição CSS
    const magneticButtons = document.querySelectorAll('.btn, .btn-luxury-quote');

    magneticButtons.forEach(btn => {
      let btnRaf = null;

      btn.addEventListener('mousemove', (e) => {
        if (btnRaf) return;
        btnRaf = requestAnimationFrame(() => {
          const rect = btn.getBoundingClientRect();
          // Deslocamento suave de até ~4-5px em direção ao cursor
          const offsetX = (e.clientX - rect.left - rect.width / 2) * 0.22;
          const offsetY = (e.clientY - rect.top - rect.height / 2) * 0.22;

          btn.style.setProperty('--mag-x', `${offsetX.toFixed(2)}px`);
          btn.style.setProperty('--mag-y', `${offsetY.toFixed(2)}px`);
          btnRaf = null;
        });
      }, { passive: true });

      btn.addEventListener('mouseleave', () => {
        if (btnRaf) {
          cancelAnimationFrame(btnRaf);
          btnRaf = null;
        }
        btn.style.setProperty('--mag-x', '0px');
        btn.style.setProperty('--mag-y', '0px');
      }, { passive: true });
    });

    // Inclinação 3D Suave (Tilt): cards acompanham o mouse com perspectiva de 900px e máx. 8 graus
    // Controlada dinamicamente pela variável CSS --card-tilt-max (padrão: 8deg)
    const tiltCards = document.querySelectorAll('.suite-card, .gastro-card, .exp-card');

    tiltCards.forEach(card => {
      let cardRaf = null;

      card.addEventListener('mousemove', (e) => {
        if (cardRaf) return;
        cardRaf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          // Posição percentual relativa ao centro (-0.5 a +0.5)
          const pctX = ((e.clientX - rect.left) / rect.width) - 0.5;
          const pctY = ((e.clientY - rect.top) / rect.height) - 0.5;

          // Rotação máxima lida dinamicamente da variável CSS --card-tilt-max (padrão: 8deg)
          const rawTilt = getComputedStyle(document.documentElement).getPropertyValue('--card-tilt-max').trim();
          const maxTiltDeg = parseFloat(rawTilt) || 8;
          const rotX = (-pctY * (maxTiltDeg * 2)).toFixed(2);
          const rotY = (pctX * (maxTiltDeg * 2)).toFixed(2);

          card.style.setProperty('--tilt-rx', `${rotX}deg`);
          card.style.setProperty('--tilt-ry', `${rotY}deg`);
          cardRaf = null;
        });
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        if (cardRaf) {
          cancelAnimationFrame(cardRaf);
          cardRaf = null;
        }
        card.style.setProperty('--tilt-rx', '0deg');
        card.style.setProperty('--tilt-ry', '0deg');
      }, { passive: true });
    });
  }

  // 2. Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
      const isExpanded = mainNav.classList.contains('active');
      mobileToggle.setAttribute('aria-expanded', isExpanded);
      mobileToggle.innerHTML = isExpanded ? '✕' : '☰';
    });

    mainNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        if (mobileToggle) mobileToggle.innerHTML = '☰';
      });
    });
  }

  // 3. Formatação Inteligente de Datas e Console de Reservas
  const monthsPt = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const weekdaysPt = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  const formatDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Elementos do Console
  const barCheckin = document.getElementById('barCheckin');
  const barCheckout = document.getElementById('barCheckout');
  const checkinCell = document.getElementById('checkinCell');
  const checkoutCell = document.getElementById('checkoutCell');

  const checkinDayDisplay = document.getElementById('checkinDayDisplay');
  const checkinMonthDisplay = document.getElementById('checkinMonthDisplay');
  const checkinWeekdayDisplay = document.getElementById('checkinWeekdayDisplay');

  const checkoutDayDisplay = document.getElementById('checkoutDayDisplay');
  const checkoutMonthDisplay = document.getElementById('checkoutMonthDisplay');
  const checkoutWeekdayDisplay = document.getElementById('checkoutWeekdayDisplay');

  const nightsSummaryText = document.getElementById('nightsSummaryText');
  const connectorNightsPill = document.getElementById('connectorNightsPill');

  const barGuests = document.getElementById('barGuests');
  const guestsSubtext = document.getElementById('guestsSubtext');

  const barSuite = document.getElementById('barSuite');
  const suiteSubtext = document.getElementById('suiteSubtext');

  // Inicializar datas padrão (Hoje / +2 noites)
  const today = new Date();
  const defaultCheckout = new Date();
  defaultCheckout.setDate(today.getDate() + 2);

  const todayStr = formatDateString(today);
  const checkoutStr = formatDateString(defaultCheckout);

  if (barCheckin) {
    barCheckin.min = todayStr;
    barCheckin.value = todayStr;
  }

  if (barCheckout) {
    barCheckout.min = todayStr;
    barCheckout.value = checkoutStr;
  }

  // Atualizar displays visuais do Console
  const updateConsoleDisplays = () => {
    if (!barCheckin || !barCheckout) return;

    const inDate = parseLocalDate(barCheckin.value);
    const outDate = parseLocalDate(barCheckout.value);

    // Validação: Check-out deve ser ao menos 1 dia após Check-in
    if (outDate <= inDate) {
      const nextDay = new Date(inDate);
      nextDay.setDate(inDate.getDate() + 1);
      barCheckout.value = formatDateString(nextDay);
      return updateConsoleDisplays();
    }

    // Atualizar Check-in Visual
    if (checkinDayDisplay) checkinDayDisplay.textContent = String(inDate.getDate()).padStart(2, '0');
    if (checkinMonthDisplay) checkinMonthDisplay.textContent = monthsPt[inDate.getMonth()];
    if (checkinWeekdayDisplay) checkinWeekdayDisplay.textContent = weekdaysPt[inDate.getDay()];

    // Atualizar Check-out Visual
    if (checkoutDayDisplay) checkoutDayDisplay.textContent = String(outDate.getDate()).padStart(2, '0');
    if (checkoutMonthDisplay) checkoutMonthDisplay.textContent = monthsPt[outDate.getMonth()];
    if (checkoutWeekdayDisplay) checkoutWeekdayDisplay.textContent = weekdaysPt[outDate.getDay()];

    // Calcular Noites
    const diffTime = Math.abs(outDate - inDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nightWord = diffDays === 1 ? '1 Noite' : `${diffDays} Noites`;

    if (nightsSummaryText) {
      nightsSummaryText.textContent = `${nightWord} de Estadia (${weekdaysPt[inDate.getDay()].split('-')[0]} a ${weekdaysPt[outDate.getDay()].split('-')[0]})`;
    }

    if (connectorNightsPill) {
      connectorNightsPill.textContent = `${diffDays} ${diffDays === 1 ? 'noite' : 'noites'}`;
    }
  };

  // Abrir calendário ao clicar em qualquer ponto da célula
  const triggerPicker = (inputEl) => {
    if (!inputEl) return;
    try {
      if (typeof inputEl.showPicker === 'function') {
        inputEl.showPicker();
      } else {
        inputEl.focus();
      }
    } catch (err) {
      inputEl.focus();
    }
  };

  if (checkinCell && barCheckin) {
    checkinCell.addEventListener('click', () => triggerPicker(barCheckin));
    barCheckin.addEventListener('change', () => {
      // Ajustar min de checkout
      const inDate = parseLocalDate(barCheckin.value);
      const minOut = new Date(inDate);
      minOut.setDate(inDate.getDate() + 1);
      barCheckout.min = formatDateString(minOut);

      if (parseLocalDate(barCheckout.value) <= inDate) {
        barCheckout.value = formatDateString(minOut);
      }
      updateConsoleDisplays();
    });
  }

  if (checkoutCell && barCheckout) {
    checkoutCell.addEventListener('click', () => triggerPicker(barCheckout));
    barCheckout.addEventListener('change', updateConsoleDisplays);
  }

  // Atualizar legendas dos seletores de Hóspedes e Suítes
  if (barGuests && guestsSubtext) {
    const guestSubtextMap = {
      '1 Hóspede (Individual)': '1 Suíte privativa • Conforto solo',
      '2 Hóspedes (Casal / Duplo)': '1 Cama King • Perfeito para casal',
      '3 Hóspedes (Triplo)': '1 Suíte espaçosa • Cama extra',
      'Família (4 ou mais)': 'Acomodação família • Máxima comodidade'
    };

    barGuests.addEventListener('change', () => {
      guestsSubtext.textContent = guestSubtextMap[barGuests.value] || '1 suíte privativa';
    });
  }

  if (barSuite && suiteSubtext) {
    const suiteSubtextMap = {
      'Todas as Acomodações': 'Melhor diária disponível',
      'Suíte Costa Azul': 'A partir de R$ 720 / noite',
      'Suíte Mirante da Pedra': 'A partir de R$ 940 / noite',
      'Bangalô das Enseadas': 'A partir de R$ 1.180 / noite'
    };

    barSuite.addEventListener('change', () => {
      suiteSubtext.textContent = suiteSubtextMap[barSuite.value] || 'Melhor diária disponível';
    });
  }

  // Executar atualização inicial
  updateConsoleDisplays();

  // 4. Modal de Reserva
  const modalOverlay = document.getElementById('bookingModal');
  const modalClose = document.querySelector('.modal-close');
  const openModalButtons = document.querySelectorAll('.js-open-modal');
  const modalSuiteSelect = document.getElementById('modalSuiteSelect');
  const modalCheckin = document.getElementById('modalCheckin');
  const modalCheckout = document.getElementById('modalCheckout');

  if (modalCheckin) {
    modalCheckin.min = todayStr;
    modalCheckin.value = todayStr;
  }
  if (modalCheckout) {
    modalCheckout.min = todayStr;
    modalCheckout.value = checkoutStr;
  }

  const openModal = (suiteName = '') => {
    if (modalOverlay) {
      if (suiteName && modalSuiteSelect) {
        modalSuiteSelect.value = suiteName;
      }
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  openModalButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const suite = btn.getAttribute('data-suite') || '';
      openModal(suite);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // 5. Envio do Formulário de Reserva para o WhatsApp Oficial
  const WHATSAPP_NUMBER = "5528999750058"; 

  const handleBookingSubmit = (checkin, checkout, guests, suite, name = '') => {
    const inDate = parseLocalDate(checkin);
    const outDate = parseLocalDate(checkout);
    const diffTime = Math.abs(outDate - inDate);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const formattedIn = `${String(inDate.getDate()).padStart(2, '0')}/${String(inDate.getMonth() + 1).padStart(2, '0')}/${inDate.getFullYear()}`;
    const formattedOut = `${String(outDate.getDate()).padStart(2, '0')}/${String(outDate.getMonth() + 1).padStart(2, '0')}/${outDate.getFullYear()}`;

    const text = `🌊 *CONSULTA DE RESERVA — RECANTO DA PEDRA (IRIRI/ES)*
${name ? `• *Hóspede:* ${name}\n` : ''}• *Check-in:* ${formattedIn} (${weekdaysPt[inDate.getDay()]})
• *Check-out:* ${formattedOut} (${weekdaysPt[outDate.getDay()]})
• *Duração:* ${nights} ${nights === 1 ? 'diária' : 'diárias'}
• *Hóspedes:* ${guests}
• *Acomodação:* ${suite}
• *Origem:* Tarifa Oficial do Site (com Café da Manhã Capixaba Incluso)

Gostaria de verificar a disponibilidade e confirmar os valores para o período.`;

    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;
    window.open(url, '_blank');
  };

  // Submissão do Console do Hero
  const quickBookingForm = document.getElementById('quickBookingForm');
  if (quickBookingForm) {
    quickBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const checkin = barCheckin ? barCheckin.value : todayStr;
      const checkout = barCheckout ? barCheckout.value : checkoutStr;
      const guests = barGuests ? barGuests.value : '2 Hóspedes';
      const suite = barSuite ? barSuite.value : 'Todas as Acomodações';

      handleBookingSubmit(checkin, checkout, guests, suite);
    });
  }

  // Submissão do Modal
  const modalBookingForm = document.getElementById('modalBookingForm');
  if (modalBookingForm) {
    modalBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = modalBookingForm.querySelector('[name="clientName"]').value;
      const checkin = modalBookingForm.querySelector('[name="checkin"]').value;
      const checkout = modalBookingForm.querySelector('[name="checkout"]').value;
      const guests = modalBookingForm.querySelector('[name="guests"]').value;
      const suite = modalBookingForm.querySelector('[name="suite"]').value;

      handleBookingSubmit(checkin, checkout, guests, suite, name);
      closeModal();
    });
  }

  // 6. Status Dinâmico de Funcionamento (Horários Oficiais Recanto da Pedra)
  const updateBusinessStatus = () => {
    const statusBadge = document.getElementById('businessStatusBadge');
    const statusText = document.getElementById('businessStatusText');
    const todayHint = document.getElementById('businessTodayHint');
    const footerStatus = document.getElementById('footerStatusText');

    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Horários Oficiais:
    // Domingo: 11:00 às 16:00 (660 min a 960 min)
    // Segunda a Sábado: 11:00 às 23:00 (660 min a 1380 min)
    const openMinute = 11 * 60; // 11:00
    const closeMinute = day === 0 ? 16 * 60 : 23 * 60; // Domingo até 16:00, demais até 23:00
    const todayScheduleStr = day === 0 ? '11:00 – 16:00' : '11:00 – 23:00';

    const isOpen = currentMinutes >= openMinute && currentMinutes < closeMinute;

    if (statusBadge && statusText) {
      if (isOpen) {
        statusBadge.className = 'business-status-badge status-open';
        statusText.textContent = 'Aberto agora';
        if (todayHint) {
          todayHint.textContent = `Hoje: ${todayScheduleStr}`;
        }
      } else {
        statusBadge.className = 'business-status-badge status-closed';
        statusText.textContent = 'Fechado agora';
        if (todayHint) {
          todayHint.textContent = 'Próxima abertura: 11:00';
        }
      }
    }

    if (footerStatus) {
      if (isOpen) {
        footerStatus.innerHTML = `● Aberto agora • Hoje: ${todayScheduleStr}`;
        footerStatus.style.color = '#10B981';
      } else {
        footerStatus.innerHTML = `○ Fechado agora • Próxima abertura às 11:00`;
        footerStatus.style.color = 'var(--gold-glow)';
      }
    }

    // Destacar o dia de hoje na lista vertical
    document.querySelectorAll('.hours-row').forEach(row => {
      const rowDay = parseInt(row.getAttribute('data-day'), 10);
      const existingTag = row.querySelector('.today-tag');
      if (existingTag) existingTag.remove();

      if (rowDay === day) {
        row.classList.add('is-today');
        const daySpan = row.querySelector('.hours-day');
        if (daySpan) {
          const tag = document.createElement('span');
          tag.className = 'today-tag';
          tag.textContent = 'Hoje';
          daySpan.appendChild(tag);
        }
      } else {
        row.classList.remove('is-today');
      }
    });
  };

  // 11. CONTADOR ANIMADO OPCIONAL: elementos com data-contador contam de 0 até o valor definido (IntersectionObserver), uma única vez
  const contadorElements = document.querySelectorAll('[data-contador]');
  if (contadorElements.length > 0 && 'IntersectionObserver' in window) {
    const contadorObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          observer.unobserve(el);

          const targetValue = parseFloat(el.getAttribute('data-contador'));
          if (isNaN(targetValue)) return;

          // Se o usuário prefere redução de movimento, o valor final já está visível
          if (prefersReducedMotion) {
            el.textContent = targetValue;
            return;
          }

          const duration = 1600; // Duração suave de contagem
          const startTime = performance.now();
          const isFloat = el.getAttribute('data-contador').includes('.');

          const animateCounter = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing cúbico desacelerado no final
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const current = targetValue * easeOutProgress;

            el.textContent = isFloat ? current.toFixed(1) : Math.round(current);

            if (progress < 1) {
              requestAnimationFrame(animateCounter);
            } else {
              el.textContent = isFloat ? targetValue.toFixed(1) : targetValue;
            }
          };

          // Inicia contagem do zero
          el.textContent = '0';
          requestAnimationFrame(animateCounter);
        }
      });
    }, {
      threshold: 0.2
    });

    contadorElements.forEach(el => contadorObserver.observe(el));
  }

  // Inicializar e atualizar a cada 60 segundos
  updateBusinessStatus();
  setInterval(updateBusinessStatus, 60000);
});
