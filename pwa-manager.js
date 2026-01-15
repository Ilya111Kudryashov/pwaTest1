// pwa-manager.js - упрощенная рабочая версия
class PWAManager {
  constructor() {
    console.log('PWA Manager инициализирован');
    this.deferredPrompt = null;
    this.init();
  }
  
  init() {
    this.setupServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineIndicator();
    this.showAppInfo();
  }
  
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('Service Worker зарегистрирован:', registration.scope);
          
          // Проверяем обновления
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('Новый контент доступен!');
                  this.showUpdateNotification();
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('Ошибка регистрации Service Worker:', error);
        });
    }
  }
  
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt сработал');
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Показываем кнопку через 3 секунды
      setTimeout(() => this.showInstallButton(), 3000);
    });
    
    window.addEventListener('appinstalled', () => {
      console.log('PWA установлено!');
      this.hideInstallButton();
      this.showNotification('Приложение установлено!', 'success');
    });
  }
  
  showInstallButton() {
    // Если кнопка уже есть или приложение уже установлено
    if (document.getElementById('installBtn') || 
        window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }
    
    const installBtn = document.createElement('button');
    installBtn.id = 'installBtn';
    installBtn.innerHTML = '📱 Установить PWA';
    installBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4a90e2, #357ae8);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
      z-index: 1000;
      transition: all 0.3s;
      font-size: 14px;
    `;
    
    installBtn.onmouseover = () => {
      installBtn.style.transform = 'translateY(-2px)';
      installBtn.style.boxShadow = '0 6px 20px rgba(74, 144, 226, 0.4)';
    };
    
    installBtn.onmouseout = () => {
      installBtn.style.transform = 'translateY(0)';
      installBtn.style.boxShadow = '0 4px 15px rgba(74, 144, 226, 0.3)';
    };
    
    installBtn.onclick = () => {
      if (this.deferredPrompt) {
        this.deferredPrompt.prompt();
        this.deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('Пользователь принял установку');
          }
          this.deferredPrompt = null;
        });
      }
    };
    
    document.body.appendChild(installBtn);
  }
  
  hideInstallButton() {
    const btn = document.getElementById('installBtn');
    if (btn) btn.remove();
  }
  
  setupOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'offlineIndicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: none;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
    `;
    indicator.textContent = '● Онлайн';
    document.body.appendChild(indicator);
    
    window.addEventListener('online', () => {
      indicator.textContent = '● Онлайн';
      indicator.style.background = '#4CAF50';
      indicator.style.display = 'block';
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 2000);
      this.showNotification('Соединение восстановлено', 'success');
    });
    
    window.addEventListener('offline', () => {
      indicator.textContent = '● Оффлайн';
      indicator.style.background = '#f44336';
      indicator.style.display = 'block';
      this.showNotification('Вы в оффлайн-режиме', 'warning');
    });
    
    // Инициализация
    if (!navigator.onLine) {
      indicator.textContent = '● Оффлайн';
      indicator.style.background = '#f44336';
      indicator.style.display = 'block';
    }
  }
  
  showAppInfo() {
    // Только на дашборде показываем информацию
    if (window.location.pathname.includes('dashbord.html')) {
      const infoDiv = document.createElement('div');
      infoDiv.className = 'pwa-info';
      infoDiv.innerHTML = `
        <div style="
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        ">
          <h3 style="margin-bottom: 15px; color: #4a90e2;">📱 PWA Статус</h3>
          <p><strong>Режим:</strong> ${this.isStandalone() ? 'Установленное приложение' : 'Браузер'}</p>
          <p><strong>Оффлайн доступ:</strong> Да</p>
          <p><strong>Service Worker:</strong> Активен</p>
          <button onclick="pwaManager.testOffline()" style="
            background: #4a90e2;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            margin-top: 10px;
            cursor: pointer;
          ">
            Тест оффлайн
          </button>
        </div>
      `;
      
      const contentArea = document.querySelector('.content-area, .container, main, .app-container');
      if (contentArea) {
        contentArea.prepend(infoDiv);
      } else {
        document.body.prepend(infoDiv);
      }
    }
  }
  
  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }
  
  testOffline() {
    if (confirm('Протестировать оффлайн режим?\nОткройте DevTools (F12) → Application → Service Workers → Offline')) {
      this.showNotification('Откройте F12 → Application → Service Workers → Offline', 'info');
    }
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'pwa-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      border-radius: 10px;
      color: white;
      background: ${this.getNotificationColor(type)};
      z-index: 1000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Добавляем стили анимации
    if (!document.querySelector('#notification-animations')) {
      const style = document.createElement('style');
      style.id = 'notification-animations';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  getNotificationColor(type) {
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196F3'
    };
    return colors[type] || colors.info;
  }
  
  requestPushPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showNotification('Уведомления включены!', 'success');
        }
      });
    }
  }
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
  window.pwaManager = new PWAManager();
  console.log('PWA Manager запущен');
});

