const REGION_FEEDS = {
  '全球': 'https://news.google.com/rss?hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  '北美': 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
  '欧洲': 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-GB&gl=GB&ceid=GB:en',
  '亚洲': 'https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja',
  '中东': 'https://news.google.com/rss?hl=ar&gl=AE&ceid=AE:ar',
  '非洲': 'https://news.google.com/rss?hl=en-NG&gl=NG&ceid=NG:en',
  '拉美': 'https://news.google.com/rss?hl=es-419&gl=MX&ceid=MX:es-419'
};

const NEWS_SITES = [
  { name: 'Reuters', url: 'https://www.reuters.com/' },
  { name: 'BBC', url: 'https://www.bbc.com/news' },
  { name: 'AP News', url: 'https://apnews.com/' },
  { name: 'CNN', url: 'https://edition.cnn.com/' },
  { name: 'NYTimes', url: 'https://www.nytimes.com/' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/' },
  { name: 'Bloomberg', url: 'https://www.bloomberg.com/' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/international' },
  { name: 'FT', url: 'https://www.ft.com/' },
  { name: 'NHK', url: 'https://www3.nhk.or.jp/nhkworld/' },
  { name: 'DW', url: 'https://www.dw.com/' },
  { name: 'CNBC', url: 'https://www.cnbc.com/world/' }
];

const state = {
  activeRegion: '全球',
  cache: {}
};
const CACHE_STORAGE_KEY = 'globalNewsCache.v1';

const regionTabsEl = document.getElementById('regionTabs');
const newsListEl = document.getElementById('newsList');
const siteGridEl = document.getElementById('siteGrid');
const lastUpdatedEl = document.getElementById('lastUpdated');
const refreshBtn = document.getElementById('refreshBtn');
const newsTemplate = document.getElementById('newsItemTemplate');

function buildSiteEntrances() {
  NEWS_SITES.forEach(({ name, url }) => {
    const a = document.createElement('a');
    a.className = 'site-link';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = name;
    siteGridEl.appendChild(a);
  });
}

function buildRegionTabs() {
  Object.keys(REGION_FEEDS).forEach((region) => {
    const button = document.createElement('button');
    button.className = `tab ${region === state.activeRegion ? 'active' : ''}`;
    button.textContent = region;
    button.addEventListener('click', async () => {
      state.activeRegion = region;
      syncActiveTab();
      await renderRegion(region);
    });
    regionTabsEl.appendChild(button);
  });
}

function syncActiveTab() {
  [...regionTabsEl.children].forEach((child) => {
    child.classList.toggle('active', child.textContent === state.activeRegion);
  });
}

function sanitizeSummary(value = '') {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function formatTime(pubDate) {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return '未知时间';
  return new Intl.DateTimeFormat('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

async function fetchRss(rssUrl) {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const response = await fetch(proxyUrl, { signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  const xmlText = await response.text();
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
  const hasParserError = xml.querySelector('parsererror');
  if (hasParserError) {
    throw new Error('XML 解析失败');
  }

  const items = [...xml.querySelectorAll('item')]
    .slice(0, 10)
    .map((item) => {
      const title = item.querySelector('title')?.textContent || '无标题';
      const link = item.querySelector('link')?.textContent || '#';
      const description = sanitizeSummary(item.querySelector('description')?.textContent || '');
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const source = item.querySelector('source')?.textContent || '聚合新闻源';
      return { title, link, description, pubDate, source };
    })
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  return items;
}

function loadCacheFromStorage() {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    if (!parsed.regions || typeof parsed.regions !== 'object') return;

    state.cache = parsed.regions;
    if (parsed.lastUpdated) {
      lastUpdatedEl.textContent = formatTime(parsed.lastUpdated);
    }
  } catch (error) {
    console.warn('读取本地缓存失败', error);
  }
}

function persistCacheToStorage() {
  try {
    const payload = {
      regions: state.cache,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('写入本地缓存失败', error);
  }
}

function renderNewsList(items) {
  newsListEl.innerHTML = '';

  if (!items.length) {
    newsListEl.innerHTML = '<div class="notice">暂时没有可显示的新闻，请稍后再刷新。</div>';
    return;
  }

  items.forEach((item, idx) => {
    const node = newsTemplate.content.cloneNode(true);
    node.querySelector('.rank').textContent = idx + 1;
    const titleEl = node.querySelector('.title');
    titleEl.textContent = item.title;
    titleEl.href = item.link;
    node.querySelector('.summary').textContent = item.description || '暂无摘要';
    node.querySelector('.source').textContent = item.source;
    node.querySelector('time').textContent = formatTime(item.pubDate);
    newsListEl.appendChild(node);
  });
}

async function renderRegion(region, force = false) {
  newsListEl.innerHTML = '<div class="notice">正在加载新闻...</div>';

  if (!force && state.cache[region]) {
    renderNewsList(state.cache[region]);
    return;
  }

  try {
    const data = await fetchRss(REGION_FEEDS[region]);
    state.cache[region] = data;
    persistCacheToStorage();
    renderNewsList(data);
    lastUpdatedEl.textContent = formatTime(new Date().toISOString());
  } catch (error) {
    newsListEl.innerHTML = `<div class="notice">加载失败：${error.message}。可尝试稍后刷新或切换区域。</div>`;
  }
}

async function refreshAll() {
  await renderRegion(state.activeRegion, true);
}

refreshBtn.addEventListener('click', refreshAll);

loadCacheFromStorage();
buildSiteEntrances();
buildRegionTabs();
renderRegion(state.activeRegion);
setInterval(refreshAll, 5 * 60 * 1000);
