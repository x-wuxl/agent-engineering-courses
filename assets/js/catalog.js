(function () {
  'use strict';

  const grid = document.querySelector('#course-grid');
  const status = document.querySelector('#catalog-status');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      return '';
    }
    return tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
  }

  function renderSection(items) {
    const published = items.filter((course) => course.published !== false);

    if (published.length === 0) {
      status.hidden = false;
      status.textContent = '暂无已发布课程';
      grid.innerHTML = '';
      return;
    }

    status.hidden = true;
    grid.innerHTML = published.map((course) => {
      const slug = escapeHtml(course.slug || '');
      const title = escapeHtml(course.title || '未命名课程');
      const summary = escapeHtml(course.summary || '');
      const author = escapeHtml(course.author || '');
      const tags = renderTags(course.tags);
      const cover = course.cover
        ? `<img src="${escapeHtml(course.cover)}" alt="${title}">`
        : `<div class="cover-title">${title}</div>`;
      const chapterText = Number(course.chapterCount)
        ? `<span>${Number(course.chapterCount)} 章</span>`
        : '';
      const lessonText = Number(course.lessonCount)
        ? `<span>${Number(course.lessonCount)} 讲</span>`
        : '';

      return `<a class="course-card" href="courses/${slug}/">
        <div class="course-cover">${cover}</div>
        <div class="course-body">
          <div class="course-title">${title}</div>
          <div class="course-summary">${summary}</div>
          <div class="course-meta">
            ${author ? `<span>${author}</span>` : ''}
            ${chapterText}
            ${lessonText}
          </div>
          <div class="course-tags">${tags}</div>
        </div>
      </a>`;
    }).join('');
  }

  fetch('courses.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('courses.json load failed');
      }
      return response.json();
    })
    .then((data) => {
      const courses = Array.isArray(data)
        ? data
        : Array.isArray(data.courses)
          ? data.courses
          : [];
      courses.sort((a, b) => {
        const aOrder = Number(a.order || 0);
        const bOrder = Number(b.order || 0);
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return (a.slug || '').localeCompare(b.slug || '');
      });
      renderSection(courses);
    })
    .catch(() => {
      status.hidden = false;
      status.textContent = '课程列表加载失败';
      grid.innerHTML = '';
    });
})();