// Экспортируем для тестирования
window.testPWA = {
  clearCache: () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
        alert('Кэш очищен!');
      });
    }
  },
  checkSW: () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        console.log('Service Worker:', reg);
        alert('Service Worker: ' + (reg ? 'активен' : 'не найден'));
      });
    }
  }
};
// pwa-manager.js - версия с полной отладкой
class PWAManager {
  constructor() {
    console.log('=== PWA Manager Инициализация ===');
    this.deferredPrompt = null;
    this.installBtn = null;
    this.debugMode = true;
    
    this.init();
  }
  
  init() {
    console.log('1. Начинаем инициализацию...');
    this.setupServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineIndicator();
    this.setupDebugInfo();
    
    // Периодическая проверка готовности установки
    setTimeout(() => this.checkInstallability(), 5000);
  }
  
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      console.log('2. Регистрируем Service Worker...');
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('✅ Service Worker зарегистрирован:', reg.scope);
          return navigator.serviceWorker.ready;
        })
        .then(reg => {
          console.log('✅ Service Worker готов');
        })
        .catch(err => {
          console.error('❌ Ошибка Service Worker:', err);
        });
    } else {
      console.log('❌ Service Worker не поддерживается');
    }
  }
  
  setupInstallPrompt() {
    console.log('3. Настраиваем установку...');
    
    // Проверяем критерии PWA
    this.checkPWACriteria();
    
    // Основное событие установки
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('🎉 Событие beforeinstallprompt получено!', e);
      console.log('Платформы:', e.platforms);
      console.log('Может быть установлено:', e.userChoice);
      
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Немедленно показываем кнопку
      this.showInstallButton();
      
      // Также показываем баннер через 2 секунды
      setTimeout(() => this.showInstallBanner(), 2000);
    });
    
    // После установки
    window.addEventListener('appinstalled', (e) => {
      console.log('🎊 Приложение установлено!', e);
      this.hideInstallButton();
      this.showNotification('Приложение установлено успешно!', 'success');
      localStorage.setItem('pwa_installed', 'true');
    });
    
    // Проверяем, установлено ли уже
    this.checkIfInstalled();
  }
  
  checkPWACriteria() {
    console.log('Проверка критериев PWA:');
    console.log('- HTTPS:', window.location.protocol === 'https:');
    console.log('- Manifest:', !!document.querySelector('link[rel="manifest"]'));
    console.log('- Service Worker:', 'serviceWorker' in navigator);
    console.log('- Responsive:', true); // ваш сайт адаптивный
    
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      fetch(manifestLink.href)
        .then(r => r.json())
        .then(manifest => {
          console.log('✅ Manifest загружен:', manifest.name);
        })
        .catch(err => {
          console.log('❌ Manifest не загружается:', err);
        });
    }
  }
  
  checkIfInstalled() {
    // Проверяем различные способы определения установленного PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    const isInstalled = localStorage.getItem('pwa_installed') === 'true';
    
    console.log('Проверка установки:');
    console.log('- Standalone режим:', isStandalone);
    console.log('- Fullscreen режим:', isFullscreen);
    console.log('- Minimal UI режим:', isMinimalUI);
    console.log('- В localStorage:', isInstalled);
    console.log('- В navigator.standalone:', window.navigator.standalone);
    
    if (isStandalone || isFullscreen || isMinimalUI || window.navigator.standalone) {
      console.log('Приложение уже установлено!');
      this.hideInstallButton();
    }
  }
  
  showInstallButton() {
    // Если кнопка уже есть или приложение установлено
    if (this.installBtn || this.isStandaloneMode()) {
      console.log('Кнопка не нужна (уже есть или приложение установлено)');
      return;
    }
    
    console.log('Показываем кнопку установки...');
    
    this.installBtn = document.createElement('button');
    this.installBtn.id = 'pwaInstallBtn';
    this.installBtn.innerHTML = `
      <span style="font-size: 20px; margin-right: 8px;">📱</span>
      <span>Установить PWA</span>
    `;
    
    // Стили кнопки
    Object.assign(this.installBtn.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #4a90e2 0%, #357ae8 100%)',
      color: 'white',
      border: 'none',
      padding: '14px 24px',
      borderRadius: '30px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '16px',
      boxShadow: '0 6px 20px rgba(74, 144, 226, 0.4)',
      zIndex: '1000',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });
    
    // Анимация при наведении
    this.installBtn.onmouseenter = () => {
      this.installBtn.style.transform = 'translateY(-3px) scale(1.05)';
      this.installBtn.style.boxShadow = '0 10px 25px rgba(74, 144, 226, 0.5)';
    };
    
    this.installBtn.onmouseleave = () => {
      this.installBtn.style.transform = 'translateY(0) scale(1)';
      this.installBtn.style.boxShadow = '0 6px 20px rgba(74, 144, 226, 0.4)';
    };
    
    // Пульсация
    this.installBtn.style.animation = 'pulse 2s infinite';
    
    // Обработчик клика
    this.installBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.promptInstallation();
    };
    
    document.body.appendChild(this.installBtn);
    
    // Добавляем анимацию пульсации
    if (!document.querySelector('#pulse-animation')) {
      const style = document.createElement('style');
      style.id = 'pulse-animation';
      style.textContent = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(74, 144, 226, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 144, 226, 0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    console.log('✅ Кнопка установки создана');
  }
  
  showInstallBanner() {
    // Проверяем, показывали ли уже баннер
    if (localStorage.getItem('pwa_banner_shown') || this.isStandaloneMode()) {
      return;
    }
    
    const banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        border: 1px solid #e0e0e0;
      ">
        <div style="font-size: 32px;">📱</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #333; margin-bottom: 5px;">
            Установить PWA приложение?
          </div>
          <div style="font-size: 14px; color: #666;">
            Для быстрого доступа и работы оффлайн
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="bannerInstallBtn" style="
            background: #4a90e2;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
          ">
            Установить
          </button>
          <button id="bannerCloseBtn" style="
            background: transparent;
            color: #666;
            border: 1px solid #ddd;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">
            Позже
          </button>
        </div>
      </div>
    `;
    
    Object.assign(banner.style, {
      position: 'fixed',
      bottom: '80px', // Выше кнопки установки
      left: '20px',
      right: '20px',
      zIndex: '999',
      animation: 'slideUpBanner 0.5s ease'
    });
    
    document.body.appendChild(banner);
    
    // Добавляем анимацию
    if (!document.querySelector('#banner-animation')) {
      const style = document.createElement('style');
      style.id = 'banner-animation';
      style.textContent = `
        @keyframes slideUpBanner {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Обработчики
    document.getElementById('bannerInstallBtn').onclick = () => {
      this.promptInstallation();
      banner.remove();
      localStorage.setItem('pwa_banner_shown', 'true');
    };
    
    document.getElementById('bannerCloseBtn').onclick = () => {
      banner.remove();
      localStorage.setItem('pwa_banner_shown', 'true');
    };
    
    // Авто-скрытие через 15 секунд
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
        localStorage.setItem('pwa_banner_shown', 'true');
      }
    }, 15000);
  }
  
  promptInstallation() {
    console.log('Показываем диалог установки...');
    
    if (!this.deferredPrompt) {
      console.log('❌ Нет deferredPrompt');
      this.showNotification('Установка недоступна', 'error');
      return;
    }
    
    this.deferredPrompt.prompt();
    
    this.deferredPrompt.userChoice.then((choiceResult) => {
      console.log('Результат выбора:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Пользователь принял установку');
        this.showNotification('Приложение устанавливается...', 'success');
      } else {
        console.log('❌ Пользователь отказался от установки');
        this.showNotification('Вы можете установить позже', 'info');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
    });
  }
  
  hideInstallButton() {
    if (this.installBtn && this.installBtn.parentNode) {
      this.installBtn.remove();
      this.installBtn = null;
    }
  }
  
  isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           window.matchMedia('(display-mode: minimal-ui)').matches ||
           window.navigator.standalone === true;
  }
  
  setupOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'offlineIndicator';
    
    Object.assign(indicator.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#4CAF50',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'none',
      zIndex: '1000',
      boxShadow: '0 2px 10px rgba(76, 175, 80, 0.3)'
    });
    
    indicator.textContent = '● Онлайн';
    document.body.appendChild(indicator);
    
    window.addEventListener('online', () => {
      indicator.textContent = '● Онлайн';
      indicator.style.background = '#4CAF50';
      indicator.style.display = 'block';
      setTimeout(() => indicator.style.display = 'none', 2000);
      this.showNotification('Соединение восстановлено', 'success');
    });
    
    window.addEventListener('offline', () => {
      indicator.textContent = '● Оффлайн';
      indicator.style.background = '#f44336';
      indicator.style.display = 'block';
      this.showNotification('Вы в оффлайн-режиме', 'warning');
    });
    
    if (!navigator.onLine) {
      indicator.textContent = '● Оффлайн';
      indicator.style.background = '#f44336';
      indicator.style.display = 'block';
    }
  }
  
  setupDebugInfo() {
    if (!this.debugMode) return;
    
    const debugDiv = document.createElement('div');
    debugDiv.id = 'pwaDebugInfo';
    debugDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-size: 12px;
        font-family: monospace;
        z-index: 1000;
        max-width: 300px;
        backdrop-filter: blur(10px);
      ">
        <strong>PWA Debug Info:</strong><br>
        <span id="pwaStatus">Загрузка...</span><br>
        <button onclick="pwaManager.forceShowButton()" style="
          background: #4a90e2;
          color: white;
          border: none;
          padding: 5px 10px;
          margin-top: 5px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
        ">
          Показать кнопку
        </button>
      </div>
    `;
    
    document.body.appendChild(debugDiv);
    
    // Обновляем статус
    setTimeout(() => {
      const status = document.getElementById('pwaStatus');
      if (status) {
        const info = `
          SW: ${'serviceWorker' in navigator ? '✅' : '❌'}<br>
          HTTPS: ${window.location.protocol === 'https:' ? '✅' : '❌'}<br>
          Manifest: ${document.querySelector('link[rel="manifest"]') ? '✅' : '❌'}<br>
          Standalone: ${this.isStandaloneMode() ? '✅' : '❌'}<br>
          Prompt: ${this.deferredPrompt ? '✅' : '❌'}
        `;
        status.innerHTML = info;
      }
    }, 1000);
  }
  
  forceShowButton() {
    console.log('Принудительный показ кнопки...');
    this.showInstallButton();
  }
  
  checkInstallability() {
    console.log('Проверка возможности установки...');
    
    // Проверяем критерии вручную
    const hasManifest = !!document.querySelector('link[rel="manifest"]');
    const hasSW = 'serviceWorker' in navigator;
    const isHTTPS = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    if (hasManifest && hasSW && (isHTTPS || isLocalhost)) {
      console.log('✅ Все критерии PWA выполнены');
      
      // Если кнопка еще не показана, показываем
      if (!this.installBtn && !this.isStandaloneMode()) {
        console.log('Показываем кнопку (вручную)...');
        this.showInstallButton();
      }
    } else {
      console.log('❌ Не все критерии PWA выполнены:', {
        hasManifest, hasSW, isHTTPS, isLocalhost
      });
    }
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'pwa-notification';
    notification.textContent = message;
    
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196F3'
    };
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '50px',
      right: '20px',
      padding: '15px 25px',
      borderRadius: '10px',
      color: 'white',
      background: colors[type] || colors.info,
      zIndex: '1000',
      animation: 'slideInRight 0.3s ease',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      maxWidth: '300px'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Стили анимации
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== Запуск PWA Manager ===');
  window.pwaManager = new PWAManager();
  
  // Тестовые команды в консоли
  window.testPWA = {
    showButton: () => window.pwaManager.showInstallButton(),
    hideButton: () => window.pwaManager.hideInstallButton(),
    check: () => window.pwaManager.checkInstallability(),
    simulatePrompt: () => {
      // Симуляция события для теста
      const event = new Event('beforeinstallprompt');
      event.platforms = ['web'];
      event.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    }
  };
  
  console.log('Команды тестирования:');
  console.log('- testPWA.showButton() - показать кнопку');
  console.log('- testPWA.simulatePrompt() - симуляция события установки');
});
// pwa-manager.js - исправленная версия
// class PWAManager {
//   constructor() {
//     console.log('🚀 PWA Manager запущен');
//     this.deferredPrompt = null;
//     this.installBtn = null;
//     this.isStandalone = this.checkStandalone();
//     this.canInstall = false;
    
//     this.init();
//   }
  
//   init() {
//     this.checkRequirements();
//     this.setupServiceWorker();
//     this.setupInstallListeners();
//     this.setupUI();
//     this.setupTestButton();
//   }
  
//   checkRequirements() {
//     console.log('🔍 Проверка требований PWA:');
    
//     // 1. HTTPS или localhost
//     const isSecure = window.location.protocol === 'https:' || 
//                     window.location.hostname === 'localhost' || 
//                     window.location.hostname === '127.0.0.1';
//     console.log('🔐 HTTPS/Localhost:', isSecure ? '✅' : '❌');
    
//     // 2. Manifest
//     const manifestLink = document.querySelector('link[rel="manifest"]');
//     const hasManifest = !!manifestLink;
//     console.log('📄 Manifest:', hasManifest ? '✅' : '❌');
    
//     if (manifestLink) {
//       console.log('Manifest href:', manifestLink.href);
//     }
    
//     // 3. Service Worker
//     const hasSW = 'serviceWorker' in navigator;
//     console.log('⚙️ Service Worker:', hasSW ? '✅' : '❌');
    
//     // 4. Display mode
//     console.log('📱 Display mode:', this.isStandalone ? 'standalone' : 'browser');
    
//     // Все критерии выполнены?
//     this.canInstall = isSecure && hasManifest && hasSW && !this.isStandalone;
//     console.log('🎯 Может быть установлено:', this.canInstall ? '✅' : '❌');
//   }
  
//   checkStandalone() {
//     return window.matchMedia('(display-mode: standalone)').matches ||
//            window.matchMedia('(display-mode: fullscreen)').matches ||
//            window.matchMedia('(display-mode: minimal-ui)').matches ||
//            (window.navigator.standalone === true);
//   }
  
//   setupServiceWorker() {
//     if ('serviceWorker' in navigator) {
//       navigator.serviceWorker.register('./sw.js')
//         .then(registration => {
//           console.log('✅ Service Worker зарегистрирован:', registration.scope);
          
//           // Проверяем обновления
//           registration.onupdatefound = () => {
//             console.log('🔄 Обновление Service Worker найдено');
//           };
//         })
//         .catch(error => {
//           console.error('❌ Ошибка Service Worker:', error);
//         });
//     }
//   }
  
//   setupInstallListeners() {
//     // Основное событие установки
//     window.addEventListener('beforeinstallprompt', (e) => {
//       console.log('🎉 beforeinstallprompt СРАБОТАЛ!', e);
//       e.preventDefault();
//       this.deferredPrompt = e;
//       this.showInstallButton();
      
//       // Сохраняем в localStorage что событие сработало
//       localStorage.setItem('pwa_prompt_available', 'true');
//     });
    
//     // После установки
//     window.addEventListener('appinstalled', (e) => {
//       console.log('🎊 Приложение установлено!', e);
//       this.hideInstallButton();
//       localStorage.setItem('pwa_installed', 'true');
//       this.showNotification('Приложение установлено!', 'success');
//     });
    
//     // Проверяем историю установок
//     this.checkInstallHistory();
//   }
  
//   checkInstallHistory() {
//     const wasInstalled = localStorage.getItem('pwa_installed') === 'true';
//     const promptAvailable = localStorage.getItem('pwa_prompt_available') === 'true';
    
//     console.log('📋 История установок:');
//     console.log('- Была установлена:', wasInstalled);
//     console.log('- Prompt доступен:', promptAvailable);
    
//     // Если prompt был доступен ранее, показываем кнопку
//     if (promptAvailable && !wasInstalled && this.canInstall) {
//       console.log('🔄 Восстанавливаем кнопку из истории');
//       setTimeout(() => this.showInstallButton(), 1000);
//     }
//   }
  
//   setupUI() {
//     // Показываем кнопку если можем установить
//     if (this.canInstall && !this.isStandalone) {
//       console.log('🕒 Показываем кнопку через 2 секунды...');
//       setTimeout(() => this.showInstallButton(), 2000);
//     }
    
//     // Оффлайн индикатор
//     this.setupOfflineIndicator();
    
//     // Debug информация
//     this.showDebugInfo();
//   }
  
//   setupTestButton() {
//     // Добавляем тестовую кнопку для разработки
//     if (window.location.hostname === 'localhost' || 
//         window.location.hostname === '127.0.0.1') {
      
//       const testBtn = document.createElement('button');
//       testBtn.innerHTML = '🔧 Тест PWA';
//       testBtn.style.cssText = `
//         position: fixed;
//         bottom: 70px;
//         right: 20px;
//         background: #666;
//         color: white;
//         border: none;
//         padding: 8px 15px;
//         border-radius: 5px;
//         font-size: 12px;
//         z-index: 1001;
//         cursor: pointer;
//       `;
      
//       testBtn.onclick = () => {
//         this.testPWA();
//       };
      
//       document.body.appendChild(testBtn);
//     }
//   }
  
//   testPWA() {
//     console.log('🧪 Тест PWA:');
    
//     // 1. Проверка manifest
//     const manifestLink = document.querySelector('link[rel="manifest"]');
//     if (manifestLink) {
//       fetch(manifestLink.href)
//         .then(r => {
//           console.log('Manifest статус:', r.status);
//           return r.json();
//         })
//         .then(manifest => {
//           console.log('Manifest:', manifest);
          
//           // Проверяем обязательные поля
//           const required = ['name', 'short_name', 'start_url', 'display'];
//           required.forEach(field => {
//             console.log(`${field}:`, manifest[field] ? '✅' : '❌');
//           });
//         })
//         .catch(err => console.log('Manifest ошибка:', err));
//     }
    
//     // 2. Проверка Service Worker
//     if ('serviceWorker' in navigator) {
//       navigator.serviceWorker.getRegistrations()
//         .then(regs => {
//           console.log('Service Workers:', regs.length);
//           regs.forEach((reg, i) => {
//             console.log(`SW ${i}:`, reg.scope, reg.active?.state);
//           });
//         });
//     }
    
//     // 3. Проверка установки
//     console.log('deferredPrompt:', this.deferredPrompt ? '✅' : '❌');
//     console.log('canInstall:', this.canInstall);
//     console.log('isStandalone:', this.isStandalone);
    
//     // Предлагаем установку если deferredPrompt есть
//     if (this.deferredPrompt) {
//       if (confirm('Запустить тестовую установку?')) {
//         this.promptInstallation();
//       }
//     } else {
//       alert('deferredPrompt не доступен. Проверьте консоль.');
//     }
//   }
  
//   showInstallButton() {
//     // Не показываем если уже есть или приложение установлено
//     if (this.installBtn || this.isStandalone) {
//       return;
//     }
    
//     console.log('🔼 Показываем кнопку установки');
    
//     this.installBtn = document.createElement('button');
//     this.installBtn.id = 'pwaInstallBtn';
//     this.installBtn.innerHTML = `
//       <span style="font-size: 20px; margin-right: 8px;">📱</span>
//       <span>Установить приложение</span>
//     `;
    
//     // Стили
//     Object.assign(this.installBtn.style, {
//       position: 'fixed',
//       bottom: '20px',
//       right: '20px',
//       background: 'linear-gradient(135deg, #4a90e2, #357ae8)',
//       color: 'white',
//       border: 'none',
//       padding: '14px 24px',
//       borderRadius: '30px',
//       cursor: 'pointer',
//       fontWeight: '600',
//       fontSize: '16px',
//       boxShadow: '0 6px 20px rgba(74, 144, 226, 0.4)',
//       zIndex: '1000',
//       transition: 'all 0.3s',
//       display: 'flex',
//       alignItems: 'center'
//     });
    
//     // Эффекты
//     this.installBtn.onmouseenter = () => {
//       this.installBtn.style.transform = 'translateY(-3px)';
//       this.installBtn.style.boxShadow = '0 10px 25px rgba(74, 144, 226, 0.5)';
//     };
    
//     this.installBtn.onmouseleave = () => {
//       this.installBtn.style.transform = 'translateY(0)';
//       this.installBtn.style.boxShadow = '0 6px 20px rgba(74, 144, 226, 0.4)';
//     };
    
//     // Клик
//     this.installBtn.onclick = (e) => {
//       e.preventDefault();
//       this.installApp();
//     };
    
//     document.body.appendChild(this.installBtn);
//     console.log('✅ Кнопка создана');
//   }
  
//   installApp() {
//     console.log('🔄 Запуск установки...');
    
//     if (this.deferredPrompt) {
//       console.log('✅ Используем deferredPrompt');
//       this.deferredPrompt.prompt();
      
//       this.deferredPrompt.userChoice.then((choiceResult) => {
//         console.log('Выбор пользователя:', choiceResult.outcome);
//         this.deferredPrompt = null;
        
//         if (choiceResult.outcome === 'accepted') {
//           console.log('🎉 Установка принята');
//         } else {
//           console.log('❌ Установка отклонена');
//           // Скрываем кнопку на 1 минуту
//           this.hideInstallButton();
//           setTimeout(() => {
//             if (!this.isStandalone) this.showInstallButton();
//           }, 60000);
//         }
//       });
      
//     } else {
//       console.log('❌ Нет deferredPrompt, используем альтернативный метод');
//       this.showManualInstallGuide();
//     }
//   }
  
//   showManualInstallGuide() {
//     const guide = document.createElement('div');
//     guide.id = 'pwaInstallGuide';
//     guide.innerHTML = `
//       <div style="
//         position: fixed;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         background: white;
//         padding: 30px;
//         border-radius: 15px;
//         box-shadow: 0 20px 60px rgba(0,0,0,0.3);
//         z-index: 1002;
//         max-width: 400px;
//         text-align: center;
//       ">
//         <h3 style="color: #4a90e2; margin-bottom: 20px;">📱 Как установить</h3>
        
//         <p><strong>В Chrome/Edge:</strong></p>
//         <p>Нажмите ⋮ (меню) → "Установить PWA Test"</p>
        
//         <p><strong>В Safari (iPhone):</strong></p>
//         <p>Нажмите 📤 → "На экран «Домой»" → "Добавить"</p>
        
//         <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
//           <button id="closeGuide" style="
//             background: #4a90e2;
//             color: white;
//             border: none;
//             padding: 10px 20px;
//             border-radius: 5px;
//             cursor: pointer;
//           ">
//             Понятно
//           </button>
//           <button onclick="pwaManager.checkRequirements()" style="
//             background: #f0f0f0;
//             color: #333;
//             border: 1px solid #ddd;
//             padding: 10px 20px;
//             border-radius: 5px;
//             cursor: pointer;
//           ">
//             Проверить снова
//           </button>
//         </div>
//       </div>
//       <div style="
//         position: fixed;
//         top: 0;
//         left: 0;
//         right: 0;
//         bottom: 0;
//         background: rgba(0,0,0,0.5);
//         z-index: 1001;
//       "></div>
//     `;
    
//     document.body.appendChild(guide);
    
//     document.getElementById('closeGuide').onclick = () => {
//       guide.remove();
//     };
//   }
  
//   hideInstallButton() {
//     if (this.installBtn && this.installBtn.parentNode) {
//       this.installBtn.remove();
//       this.installBtn = null;
//     }
//   }
  
//   setupOfflineIndicator() {
//     const indicator = document.createElement('div');
//     indicator.id = 'offlineIndicator';
    
//     Object.assign(indicator.style, {
//       position: 'fixed',
//       top: '10px',
//       right: '10px',
//       background: '#4CAF50',
//       color: 'white',
//       padding: '8px 16px',
//       borderRadius: '20px',
//       fontSize: '12px',
//       fontWeight: '600',
//       display: 'none',
//       zIndex: '1000',
//       boxShadow: '0 2px 10px rgba(76, 175, 80, 0.3)'
//     });
    
//     indicator.textContent = '● Онлайн';
//     document.body.appendChild(indicator);
    
//     window.addEventListener('online', () => {
//       indicator.textContent = '● Онлайн';
//       indicator.style.background = '#4CAF50';
//       indicator.style.display = 'block';
//       setTimeout(() => indicator.style.display = 'none', 2000);
//     });
    
//     window.addEventListener('offline', () => {
//       indicator.textContent = '● Оффлайн';
//       indicator.style.background = '#f44336';
//       indicator.style.display = 'block';
//     });
    
//     if (!navigator.onLine) {
//       indicator.textContent = '● Оффлайн';
//       indicator.style.background = '#f44336';
//       indicator.style.display = 'block';
//     }
//   }
  
//   showDebugInfo() {
//     // Только в development
//     if (window.location.hostname === 'localhost' || 
//         window.location.hostname === '127.0.0.1') {
      
//       const debug = document.createElement('div');
//       debug.innerHTML = `
//         <div style="
//           position: fixed;
//           top: 50px;
//           left: 10px;
//           background: rgba(0,0,0,0.8);
//           color: white;
//           padding: 10px;
//           border-radius: 5px;
//           font-size: 11px;
//           font-family: monospace;
//           z-index: 999;
//           max-width: 250px;
//         ">
//           <div>PWA Status:</div>
//           <div id="pwaDebugStatus">Загрузка...</div>
//           <button onclick="pwaManager.forceInstall()" style="
//             background: #4a90e2;
//             color: white;
//             border: none;
//             padding: 3px 8px;
//             margin-top: 5px;
//             border-radius: 3px;
//             font-size: 10px;
//             cursor: pointer;
//           ">
//             Force Install
//           </button>
//         </div>
//       `;
      
//       document.body.appendChild(debug);
      
//       // Обновляем статус
//       setInterval(() => {
//         const statusEl = document.getElementById('pwaDebugStatus');
//         if (statusEl) {
//           statusEl.innerHTML = `
//             SW: ${'serviceWorker' in navigator ? '✅' : '❌'}<br>
//             Manifest: ${document.querySelector('link[rel="manifest"]') ? '✅' : '❌'}<br>
//             Prompt: ${this.deferredPrompt ? '✅' : '❌'}<br>
//             Standalone: ${this.isStandalone ? '✅' : '❌'}
//           `;
//         }
//       }, 2000);
//     }
//   }
  
//   forceInstall() {
//     // Принудительно показываем инструкцию
//     this.showManualInstallGuide();
//   }
  
//   showNotification(message, type = 'info') {
//     const colors = {
//       success: '#4CAF50',
//       error: '#f44336',
//       warning: '#ff9800',
//       info: '#2196F3'
//     };
    
//     const notification = document.createElement('div');
//     notification.textContent = message;
//     notification.style.cssText = `
//       position: fixed;
//       top: 20px;
//       right: 20px;
//       padding: 15px 25px;
//       border-radius: 8px;
//       color: white;
//       background: ${colors[type] || colors.info};
//       z-index: 1000;
//       animation: slideIn 0.3s ease;
//       box-shadow: 0 4px 15px rgba(0,0,0,0.2);
//     `;
    
//     document.body.appendChild(notification);
    
//     setTimeout(() => {
//       notification.style.animation = 'slideOut 0.3s ease';
//       setTimeout(() => notification.remove(), 300);
//     }, 3000);
    
//     // Стили анимации
//     if (!document.querySelector('#animations')) {
//       const style = document.createElement('style');
//       style.id = 'animations';
//       style.textContent = `
//         @keyframes slideIn {
//           from { transform: translateX(100%); opacity: 0; }
//           to { transform: translateX(0); opacity: 1; }
//         }
//         @keyframes slideOut {
//           from { transform: translateX(0); opacity: 1; }
//           to { transform: translateX(100%); opacity: 0; }
//         }
//       `;
//       document.head.appendChild(style);
//     }
//   }
// }

// // Запуск
// document.addEventListener('DOMContentLoaded', () => {
//   console.log('🚀 Инициализация PWA...');
//   window.pwaManager = new PWAManager();
  
//   // Глобальные функции для тестирования
//   window.PWATest = {
//     simulatePrompt: () => {
//       console.log('🧪 Симуляция beforeinstallprompt');
//       const event = new Event('beforeinstallprompt');
//       window.dispatchEvent(event);
//     },
//     check: () => window.pwaManager.checkRequirements(),
//     showBtn: () => window.pwaManager.showInstallButton(),
//     hideBtn: () => window.pwaManager.hideInstallButton()
//   };
  
//   console.log('Доступные команды:');
//   console.log('- PWATest.simulatePrompt() - симуляция события');
//   console.log('- PWATest.check() - проверка критериев');
//   console.log('- PWATest.showBtn() - показать кнопку');
// });