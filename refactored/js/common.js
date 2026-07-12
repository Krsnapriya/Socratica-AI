/* ============================================================
   Socratica AI — Common JavaScript
   ============================================================
   Navigation, event handlers, shared interactivity.
   ============================================================ */

(function () {
  'use strict';

  // ---- Select change dispatch ----
  function initSelects() {
    document.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', function () {
        this.dispatchEvent(new CustomEvent('select-change', {
          detail: { value: this.value }
        }));
      });
    });
  }

  // ---- Keyboard shortcuts ----
  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K → focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="earch"]');
        if (searchInput) searchInput.focus();
      }
      // Escape → close modals
      if (e.key === 'Escape') {
        document.querySelectorAll('[data-modal]').forEach(m => {
          m.style.display = 'none';
        });
      }
      // Ctrl/Cmd + Shift + D → toggle dark mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  // ---- Theme (dark mode with localStorage persistence) ----
  function getStoredTheme() {
    try { return localStorage.getItem('socratica-theme'); } catch(e) { return null; }
  }

  function ensureDark() {
    const stored = getStoredTheme();
    if (stored === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('socratica-theme', isDark ? 'dark' : 'light'); } catch(e) {}
    // Update toggle icon if present
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = isDark ? 'dark_mode' : 'light_mode';
    });
  }

  // Expose for inline onclick usage
  window.toggleTheme = toggleTheme;

  // ---- Page entrance animation ----
  function initPageEnter() {
    var main = document.querySelector('main');
    if (main) main.classList.add('page-enter');
  }

  // ---- Switch Tier button ----
  function initSwitchTier() {
    var btn = document.getElementById('switch-tier-btn');
    if (!btn) return;
    function syncLabel() {
      if (!window.SocraticEngine) return;
      var t = SocraticEngine.getTier();
      var span = btn.querySelector('span:last-child');
      var textSpan = btn.childNodes[0];
      if (span) span.textContent = t === 1 ? '2' : '1';
      if (textSpan && textSpan.nodeType === 3) {
        btn.replaceChild(document.createTextNode(' Switch to Tier '), textSpan);
      }
    }
    syncLabel();
    btn.addEventListener('click', function () {
      if (!window.SocraticEngine) return;
      var t = SocraticEngine.getTier();
      SocraticEngine.setTier(t === 1 ? 2 : 1);
      SocraticEngine.notify();
      var span = this.querySelector('span:last-child');
      if (span) span.textContent = t === 1 ? '1' : '2';
    });
  }

  // ---- Add type=button to all buttons ----
  function initTypeButtons() {
    document.querySelectorAll('button:not([type])').forEach(function (b) { b.setAttribute('type', 'button'); });
  }

  // ---- Init all ----
  function init() {
    ensureDark();
    initPageEnter();
    initSelects();
    initKeyboard();
    initSwitchTier();
    initTypeButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
