(() => {
  'use strict';

  const original = window.__PORTFOLIO__;
  if (!original) return;
  const model = typeof structuredClone === 'function'
    ? structuredClone(original)
    : JSON.parse(JSON.stringify(original));

  const siteFields = [
    { key: 'brand', label: '品牌名称', scenario: '页头左上角品牌文字' },
    { key: 'mainTitle', label: '首页主标题', scenario: '首页头像下方的大标题' },
    { key: 'aboutTitle', label: '首页副标题', scenario: '首页主标题下方的手写风格文案' },
    { key: 'role', label: '职业身份', scenario: '首页左侧身份信息' },
    { key: 'birthYear', label: '出生年份', scenario: '首页右上侧信息' },
    { key: 'base', label: '所在城市', scenario: '首页右侧基地信息' },
    { key: 'phone', label: '联系电话', scenario: '页面底部联系方式和电话链接' },
    { key: 'email', label: '邮箱', scenario: '页面底部联系方式和邮件链接' },
    { key: 'wechat', label: '微信号', scenario: '页面底部联系方式' }
  ];

  const projectFields = [
    { key: 'title', label: '项目标题', scenario: '鼠标悬停作品卡片时的顶部标题、卡片无障碍名称' },
    { key: 'cardTitle', label: '卡片与详情标题', scenario: '作品卡片底部标题、打开详情后的主标题', type: 'lines' },
    { key: 'subtitle', label: '项目副标题', scenario: '作品卡片标题上方、详情主标题上方' },
    { key: 'shortIntroduction', label: '悬停简介', scenario: '鼠标悬停卡片后，项目标题下方的简介' },
    { key: 'introduction', label: '详情简介', scenario: '打开作品详情后，主标题下方的说明文字', type: 'textarea' }
  ];

  const getPath = (object, path) => path.reduce((value, key) => value?.[key], object);
  const setPath = (object, path, value) => {
    const last = path.pop();
    const parent = path.reduce((value, key) => value[key], object);
    parent[last] = value;
  };
  const splitLines = value => value.split('\n').map(line => line.trim()).filter(Boolean);
  const displayValue = (value, type) => type === 'lines' ? (Array.isArray(value) ? value.join('\n') : value || '') : (value || '');

  function makeField({ label, scenario, key, path, type = 'text', wide = false }) {
    const wrapper = document.createElement('div');
    wrapper.className = `field${wide ? ' field-wide' : ''}`;
    const labelEl = document.createElement('label');
    labelEl.innerHTML = `<b>${label}</b><span>${scenario}</span>`;
    const input = type === 'textarea' || type === 'lines' ? document.createElement('textarea') : document.createElement('input');
    if (type === 'lines') input.placeholder = '每行一个标题句子';
    input.value = displayValue(getPath(model, path), type);
    input.addEventListener('input', () => {
      setPath(model, [...path], type === 'lines' ? splitLines(input.value) : input.value);
      markDirty();
    });
    wrapper.append(labelEl, input);
    return wrapper;
  }

  function renderSiteFields() {
    const root = document.getElementById('site-fields');
    siteFields.forEach(field => root.append(makeField({ ...field, path: ['site', field.key] })));
  }

  function renderProjectFields() {
    const root = document.getElementById('project-fields');
    model.projects.forEach((project, index) => {
      const card = document.createElement('section');
      card.className = 'project-card';
      const heading = document.createElement('div');
      heading.className = 'project-card-heading';
      const cover = document.createElement('img');
      cover.className = 'project-card-thumbnail';
      cover.src = `output/imagegen/project-covers/cover-${String(index + 1).padStart(2, '0')}.webp`;
      cover.alt = `${project.title || project.id} 的作品卡片封面`;
      cover.loading = 'lazy';
      cover.decoding = 'async';
      const headingText = document.createElement('div');
      headingText.className = 'project-card-heading-text';
      const title = document.createElement('h3');
      title.textContent = `${index + 1}. ${project.title || project.id}`;
      const projectId = document.createElement('span');
      projectId.textContent = project.id;
      headingText.append(title, projectId);
      heading.append(cover, headingText);
      const fields = document.createElement('div');
      fields.className = 'project-fields';
      projectFields.forEach(field => fields.append(makeField({
        ...field,
        path: ['projects', index, field.key],
        type: field.type || (field.key === 'cardTitle' ? 'lines' : 'text'),
        wide: field.key === 'introduction' || field.key === 'shortIntroduction'
      })));
      card.append(heading, fields);
      root.append(card);
    });
  }

  function serialize() {
    return `window.__PORTFOLIO__ = ${JSON.stringify(model, null, 2)};\n`;
  }

  function download() {
    const blob = new Blob([serialize()], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio-content.js';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('已下载 portfolio-content.js，请用它替换项目文件。');
  }

  async function saveToLocal() {
    if (!window.showSaveFilePicker) return download();
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'portfolio-content.js',
        types: [{ description: 'JavaScript 文件', accept: { 'text/javascript': ['.js'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(serialize());
      await writable.close();
      showToast('文案已保存。刷新作品集即可查看。');
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('保存失败，可以使用“只下载副本”。');
    }
  }

  let toastTimer;
  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4200);
  }

  function markDirty() {
    document.getElementById('save-button').textContent = '保存文案';
  }

  document.getElementById('save-button').addEventListener('click', saveToLocal);
  document.getElementById('download-button').addEventListener('click', download);
  document.getElementById('reset-button').addEventListener('click', () => {
    if (!window.confirm('确定撤销本次修改吗？')) return;
    window.location.reload();
  });
  renderSiteFields();
  renderProjectFields();
})();
