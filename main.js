(() => {
  const LANG_FILES = {
    ja: './data/ja.json',
    en: './data/en.json'
  };

  class CVApp {
    constructor() {
      this.langToggle = document.getElementById('lang-toggle');
      this.footerNote = document.getElementById('footer-note');
      this.state = {
        lang: this.getStoredLanguage()
      };
      this.bindEvents();
      this.updateToggleLabel();
      this.fetchAndRender();
    }

    bindEvents() {
      if (!this.langToggle) return;
      this.langToggle.addEventListener('click', () => {
        const nextLang = this.state.lang === 'ja' ? 'en' : 'ja';
        this.setLanguage(nextLang);
      });
    }

    getStoredLanguage() {
      try {
        const stored = localStorage.getItem('preferredLang');
        if (stored && LANG_FILES[stored]) {
          return stored;
        }
      } catch (error) {
        // localStorage may be unavailable; ignore and fall back
      }
      const documentLang = document.documentElement.lang;
      if (LANG_FILES[documentLang]) {
        return documentLang;
      }
      return 'ja';
    }

    setLanguage(lang) {
      if (!LANG_FILES[lang] || this.state.lang === lang) return;
      this.state.lang = lang;
      try {
        localStorage.setItem('preferredLang', lang);
      } catch (error) {
        // ignore storage errors
      }
      this.updateToggleLabel();
      this.fetchAndRender();
    }

    updateToggleLabel() {
      if (!this.langToggle) return;
      const next = this.state.lang === 'ja' ? 'EN' : 'JA';
      this.langToggle.textContent = next;
      this.langToggle.setAttribute(
        'aria-label',
        this.state.lang === 'ja' ? 'Switch to English' : '日本語に切り替え'
      );
    }

    async fetchAndRender() {
      const lang = this.state.lang;
      try {
        const response = await fetch(LANG_FILES[lang], { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('コンテンツの読み込みに失敗しました');
        }
        const data = await response.json();
        // Guard against race conditions when toggling quickly
        if (lang === this.state.lang) {
          this.render(data);
        }
      } catch (error) {
        this.showError(error.message || 'Failed to load content');
      }
    }

    showError(message) {
      const main = document.getElementById('content');
      if (!main) return;
      main.innerHTML = `<p class="placeholder">${message}</p>`;
    }

    render(data) {
      this.updateMeta(data.meta);
      this.renderUpcoming(data.upcoming);
      this.renderAbout(data.about);
      this.renderListSection('interests', data.interests);
      this.renderEntries('education', data.education);
      this.renderEntries('experience', data.experience);
      this.renderPublications(data.publications);
      this.renderContact(data.contact);
    }

    updateMeta(meta = {}) {
      const { langAttr, pageTitle, tagline, role, footerNote } = meta;
      document.documentElement.lang = langAttr || this.state.lang;
      if (pageTitle) {
        document.title = pageTitle;
        const siteTitle = document.getElementById('site-title');
        if (siteTitle) siteTitle.textContent = pageTitle;
      }
      const subtitleEl = document.getElementById('site-subtitle');
      if (subtitleEl && typeof tagline === 'string') {
        subtitleEl.textContent = tagline;
      }
      const eyebrowEl = document.getElementById('site-eyebrow');
      if (eyebrowEl && typeof role === 'string') {
        eyebrowEl.textContent = role;
      }
      if (this.footerNote && typeof footerNote === 'string') {
        this.footerNote.textContent = footerNote;
      }
    }

    renderAbout(section = {}) {
      this.updateSectionTitle('about', section.title);
      const container = this.getSectionBody('about');
      if (!container) return;
      container.innerHTML = '';
      const paragraphs = Array.isArray(section.body) ? section.body : [section.body];
      paragraphs
        .filter(Boolean)
        .forEach((text) => {
          const p = document.createElement('p');
          p.textContent = text;
          container.appendChild(p);
        });
    }

    renderListSection(sectionKey, section = {}) {
      this.updateSectionTitle(sectionKey, section.title);
      const container = this.getSectionBody(sectionKey);
      if (!container) return;
      container.innerHTML = '';
      const list = document.createElement('ul');
      list.className = 'simple-list';
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) {
        const placeholder = document.createElement('li');
        placeholder.className = 'placeholder';
        placeholder.textContent = '-';
        list.appendChild(placeholder);
      } else {
        items.forEach((item) => {
          const li = document.createElement('li');
          if (typeof item === 'string') {
            li.innerHTML = item;
          } else if (item && typeof item === 'object') {
            if (item.html) {
              li.innerHTML = item.html;
            } else if (item.text) {
              li.textContent = item.text;
            }
          }
          list.appendChild(li);
        });
      }
      container.appendChild(list);
    }

    renderUpcoming(section = {}) {
      this.updateSectionTitle('upcoming', section.title);
      const container = this.getSectionBody('upcoming');
      if (!container) return;
      container.innerHTML = '';
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) {
        container.textContent = '-';
        return;
      }
      const list = document.createElement('ul');
      list.className = 'upcoming-list';
      items.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'upcoming-item';

        const primary = [item.period, item.name].filter(Boolean).join(' / ');
        if (primary) {
          const line = document.createElement('div');
          line.className = 'upcoming-line';
          line.textContent = primary;
          li.appendChild(line);
        }

        const secondary = [item.role, item.location].filter(Boolean).join(' · ');
        if (secondary) {
          const meta = document.createElement('div');
          meta.className = 'upcoming-meta';
          meta.textContent = secondary;
          li.appendChild(meta);
        }

        list.appendChild(li);
      });
      container.appendChild(list);
    }

    renderEntries(sectionKey, section = {}) {
      this.updateSectionTitle(sectionKey, section.title);
      const container = this.getSectionBody(sectionKey);
      if (!container) return;
      container.innerHTML = '';
      const items = Array.isArray(section.items) ? section.items : [];
      if (items.length === 0) {
        container.textContent = '-';
        return;
      }
      items.forEach((item) => {
        const entry = document.createElement('article');
        entry.className = 'entry';

        const header = document.createElement('div');
        header.className = 'entry-header';

        if (item.title) {
          const title = document.createElement('div');
          title.className = 'entry-title';
          title.textContent = item.title;
          header.appendChild(title);
        }

        if (item.role) {
          const role = document.createElement('div');
          role.textContent = item.role;
          header.appendChild(role);
        }

        if (item.period) {
          const meta = document.createElement('div');
          meta.className = 'entry-meta';
          meta.textContent = item.period;
          header.appendChild(meta);
        }

        entry.appendChild(header);

        if (Array.isArray(item.details) && item.details.length > 0) {
          const ul = document.createElement('ul');
          ul.className = 'detail-list';
          item.details.forEach((detail) => {
            const li = document.createElement('li');
            li.textContent = detail;
            ul.appendChild(li);
          });
          entry.appendChild(ul);
        }

        container.appendChild(entry);
      });
    }

    renderPublications(section = {}) {
      this.updateSectionTitle('publications', section.title);
      const container = this.getSectionBody('publications');
      if (!container) return;
      container.innerHTML = '';
      const years = Array.isArray(section.years) ? section.years : [];
      if (years.length === 0) {
        container.textContent = '-';
        return;
      }
      years.forEach((yearBlock, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'publication-year';
        const details = document.createElement('details');
        if (index === 0) details.open = true;
        const summary = document.createElement('summary');
        summary.textContent = yearBlock.year || '';
        details.appendChild(summary);

        const list = document.createElement('ul');
        list.className = 'publication-list';
        (yearBlock.items || []).forEach((item) => {
          const li = document.createElement('li');
          if (item.title) {
            const title = document.createElement('div');
            title.className = 'entry-title';
            title.textContent = item.title;
            li.appendChild(title);
          }
          if (item.authors) {
            const authors = document.createElement('div');
            authors.className = 'entry-meta';
            authors.textContent = item.authors;
            li.appendChild(authors);
          }
          if (item.venue) {
            const venue = document.createElement('div');
            venue.textContent = item.venue;
            li.appendChild(venue);
          }
          if (Array.isArray(item.links) && item.links.length > 0) {
            const linksWrapper = document.createElement('div');
            linksWrapper.className = 'publication-links';
            item.links.forEach((link) => {
              if (!link?.url) return;
              const a = document.createElement('a');
              a.href = link.url;
              a.target = '_blank';
              a.rel = 'noreferrer noopener';
              a.textContent = link.label || link.url;
              linksWrapper.appendChild(a);
            });
            li.appendChild(linksWrapper);
          }
          list.appendChild(li);
        });

        details.appendChild(list);
        wrapper.appendChild(details);
        container.appendChild(wrapper);
      });
    }

    renderContact(section = {}) {
      this.updateSectionTitle('contact', section.title);
      const container = this.getSectionBody('contact');
      if (!container) return;
      container.innerHTML = '';
      const block = document.createElement('div');
      block.className = 'contact-block';

      if (Array.isArray(section.body)) {
        section.body.forEach((paragraph) => {
          const p = document.createElement('p');
          p.textContent = paragraph;
          block.appendChild(p);
        });
      }

      if (section.email?.user && section.email?.domain) {
        const address = `${section.email.user}@${section.email.domain}`;
        const emailLink = document.createElement('a');
        emailLink.href = `mailto:${address}`;
        emailLink.textContent = `${section.email.user} [at] ${section.email.domain}`;
        emailLink.rel = 'noopener';
        emailLink.setAttribute('aria-label', section.email.label || address);
        block.appendChild(emailLink);
      }

      if (Array.isArray(section.profiles) && section.profiles.length > 0) {
        const linksWrapper = document.createElement('div');
        linksWrapper.className = 'contact-links';
        section.profiles.forEach((profile) => {
          if (!profile?.url) return;
          const a = document.createElement('a');
          a.href = profile.url;
          a.target = '_blank';
          a.rel = 'noreferrer noopener';
          a.textContent = profile.label || profile.url;
          linksWrapper.appendChild(a);
        });
        block.appendChild(linksWrapper);
      }

      container.appendChild(block);
    }

    updateSectionTitle(sectionKey, title) {
      if (!title) return;
      const heading = document.querySelector(`[data-section-title="${sectionKey}"]`);
      if (heading) {
        heading.textContent = title;
      }
    }

    getSectionBody(sectionKey) {
      return document.querySelector(`[data-section="${sectionKey}"]`);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CVApp());
  } else {
    new CVApp();
  }
})();
