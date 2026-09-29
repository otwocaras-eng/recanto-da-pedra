/**
 * RECANTO DA PEDRA — POUSADA & GASTRONOMIA
 * Iriri, Costa Azul — Espírito Santo
 * Interações, Console de Reserva de Luxo e Navegação Fluida
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Header scroll effect
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

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

  // Inicializar e atualizar a cada 60 segundos
  updateBusinessStatus();
  setInterval(updateBusinessStatus, 60000);
});
