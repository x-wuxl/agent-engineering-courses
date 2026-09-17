(function () {
  'use strict';

  const fallbackTitle = '课程';
  let articles = [];

  function $(selector) {
    return document.querySelector(selector);
  }

  function setText(selector, value) {
    const el = $(selector);
    if (el) {
      el.textContent = value;
    }
  }

  function currentCourseSlug() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const courseIndex = segments.indexOf('courses');
    return courseIndex >= 0 && segments[courseIndex + 1] ? segments[courseIndex + 1] : '';
  }

  function loadCourseTitle() {
    const slug = currentCourseSlug();
    if (!slug) {
      setText('#course-title', fallbackTitle);
      setText('#landing-title', fallbackTitle);
      document.title = fallbackTitle;
      return;
    }

    return fetch('../../courses.json')
      .then((response) => (response.ok ? response.json() : []))
      .then((courses) => {
        const current = Array.isArray(courses)
          ? courses.find((course) => course.slug === slug)
          : null;
        const title = current && current.title ? current.title : fallbackTitle;
        setText('#course-title', title);
        setText('#landing-title', title);
        document.title = title;
      })
      .catch(() => {
        setText('#course-title', fallbackTitle);
        setText('#landing-title', fallbackTitle);
        document.title = fallbackTitle;
      });
  }

  function toggleSidebar() {
    $('#sidebar').classList.toggle('open');
  }

  function renderSidebar() {
    const list = $('#sidebar-list');
    let currentChapter = '';
    let html = '';

    articles.forEach((article) => {
      if (article.chapter !== currentChapter) {
        currentChapter = article.chapter;
        html += `<div class="sidebar-chapter">${article.chapter}</div>`;
      }

      const encoded = encodeURIComponent(article.file);
      const isActive = window.location.hash === '#' + encoded;
      const orderStr =
        article.order < 100
          ? article.order > 0
            ? article.order < 10
              ? '0' + article.order
              : '' + article.order
            : '00'
          : '--';

      html += `<a class="sidebar-item${isActive ? ' active' : ''}" href="#${encoded}" data-file="${article.file}">
        <span class="sidebar-order">${orderStr}</span>
        <span>${article.title.replace(/^\d+\s*[｜|]\s*/, '')}</span>
      </a>`;
    });

    list.innerHTML = html;
  }

  function loadArticles() {
    fetch('articles.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('articles.json load failed');
        }
        return response.json();
      })
      .then((data) => {
        articles = data;
        renderSidebar();
        if (window.location.hash) {
          openArticle(decodeURIComponent(window.location.hash.slice(1)));
        }
      })
      .catch(() => {
        $('#sidebar-list').innerHTML =
          '<p style="padding:16px;color:var(--text-secondary)">课程目录加载失败</p>';
      });
  }

  function resolveArticleDir(file) {
    const slash = file.lastIndexOf('/');
    return slash >= 0 ? file.slice(0, slash + 1) : '';
  }

  function fixImageSrcs(container, baseDir) {
    container.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (
        src &&
        !/^[a-z]+:/i.test(src) &&
        !src.startsWith('/') &&
        !src.startsWith('#') &&
        !src.startsWith('data:')
      ) {
        img.src = encodeURI(baseDir + src);
      }
    });
  }

  function openArticle(file) {
    const decoded = decodeURIComponent(file);
    const baseDir = resolveArticleDir(decoded);
    $('#sidebar').classList.remove('open');
    $('#landing').style.display = 'none';

    document.querySelectorAll('.sidebar-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.file === decoded);
    });

    const container = $('#article-container');
    container.innerHTML =
      '<p style="text-align:center;padding:60px;color:var(--text-secondary)">加载中...</p>';

    fetch(decoded)
      .then((response) => {
        if (!response.ok) {
          throw new Error('article load failed');
        }
        return response.text();
      })
      .then((markdown) => {
        const html = marked.parse(markdown);
        container.innerHTML = '<div class="article-content active">' + html + '</div>';
        fixImageSrcs(container, baseDir);
        container.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
        $('.main').scrollTop = 0;
      })
      .catch(() => {
        container.innerHTML =
          '<p style="text-align:center;padding:60px;color:var(--text-secondary)">加载失败</p>';
      });
  }

  window.toggleSidebar = toggleSidebar;
  window.addEventListener('hashchange', () => {
    if (window.location.hash) {
      openArticle(decodeURIComponent(window.location.hash.slice(1)));
    }
  });

  loadCourseTitle();
  loadArticles();
})();
