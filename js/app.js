/* 应用层：页面渲染、状态管理、素材上传、复制/收藏/下载。 */
(function () {
  'use strict';

  const D = window.DYData;
  const G = window.DYGenerator;

  const STORE_CUSTOM = 'yhs.custom-products.v1';
  const STORE_SAVED = 'yhs.saved-copies.v1';

  const state = {
    page: 'studio',
    productId: 'meigancai',
    pointIds: [],
    sceneId: 'breakfast',
    personaId: 'owner',
    lengthId: 'standard',
    ctaId: 'dm',
    sellerNote: '',
    emoji: true,
    price: true,
    cta: true,
    hashtags: true,
    seed: 3,
    previewIndex: 0,
    results: [],
    materials: [],
    selectedImageIds: [],
    customProducts: [],
    saved: [],
    modal: null,
    materialTab: 'all',
    products: [],
    importState: {
      status: 'idle',
      dataUrl: '',
      fileName: '',
      ocrLines: [],
      rawText: '',
      analysis: null,
      selectedPointIds: [],
      selectedSceneId: '',
      selectedPersonaId: '',
      error: '',
      manualOpen: false,
      manualText: ''
    }
  };

  const pageMeta = {
    studio: { crumb: '文案工坊', sub: '朋友圈文案' },
    import: { crumb: '识图建档', sub: '图片识别产品' },
    products: { crumb: '产品库', sub: '全部产品' },
    materials: { crumb: '素材库', sub: '图片素材' },
    saved: { crumb: '收藏夹', sub: '已收藏文案' }
  };

  const app = document.getElementById('app');
  const overlayRoot = document.getElementById('overlay-root');
  const toastRoot = document.getElementById('toast-root');

  let toastTimer = null;
  let productInput = null;
  let sellerInput = null;
  let infoInput = null;

  /* ---------------- utilities ---------------- */
  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCopy(text) {
    return escapeHtml(text).replace(/(#[^\s#<]+)/g, '<span class="tag">$1</span>');
  }

  function readStore(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (err) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* file:// 或隐私模式下可能不可写，静默降级 */
    }
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatDateTime(iso) {
    const d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function getProduct(id) {
    return state.products.find(function (p) { return p.id === (id || state.productId); }) || state.products[0];
  }

  function getProductImage(product) {
    const upload = state.materials.find(function (m) {
      return !m.isSample && m.category === 'product' && m.productId === product.id;
    });
    return upload ? upload.src : (product.image || D.placeholderImage);
  }

  function getScenes(product) {
    return (product.sceneIds || []).map(function (id) {
      return product.custom ? D.customScenes[id] : D.sceneLibrary[id];
    }).filter(Boolean);
  }

  function getScene(product) {
    const list = getScenes(product);
    return list.find(function (s) { return s.id === state.sceneId; }) || list[0] || D.sceneLibrary.breakfast;
  }

  function getSelectedMaterials() {
    return state.selectedImageIds.map(function (id) {
      return state.materials.find(function (m) { return m.id === id; });
    }).filter(Boolean).slice(0, 9);
  }

  function getActiveVariant() {
    return state.results[state.previewIndex] || state.results[0] || { title: '', text: '', chars: 0 };
  }

  function isSaved(text) {
    return state.saved.some(function (item) { return item.text === text; });
  }

  function toast(message, iconName) {
    if (toastTimer) window.clearTimeout(toastTimer);
    toastRoot.innerHTML = '<div class="toast">' + icon(iconName || 'check') + '<span>' + escapeHtml(message) + '</span></div>';
    const el = toastRoot.firstElementChild;
    toastTimer = window.setTimeout(function () {
      if (!el) return;
      el.classList.add('leaving');
      window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    }, 2400);
  }

  /* ---------------- state actions ---------------- */
  function options() {
    return {
      pointIds: state.pointIds,
      sceneId: state.sceneId,
      personaId: state.personaId,
      length: state.lengthId,
      ctaId: state.ctaId,
      sellerNote: state.sellerNote,
      emoji: state.emoji,
      price: state.price,
      cta: state.cta,
      hashtags: state.hashtags,
      seed: state.seed
    };
  }

  function regenerate() {
    const product = getProduct();
    state.results = G.generate(product, options());
    if (state.previewIndex >= state.results.length) state.previewIndex = 0;
  }

  function selectDefaultImages(product) {
    const all = state.materials;
    const productUploads = all.filter(function (m) {
      return !m.isSample && m.category === 'product' && m.productId === product.id;
    });
    const productSample = all.find(function (m) {
      return m.isSample && m.category === 'product' && m.productId === product.id;
    });
    const sellerUploads = all.filter(function (m) {
      return !m.isSample && m.category === 'seller';
    });
    const sellerSamples = all.filter(function (m) {
      return m.isSample && m.category === 'seller' && m.productType === product.productType;
    });

    let products = [];
    if (product.custom) {
      products = productUploads;
    } else if (productUploads.length) {
      products = productUploads;
    } else if (productSample) {
      products = [productSample];
    }
    const sellers = sellerUploads.length ? sellerUploads : sellerSamples;
    const selected = [];
    const productLimit = product.custom ? 4 : 1;
    products.slice(0, productLimit).forEach(function (m) { selected.push(m.id); });
    sellers.slice(0, product.custom ? 5 : 3).forEach(function (m) { selected.push(m.id); });
    state.selectedImageIds = Array.from(new Set(selected)).slice(0, 9);
  }

  function applyProduct(id, opts) {
    const product = getProduct(id);
    if (!product) return;
    state.productId = product.id;
    state.pointIds = (product.defaultPoints || product.points.slice(0, 3).map(function (p) { return p.id; })).slice(0, 5);
    state.sceneId = product.defaultScene;
    state.previewIndex = 0;
    state.seed += 1;
    selectDefaultImages(product);
    regenerate();
    if (opts && opts.navigate) state.page = 'studio';
  }

  function switchPage(page) {
    if (!pageMeta[page]) return;
    state.page = page;
    state.modal = null;
    closeModal(false);
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function shuffle() {
    state.seed = (state.seed + 19) % 100000;
    state.previewIndex = 0;
    regenerate();
    renderApp({ preserveScroll: true });
    toast('已换一批文案，共 ' + state.results.length + ' 条', 'spark');
  }

  function togglePoint(id) {
    const active = state.pointIds.indexOf(id) !== -1;
    if (active) {
      if (state.pointIds.length <= 1) {
        toast('至少保留 1 个卖点', 'info');
        return;
      }
      state.pointIds = state.pointIds.filter(function (p) { return p !== id; });
    } else {
      if (state.pointIds.length >= 5) {
        toast('最多选择 5 个卖点，聚焦一点更好写', 'info');
        return;
      }
      state.pointIds = state.pointIds.concat(id);
    }
    regenerate();
    renderApp({ preserveScroll: true });
  }

  function setOption(key, value) {
    if (key === 'toggle') {
      state[value] = !state[value];
    } else if (key === 'scene') {
      state.sceneId = value;
      state.previewIndex = 0;
    } else if (key === 'persona') {
      state.personaId = value;
    } else if (key === 'length') {
      state.lengthId = value;
      state.previewIndex = 0;
    } else if (key === 'cta') {
      state.ctaId = value;
    }
    regenerate();
    renderApp({ preserveScroll: true });
  }

  function copyText(text, button) {
    const done = function () {
      if (button) {
        button.classList.add('copied');
        button.innerHTML = icon('check') + '<span>已复制</span>';
        window.setTimeout(function () {
          if (button && button.isConnected) {
            button.classList.remove('copied');
            button.innerHTML = icon('copy') + '<span>复制</span>';
          }
        }, 1800);
      }
      toast('已复制，去微信粘贴发布吧', 'copy');
    };
    const fallback = function () {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { toast('复制失败，请手动选择文字', 'info'); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  function copyVariant(index, button) {
    const variant = state.results[index];
    if (!variant) return;
    copyText(variant.text, button);
  }

  function saveVariant(index) {
    const variant = state.results[index];
    if (!variant) return;
    const product = getProduct();
    const existingIndex = state.saved.findIndex(function (item) { return item.text === variant.text; });
    if (existingIndex !== -1) {
      state.saved.splice(existingIndex, 1);
      writeStore(STORE_SAVED, state.saved);
      renderApp({ preserveScroll: true });
      toast('已取消收藏', 'bookmark');
      return;
    }
    state.saved.unshift({
      id: 'saved-' + Date.now() + '-' + index,
      title: variant.title,
      text: variant.text,
      chars: variant.chars,
      productId: product.id,
      productName: product.shortName,
      createdAt: new Date().toISOString()
    });
    if (state.saved.length > 80) state.saved.length = 80;
    writeStore(STORE_SAVED, state.saved);
    renderApp({ preserveScroll: true });
    toast('已收藏，可在收藏夹查看', 'bookmark');
  }

  function deleteSaved(id) {
    state.saved = state.saved.filter(function (item) { return item.id !== id; });
    writeStore(STORE_SAVED, state.saved);
    renderApp({ preserveScroll: true });
    toast('已删除收藏', 'trash');
  }

  function clearSaved() {
    if (!state.saved.length) return;
    if (!window.confirm('确定清空全部收藏文案吗？')) return;
    state.saved = [];
    writeStore(STORE_SAVED, state.saved);
    renderApp({ preserveScroll: true });
    toast('收藏夹已清空', 'trash');
  }

  function downloadAll() {
    const product = getProduct();
    const lines = [
      '壹号食志 · 朋友圈文案',
      '产品：' + product.name,
      '生成时间：' + formatDateTime(),
      '配图数量：' + getSelectedMaterials().length + ' 张',
      '',
      '————————————————————',
      ''
    ];
    state.results.forEach(function (v, i) {
      lines.push('【' + pad(i + 1) + ' · ' + v.title + '】' + v.chars + ' 字');
      lines.push(v.text);
      lines.push('');
      lines.push('————————————————————');
      lines.push('');
    });
    lines.push('提示：卖点、价格请按实际包装与检测报告核对后再发布。');
    downloadText('壹号食志-' + product.shortName + '-朋友圈文案.txt', lines.join('\r\n'));
  }

  function downloadText(filename, content) {
    const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 500);
    toast('文案已下载', 'download');
  }

  /* ---------------- material handling ---------------- */
  function labelFromFile(name) {
    return String(name || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 18) || '我的图片';
  }

  function handleFiles(files, category) {
    const list = Array.from(files || []).filter(function (file) {
      return file && file.type && file.type.indexOf('image/') === 0;
    });
    if (!list.length) {
      toast('请选择图片文件', 'info');
      return;
    }
    const newIds = [];
    list.slice(0, 12).forEach(function (file, i) {
      if (file.size > 12 * 1024 * 1024) {
        toast(file.name + ' 超过 12MB，已跳过', 'info');
        return;
      }
      const id = 'upload-' + Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2, 6);
      const material = {
        id: id,
        category: category,
        productId: category === 'product' ? state.productId : null,
        src: URL.createObjectURL(file),
        label: labelFromFile(file.name),
        isSample: false,
        fileName: file.name
      };
      state.materials.push(material);
      newIds.push(id);
    });
    if (!newIds.length) return;

    const product = getProduct();
    let selected = state.selectedImageIds.filter(function (id) {
      const m = state.materials.find(function (x) { return x.id === id; });
      if (!m || !m.isSample) return true;
      if (category === 'product' && m.category === 'product' && m.productId === product.id) return false;
      if (category === 'seller' && m.category === 'seller' && m.productType === product.productType) return false;
      return true;
    });
    const room = Math.max(0, 9 - selected.length);
    if (category === 'product' && room > 0) selected = newIds.slice(Math.max(0, newIds.length - room)).concat(selected);
    else if (category === 'seller' && room > 0) selected = selected.concat(newIds.slice(0, room));
    state.selectedImageIds = Array.from(new Set(selected)).slice(0, 9);
    renderApp({ preserveScroll: true });
    toast(newIds.length + ' 张图片已加入本次配图', 'image');
  }

  function removeImage(id) {
    state.selectedImageIds = state.selectedImageIds.filter(function (x) { return x !== id; });
    renderApp({ preserveScroll: true });
  }

  function setCover(id) {
    state.selectedImageIds = [id].concat(state.selectedImageIds.filter(function (x) { return x !== id; }));
    renderApp({ preserveScroll: true });
    toast('已设为首图', 'star');
  }

  function toggleMaterial(id) {
    const exists = state.selectedImageIds.indexOf(id) !== -1;
    if (exists) {
      state.selectedImageIds = state.selectedImageIds.filter(function (x) { return x !== id; });
    } else {
      if (state.selectedImageIds.length >= 9) {
        toast('朋友圈最多 9 张图，先移除一张吧', 'info');
        return;
      }
      state.selectedImageIds.push(id);
    }
    renderApp({ preserveScroll: true });
  }

  function deleteMaterial(id) {
    const material = state.materials.find(function (m) { return m.id === id; });
    if (!material) return;
    if (!window.confirm('删除这张素材？')) return;
    if (material.src && material.src.indexOf('blob:') === 0) URL.revokeObjectURL(material.src);
    state.materials = state.materials.filter(function (m) { return m.id !== id; });
    state.selectedImageIds = state.selectedImageIds.filter(function (x) { return x !== id; });
    renderApp({ preserveScroll: true });
    toast('素材已删除', 'trash');
  }

  /* ---------------- custom products ---------------- */
  function buildCustomProduct(form) {
    const name = String(form.name || '').trim();
    const headline = String(form.headline || '').trim();
    const price = String(form.price || '').trim();
    const spec = String(form.spec || '').trim();
    const rawPoints = String(form.points || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 5);
    const points = rawPoints.map(function (text, i) {
      const clean = text.replace(/[。；;]+$/, '');
      return {
        id: 'custom-point-' + i,
        label: clean.length > 16 ? clean.slice(0, 16) + '…' : clean,
        short: clean.length > 34 ? clean.slice(0, 34) + '…' : clean,
        copy: /[。！？!?]$/.test(clean) ? clean : clean + '。'
      };
    });
    const priceLine = price ? (/[。！？!?]$/.test(price) ? price : price + '。') : '';
    return {
      id: 'custom-' + Date.now(),
      custom: true,
      name: name,
      shortName: name.length > 10 ? name.slice(0, 10) : name,
      tag: '我的选品',
      category: '自定义产品',
      productType: 'custom',
      headline: headline || (points[0] ? points[0].short : '我的私藏好物'),
      price: price || '价格私信',
      priceNote: '',
      spec: spec,
      image: D.placeholderImage,
      accent: '#9a7148',
      soft: '#ede3d4',
      emojis: ['✨', '🤍', '🫶'],
      points: points,
      defaultPoints: points.slice(0, 3).map(function (p) { return p.id; }),
      sceneIds: ['daily', 'customFamily', 'customGift'],
      defaultScene: 'daily',
      voice: {
        sensory: ['用料和细节都摆在这里，吃过就知道值不值得。', '不靠花哨的形容，先把真实的样子拍给你看。'],
        context: ['有些好东西不一定会吆喝，但值得被认真介绍一次。', '挑来挑去，最后还是想把这一样分享出来。'],
        trust: '所有卖点来自产品资料，按实际包装核对后再发布。',
        sellerLines: ['这次拍的是实物，没有过度修饰。', '就是这样一件东西，喜欢的话可以试试。'],
        shortHooks: ['最近挖到的好东西，分享给你们。', '值得记一笔的日常好物。']
      },
      priceLines: {
        short: priceLine,
        standard: priceLine,
        action: priceLine
      },
      hashtags: ['#好物分享', '#日常推荐'],
      imageTips: ['首图用产品整体图，第二张放细节或包装', '再补一张真实使用场景，会更有说服力'],
      createdAt: new Date().toISOString()
    };
  }

  function saveCustomProduct(form) {
    const product = buildCustomProduct(form);
    if (!product.points.length) {
      toast('至少写 1 条卖点', 'info');
      return false;
    }
    state.customProducts.push(product);
    state.products = D.products.concat(state.customProducts);
    writeStore(STORE_CUSTOM, state.customProducts);
    state.modal = null;
    closeModal(false);
    applyProduct(product.id, { navigate: true });
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('自定义产品已创建，记得上传产品图', 'spark');
    return true;
  }

  function deleteCustomProduct(id) {
    const product = getProduct(id);
    if (!product || !product.custom) return;
    if (!window.confirm('删除「' + product.name + '」？已收藏的文案不会受影响。')) return;
    state.customProducts = state.customProducts.filter(function (p) { return p.id !== id; });
    state.products = D.products.concat(state.customProducts);
    writeStore(STORE_CUSTOM, state.customProducts);
    state.materials = state.materials.filter(function (m) { return m.productId !== id; });
    if (state.productId === id) applyProduct(D.products[0].id);
    renderApp({ preserveScroll: true });
    toast('自定义产品已删除', 'trash');
  }

  /* ---------------- modals ---------------- */
  function closeModal(render) {
    state.modal = null;
    overlayRoot.innerHTML = '';
    document.body.style.overflow = '';
    if (render !== false) {
      /* no full re-render needed */
    }
  }

  function openModal(type) {
    state.modal = type;
    renderOverlay();
    document.body.style.overflow = 'hidden';
    window.setTimeout(function () {
      const focusEl = overlayRoot.querySelector('[data-autofocus]');
      if (focusEl) focusEl.focus();
    }, 60);
  }

  function renderOverlay() {
    if (!state.modal) {
      overlayRoot.innerHTML = '';
      return;
    }
    overlayRoot.innerHTML = state.modal === 'guide' ? guideModal() : customModal();
  }

  function guideModal() {
    return '' +
      '<div class="overlay" data-overlay>' +
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="guide-title">' +
          '<div class="modal-head">' +
            '<div><span class="eyebrow">HOW TO USE</span><h2 id="guide-title">四步，发一条像样的朋友圈</h2><p>没有复杂操作，选好产品和图，剩下的交给本地文案引擎。</p></div>' +
            '<button class="modal-close" data-close-modal aria-label="关闭">' + icon('close') + '</button>' +
          '</div>' +
          '<div class="guide-steps">' +
            '<div class="guide-step"><div class="guide-num">01</div><div><h3>选产品，挑卖点</h3><p>从「产品库」选一款主推产品，或点「识图建档」上传产品信息图自动识别。再勾选 3–5 个你最想讲的卖点。默认已经帮你选了最适合发朋友圈的组合。</p></div></div>' +
            '<div class="guide-step"><div class="guide-num">02</div><div><h3>定场景和语气</h3><p>早餐、家庭、送礼、办公室下午茶……场景决定开头。人设和长度决定整条文案的说话方式。</p></div></div>' +
            '<div class="guide-step"><div class="guide-num">03</div><div><h3>上传产品图和卖家秀</h3><p>在「素材库」上传 1–9 张图片，点击缩略图可设为首图。建议顺序：产品特写 → 使用场景 → 包装细节。</p></div></div>' +
            '<div class="guide-step"><div class="guide-num">04</div><div><h3>挑一条，复制发布</h3><p>右侧点击卡片切换手机预览。复制文案、收藏灵感，或下载全部文案。按 <strong>Ctrl / ⌘ + Enter</strong> 可以一键换一批。</p></div></div>' +
          '</div>' +
          '<div class="guide-note"><strong>发布前请核对：</strong>文案中的卖点、价格、规格均来自产品资料截图。发布前请按实际包装、检测报告和当期活动价再次确认；“扫码留货”等 CTA 请替换成你自己的二维码或联系方式。图片在浏览器中识别，不会上传到应用服务器；识别不准时可直接手动粘贴文字。</div>' +
          '<div class="modal-actions"><button class="btn" data-close-modal>知道了</button><button class="btn btn-primary" data-action="go-studio">开始写文案' + icon('arrow') + '</button></div>' +
        '</div>' +
      '</div>';
  }

  function customModal() {
    return '' +
      '<div class="overlay" data-overlay>' +
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="custom-title">' +
          '<div class="modal-head">' +
            '<div><span class="eyebrow">CUSTOM PRODUCT</span><h2 id="custom-title">添加一个自己的产品</h2><p>产品只保存在本机浏览器里，不会上传到任何服务器。</p></div>' +
            '<button class="modal-close" data-close-modal aria-label="关闭">' + icon('close') + '</button>' +
          '</div>' +
          '<form id="custom-product-form" novalidate>' +
            '<div class="form-grid">' +
              '<div class="form-row">' +
                '<div class="form-field" data-field="name"><label for="cp-name">产品名称 <small>必填</small></label><input id="cp-name" name="name" maxlength="24" placeholder="例如：陈皮豆沙月饼" data-autofocus><div class="form-error">请填写产品名称</div></div>' +
                '<div class="form-field"><label for="cp-price">价格 / 优惠 <small>选填</small></label><input id="cp-price" name="price" maxlength="30" placeholder="例如：128 元 / 盒，一盒 8 个"></div>' +
              '</div>' +
              '<div class="form-field"><label for="cp-headline">一句话卖点 <small>选填</small></label><input id="cp-headline" name="headline" maxlength="40" placeholder="例如：新会陈皮 × 红豆沙，50g 小规格"></div>' +
              '<div class="form-field"><label for="cp-spec">规格 / 包装 <small>选填</small></label><input id="cp-spec" name="spec" maxlength="40" placeholder="例如：50g × 8 个 · 黑鎏金铁盒"></div>' +
              '<div class="form-field" data-field="points"><label for="cp-points">核心卖点 <small>必填，一行一条，最多 5 条</small></label><textarea id="cp-points" name="points" placeholder="只用自家黑猪肉，含量 ≥27%&#10;空气炸锅 200℃ 10 分钟，无需解冻&#10;单片独立包装，冰箱随便放"></textarea><div class="form-hint">写得越具体，生成的文案越好用。数字和工艺细节都可以写进来。</div><div class="form-error">请至少写 1 条卖点</div></div>' +
            '</div>' +
            '<div class="modal-actions"><button type="button" class="btn" data-close-modal>取消</button><button type="submit" class="btn btn-accent">保存并开始写' + icon('arrow') + '</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
  }

  /* ---------------- render: shell ---------------- */
  function navItem(page, iconName, label, index, count) {
    return '' +
      '<button class="nav-item ' + (state.page === page ? 'active' : '') + '" data-nav="' + page + '">' +
        icon(iconName) +
        '<span>' + label + '</span>' +
        '<em>' + index + '</em>' +
        (count ? '<b class="nav-count">' + count + '</b>' : '') +
      '</button>';
  }

  function sidebar() {
    return '' +
      '<aside class="sidebar">' +
        '<div class="brand">' +
          '<div class="brand-mark">壹</div>' +
          '<div class="brand-text"><strong>壹号食志</strong><span>MOMENTS LAB</span></div>' +
        '</div>' +
        '<nav class="nav" aria-label="主导航">' +
          navItem('studio', 'pen', '文案工坊', '01') +
          navItem('import', 'spark', '识图建档', '02') +
          navItem('products', 'package', '产品库', '03') +
          navItem('materials', 'image', '素材库', '04') +
          navItem('saved', 'bookmark', '收藏夹', '05', state.saved.length) +
        '</nav>' +
        '<div class="sidebar-note">' +
          '<span class="eyebrow">WRITING TIP</span>' +
          '<p>先选 3 个卖点，<br>再定一个场景，<br>文案会更聚焦。</p>' +
          '<button data-action="guide">查看使用说明 →</button>' +
        '</div>' +
        '<div class="sidebar-foot">' +
          '<span class="status-dot"><i></i><span>本地生成 · 无需联网</span></span>' +
          '<span>v1.0</span>' +
        '</div>' +
      '</aside>';
  }

  function topbar() {
    const meta = pageMeta[state.page] || pageMeta.studio;
    return '' +
      '<header class="topbar">' +
        '<div class="topbar-brand"><div class="brand-mark">壹</div><span>壹号食志</span></div>' +
        '<div class="crumb"><span>工作台</span><span class="sep">/</span><strong>' + meta.crumb + '</strong><span class="sep">/</span><span>' + meta.sub + '</span></div>' +
        '<div class="topbar-right">' +
          '<span class="engine-pill"><i></i>本地文案引擎</span>' +
          '<button class="icon-btn" data-action="guide" title="使用说明" aria-label="使用说明">' + icon('info') + '</button>' +
          '<div class="avatar-mini" title="壹号食志">壹</div>' +
        '</div>' +
      '</header>';
  }

  function renderApp(opts) {
    const options = opts || {};
    const scrollY = window.scrollY || window.pageYOffset;
    app.innerHTML = '<div class="app-shell">' + sidebar() + '<div class="main-shell">' + topbar() + '<main class="view">' + renderPage() + '</main></div></div>';
    if (options.preserveScroll) {
      window.scrollTo({ top: scrollY, left: 0, behavior: 'auto' });
    }
    const meta = pageMeta[state.page] || pageMeta.studio;
    document.title = '壹号食志 · ' + meta.crumb;
    renderOverlay();
  }

  function renderPage() {
    if (state.page === 'import') return importPage();
    if (state.page === 'products') return productsPage();
    if (state.page === 'materials') return materialsPage();
    if (state.page === 'saved') return savedPage();
    return studioPage();
  }

  /* ---------------- render: studio ---------------- */
  function studioPage() {
    return '' +
      '<section class="studio-hero">' +
        '<div class="hero-copy">' +
          '<span class="eyebrow">MOMENTS COPY STUDIO · 01</span>' +
          '<h1>把好食材，写成<br><em>让人想下单</em>的朋友圈。</h1>' +
        '</div>' +
        '<div class="hero-side">' +
          '<p>选产品、挑卖点、配好图，30 秒生成 6 条可直接发布的朋友圈文案。不写套话，只把用料和场景说清楚。</p>' +
          '<button class="hero-import-btn" data-action="go-import">' + icon('spark') + '<span>上传产品信息图，自动识别卖点</span>' + icon('arrow') + '</button>' +
          '<div class="hero-stats">' +
            '<div><strong>' + state.products.length + '</strong><span>款产品</span></div>' +
            '<div><strong>6</strong><span>种角度</span></div>' +
            '<div><strong>0</strong><span>网络依赖</span></div>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<div class="workspace">' +
        controlsPanel() +
        previewColumn() +
        resultsColumn() +
      '</div>';
  }

  function controlsPanel() {
    const product = getProduct();
    const pointCount = state.pointIds.length;
    const scenes = getScenes(product);
    return '' +
      '<section class="panel controls" aria-label="文案配置">' +
        '<div class="control-head"><h2>配置</h2><span>01 — 04</span></div>' +
        productStep(product) +
        pointsStep(product, pointCount) +
        styleStep(scenes) +
        publishStep(product) +
        '<button class="generate-btn" data-action="shuffle">' + icon('spark') + '<span>重新生成 6 条文案</span><span class="kbd">⌘↵</span></button>' +
        '<p class="length-hint">已生成 ' + state.results.length + ' 条 · 点击结果卡片切换预览</p>' +
      '</section>';
  }

  function productStep(product) {
    return '' +
      '<div class="step">' +
        '<div class="step-head"><span class="step-no">01</span><h3>选产品</h3><span class="step-hint">本次主推</span></div>' +
        '<div class="product-grid">' +
          state.products.map(function (p) {
            return '<button class="product-option ' + (p.id === product.id ? 'active' : '') + '" data-product-id="' + escapeHtml(p.id) + '" aria-pressed="' + (p.id === product.id) + '">' +
              '<img src="' + escapeHtml(getProductImage(p)) + '" alt="" loading="lazy">' +
              '<span class="product-option-body"><strong>' + escapeHtml(p.shortName) + '</strong><small>' + escapeHtml(p.priceNote || p.price) + '</small></span>' +
              '<span class="tick">' + icon('check') + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<button class="link-btn add-product-link" data-action="open-custom">' + icon('plus') + '添加自定义产品</button>' +
      '</div>';
  }

  function pointsStep(product, pointCount) {
    return '' +
      '<div class="step">' +
        '<div class="step-head"><span class="step-no">02</span><h3>挑卖点</h3><span class="step-hint">已选 ' + pointCount + ' / 5</span></div>' +
        '<div class="chip-row">' +
          product.points.map(function (p) {
            const active = state.pointIds.indexOf(p.id) !== -1;
            const disabled = !active && pointCount >= 5;
            return '<button class="point-chip ' + (active ? 'active' : '') + '" data-point="' + escapeHtml(p.id) + '" aria-pressed="' + active + '"' + (disabled ? ' disabled' : '') + '>' + escapeHtml(p.label) + '</button>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  function styleStep(scenes) {
    return '' +
      '<div class="step">' +
        '<div class="step-head"><span class="step-no">03</span><h3>定场景与语气</h3><span class="step-hint">决定开头</span></div>' +
        '<div class="chip-row">' +
          scenes.map(function (s) {
            return '<button class="scene-chip ' + (s.id === state.sceneId ? 'active' : '') + '" data-scene="' + escapeHtml(s.id) + '" aria-pressed="' + (s.id === state.sceneId) + '">' + escapeHtml(s.label) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="field-label">说话的人设 <span>文案语气</span></div>' +
        '<div class="chip-row">' +
          D.personas.map(function (p) {
            return '<button class="persona-chip ' + (p.id === state.personaId ? 'active' : '') + '" data-persona="' + escapeHtml(p.id) + '" aria-pressed="' + (p.id === state.personaId) + '" title="' + escapeHtml(p.hint) + '">' + escapeHtml(p.label) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="field-label">文案长度 <span>' + escapeHtml((D.lengths.find(function (l) { return l.id === state.lengthId; }) || D.lengths[1]).hint) + '</span></div>' +
        '<div class="segment">' +
          D.lengths.map(function (l) {
            return '<button class="' + (l.id === state.lengthId ? 'active' : '') + '" data-length="' + escapeHtml(l.id) + '">' + escapeHtml(l.label) + '</button>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  function publishStep(product) {
    const cta = D.ctas.find(function (c) { return c.id === state.ctaId; }) || D.ctas[0];
    return '' +
      '<div class="step">' +
        '<div class="step-head"><span class="step-no">04</span><h3>发布设置</h3><span class="step-hint">细节微调</span></div>' +
        '<div class="switch-grid">' +
          switchControl('emoji', '带表情', state.emoji) +
          switchControl('price', '带价格', state.price) +
          switchControl('cta', '带行动引导', state.cta) +
          switchControl('hashtags', '带话题', state.hashtags) +
        '</div>' +
        '<div class="field-label">结尾动作 <span>CTA</span></div>' +
        '<div class="select-wrap">' +
          '<select data-cta-select aria-label="选择结尾动作">' +
            D.ctas.map(function (c) {
              return '<option value="' + escapeHtml(c.id) + '"' + (c.id === state.ctaId ? ' selected' : '') + '>' + escapeHtml(c.label) + '</option>';
            }).join('') +
          '</select>' + icon('chevron-down') +
        '</div>' +
        '<div class="field-label">这组图想强调什么 <span>选填 · 会写进卖家秀文案</span></div>' +
        '<textarea class="note-input" data-note maxlength="80" placeholder="例如：掰开能看到整颗龙虾仁 / 孩子主动吃完一整块">' + escapeHtml(state.sellerNote) + '</textarea>' +
        '<div class="field-label"><span>当前 CTA：' + escapeHtml(cta.text || '不加结尾') + '</span><span data-note-count>' + state.sellerNote.length + '/80</span></div>' +
      '</div>';
  }

  function switchControl(key, label, on) {
    return '<button class="switch ' + (on ? 'on' : '') + '" data-toggle="' + key + '" role="switch" aria-checked="' + on + '"><span>' + label + '</span><span class="track"></span></button>';
  }

  function previewColumn() {
    const product = getProduct();
    const scene = getScene(product);
    const variant = getActiveVariant();
    const materials = getSelectedMaterials();
    const cover = materials.length ? materials[0].src : getProductImage(product);
    const tip = (product.imageTips && product.imageTips[0]) || scene.imageTip || '上传你的产品图和卖家秀，预览会更接近真实发布效果。';
    return '' +
      '<section class="preview-column" aria-label="朋友圈预览">' +
        '<div class="preview-head"><div><span class="eyebrow">LIVE PREVIEW</span><h2>朋友圈效果</h2></div><span class="pill">' + icon('image') + materials.length + ' 张配图</span></div>' +
        '<div class="phone-frame">' +
          '<div class="phone-screen">' +
            '<div class="phone-status"><span>10:07</span><span class="status-icons"><span class="signal-bars"><i></i><i></i><i></i></span><span>5G</span><span class="battery"></span></span></div>' +
            '<div class="moments-nav"><span class="nav-left">' + icon('chevron-left', 'nav-icon') + '</span><strong>朋友圈</strong><span class="nav-right">' + icon('more', 'nav-icon') + '</span></div>' +
            '<div class="phone-scroll">' +
              '<div class="moments-cover"><img src="' + escapeHtml(cover) + '" alt=""><span class="cover-label">' + escapeHtml(product.shortName) + ' · 认真选好每一口</span></div>' +
              '<div class="moments-profile"><div class="moments-avatar">壹</div><div><h4>壹号食志</h4><p>把好食材，分享给懂吃的人</p></div></div>' +
              '<article class="moment">' +
                '<div class="moment-avatar">壹</div>' +
                '<div class="moment-body">' +
                  '<div class="moment-name">壹号食志</div>' +
                  '<div class="moment-text">' + formatCopy(variant.text) + '</div>' +
                  '<div class="moment-media">' + momentGrid(materials) + '</div>' +
                  '<div class="moment-meta"><span>1 小时前</span><span class="source">来自 iPhone</span></div>' +
                  '<div class="moment-actions"><span>' + icon('heart') + ' 赞</span><span>' + icon('message') + ' 评论</span><span class="spacer"></span><span>' + icon('more') + '</span></div>' +
                '</div>' +
              '</article>' +
              '<div class="phone-end">— 已经到底啦 —</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="preview-note">' + icon('spark') + '<span>配图建议：' + escapeHtml(tip) + '</span></div>' +
        mediaBlock(materials) +
      '</section>';
  }

  function momentGrid(materials) {
    if (!materials.length) {
      return '<div class="moment-media-empty">' + icon('image') + '<span>还没有配图<br>去素材库上传产品图或卖家秀</span></div>';
    }
    const items = materials.slice(0, 9);
    return '<div class="moment-grid n-' + items.length + '">' +
      items.map(function (m) {
        return '<div class="grid-item"><img src="' + escapeHtml(m.src) + '" alt="' + escapeHtml(m.label) + '" loading="lazy"></div>';
      }).join('') +
    '</div>';
  }

  function mediaBlock(materials) {
    return '' +
      '<div class="media-block">' +
        '<div class="media-head"><strong>本次配图 ' + materials.length + ' / 9</strong><button class="link-btn" data-action="go-materials">管理素材' + icon('arrow') + '</button></div>' +
        '<div class="thumb-row">' +
          materials.map(function (m, i) {
            return '<div class="thumb" data-cover-image="' + escapeHtml(m.id) + '" title="点击设为首图">' +
              '<img src="' + escapeHtml(m.src) + '" alt="' + escapeHtml(m.label) + '" loading="lazy">' +
              (i === 0 ? '<span class="thumb-badge">首图</span>' : '') +
              '<button class="thumb-remove" data-remove-image="' + escapeHtml(m.id) + '" aria-label="移除这张图片" title="移除">' + icon('close') + '</button>' +
            '</div>';
          }).join('') +
          '<button class="thumb-add" data-action="go-materials" title="上传或选择素材" aria-label="上传或选择素材">' + icon('plus') + '</button>' +
        '</div>' +
        '<div class="media-hint">点击缩略图可设为首图 · 上传的图片仅当前会话有效</div>' +
      '</div>';
  }

  function resultsColumn() {
    const product = getProduct();
    const materials = getSelectedMaterials();
    return '' +
      '<section class="results-column" aria-label="生成结果">' +
        '<div class="results-head">' +
          '<div><span class="eyebrow">GENERATED COPY</span><h2>' + state.results.length + ' 条朋友圈文案</h2></div>' +
          '<div class="results-actions">' +
            '<button class="btn btn-sm btn-ghost" data-action="download" title="下载全部为 TXT">' + icon('download') + '下载全部</button>' +
            '<button class="btn btn-sm btn-primary" data-action="shuffle">' + icon('refresh') + '换一批</button>' +
          '</div>' +
        '</div>' +
        '<div class="results-meta"><span>点击卡片切换左侧预览</span><span class="dot"></span><span>已选 ' + state.pointIds.length + ' 个卖点</span><span class="dot"></span><span class="num">' + materials.length + ' 张配图</span></div>' +
        '<div class="copy-list">' +
          state.results.map(function (variant, i) { return variantCard(variant, i, product, materials); }).join('') +
          '<div class="compliance-note">' + icon('info') + '<span>卖点、价格与规格来自产品资料截图。发布前请按实际包装、检测报告与当期活动再次确认；使用“扫码留货”时请替换成自己的二维码。</span></div>' +
        '</div>' +
      '</section>';
  }

  function variantCard(variant, i, product, materials) {
    const saved = isSaved(variant.text);
    return '' +
      '<article class="copy-card ' + (i === state.previewIndex ? 'active' : '') + '" data-variant-index="' + i + '">' +
        '<div class="copy-head">' +
          '<span class="copy-index">' + pad(i + 1) + '</span>' +
          '<div><div class="copy-title">' + escapeHtml(variant.title) + '</div><div class="copy-note">' + escapeHtml(variant.note) + ' · ' + escapeHtml(product.shortName) + '</div></div>' +
          '<span class="copy-chars">' + variant.chars + ' 字</span>' +
        '</div>' +
        '<div class="copy-body">' + formatCopy(variant.text) + '</div>' +
        '<div class="copy-foot">' +
          '<div class="copy-foot-info">' + icon('image') + '配图 ' + materials.length + ' 张</div>' +
          '<div class="copy-btns">' +
            '<button class="copy-btn" data-copy-index="' + i + '">' + icon('copy') + '<span>复制</span></button>' +
            '<button class="copy-btn icon-only ' + (saved ? 'saved' : '') + '" data-save-index="' + i + '" title="' + (saved ? '取消收藏' : '收藏文案') + '" aria-label="' + (saved ? '取消收藏' : '收藏文案') + '">' + icon('bookmark') + '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ---------------- render: smart import ---------------- */
  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('图片读取失败')); };
      reader.readAsDataURL(file);
    });
  }

  function sampleInfoText() {
    const p = D.products[0];
    return [
      p.name + ' 卖点',
      p.headline,
      p.points.slice(0, 4).map(function (point) { return '· ' + point.copy; }).join('\n'),
      p.price + '，' + p.priceNote + '。',
      '早餐、孩子、家庭囤货都适合。'
    ].join('\n');
  }

  function resetImport() {
    state.importState = {
      status: 'idle',
      dataUrl: '',
      fileName: '',
      ocrLines: [],
      rawText: '',
      analysis: null,
      selectedPointIds: [],
      selectedSceneId: '',
      selectedPersonaId: '',
      error: '',
      manualOpen: false,
      manualText: ''
    };
    renderApp({ preserveScroll: true });
  }

  async function handleInfoFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      toast('请上传 JPG / PNG / WebP 图片', 'info');
      return;
    }
    if (file.size > 18 * 1024 * 1024) {
      toast('图片不能超过 18MB', 'info');
      return;
    }
    let prepared = null;
    try {
      prepared = await prepareOcrImage(file);
    } catch (err) {
      toast(err.message || '图片读取失败', 'info');
      return;
    }
    state.importState = {
      status: 'processing',
      stage: 'ocr',
      dataUrl: prepared.preview,
      fileName: file.name,
      ocrLines: [],
      rawText: '',
      analysis: null,
      selectedPointIds: [],
      selectedSceneId: '',
      selectedPersonaId: '',
      error: '',
      manualOpen: false,
      manualText: ''
    };
    renderApp({ preserveScroll: true });
    try {
      const worker = await getBrowserOcrWorker();
      const attempts = [];
      state.importState.stage = 'ocr';
      renderApp({ preserveScroll: true });
      attempts.push(await worker.recognize(prepared.normal));
      attempts.push(await worker.recognize(prepared.enhanced));
      let result = attempts.sort(function (a, b) { return scoreOcrResult(b) - scoreOcrResult(a); })[0];
      const bestText = String(result.data && result.data.text || '');
      if ((Number(result.data && result.data.confidence) || 0) < 65 || bestText.replace(/\s/g, '').length < 80) {
        state.importState.stage = 'enhance';
        renderApp({ preserveScroll: true });
        attempts.push(await worker.recognize(prepared.highContrast));
        if (typeof worker.setParameters === 'function') {
          try {
            await worker.setParameters({ tessedit_pageseg_mode: '6' });
            attempts.push(await worker.recognize(prepared.enhanced));
            await worker.setParameters({ tessedit_pageseg_mode: '11' });
            attempts.push(await worker.recognize(prepared.enhanced));
          } catch (parameterError) {
            // Keep the normal OCR result if the browser OCR engine rejects a retry mode.
          } finally {
            try { await worker.setParameters({ tessedit_pageseg_mode: '3' }); } catch (resetError) {}
          }
        }
        result = attempts.sort(function (a, b) { return scoreOcrResult(b) - scoreOcrResult(a); })[0];
      }
      state.importState.stage = 'analyze';
      renderApp({ preserveScroll: true });
      const rawText = String(result.data && result.data.text || '').trim();
      const lines = rawText.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
      if (!rawText || rawText.replace(/\s/g, '').length < 8) {
        throw new Error('这张图里没有识别到足够的文字，换一张清晰一点的截图试试');
      }
      const analysis = window.DYAnalyzer.analyzeText(rawText);
      if (!analysis.matched && !analysis.customPoints.length && analysis.customName === '图片识别产品') {
        state.importState.status = 'error';
        state.importState.error = '图片中的文字太小或较模糊，自动识别没有提取出产品名称和卖点。请在左侧文字框里核对并修改识别文字，或粘贴清晰的产品资料。';
        state.importState.rawText = rawText;
        state.importState.manualText = rawText;
        state.importState.manualOpen = true;
        renderApp({ preserveScroll: true });
        toast('识别文字不完整，请核对后再生成', 'info');
        return;
      }
      applyImportAnalysisText(rawText, lines);
    } catch (err) {
      state.importState.status = 'error';
      state.importState.error = err.message || '识别失败';
      state.importState.manualOpen = true;
      state.importState.manualText = state.importState.manualText || '';
      renderApp({ preserveScroll: true });
      toast('自动识别失败，可以手动粘贴文字', 'info');
    }
  }

  let browserOcrWorkerPromise = null;
  let browserOcrScriptPromise = null;

  function prepareOcrImage(file) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = function () {
        URL.revokeObjectURL(objectUrl);
        const maxSide = 3000;
        const scale = Math.min(2.4, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('浏览器无法处理这张图片，请换 JPG / PNG / WebP 格式'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const preview = canvas.toDataURL('image/png');
        const enhancedCanvas = document.createElement('canvas');
        enhancedCanvas.width = canvas.width;
        enhancedCanvas.height = canvas.height;
        const enhancedContext = enhancedCanvas.getContext('2d');
        if (!enhancedContext) {
          reject(new Error('浏览器无法增强这张图片，请换 JPG / PNG / WebP 格式'));
          return;
        }
        enhancedContext.filter = 'grayscale(1) contrast(1.45) brightness(1.04)';
        enhancedContext.drawImage(canvas, 0, 0);
        const enhanced = enhancedCanvas.toDataURL('image/png');
        enhancedContext.clearRect(0, 0, enhancedCanvas.width, enhancedCanvas.height);
        enhancedContext.filter = 'grayscale(1) contrast(1.9) brightness(1.07)';
        enhancedContext.drawImage(canvas, 0, 0);
        resolve({
          preview: preview,
          normal: preview,
          enhanced: enhanced,
          highContrast: enhancedCanvas.toDataURL('image/png')
        });
      };
      image.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('图片读取失败，请换 JPG / PNG / WebP 格式'));
      };
      image.src = objectUrl;
    });
  }

  function scoreOcrResult(result) {
    const data = result && result.data || {};
    const text = String(data.text || '');
    const usefulChars = (text.match(/[\u3400-\u9fffA-Za-z0-9￥¥%]/g) || []).length;
    const replacementChars = (text.match(/[�□]/g) || []).length;
    return (Number(data.confidence) || 0) + Math.min(usefulChars, 160) * 0.12 - replacementChars * 8;
  }

  function getBrowserOcrWorker() {
    if (!browserOcrWorkerPromise) {
      browserOcrWorkerPromise = loadBrowserOcrEngine().then(function () {
        return window.Tesseract.createWorker('chi_sim+eng', 1, {
          langPath: 'https://tessdata.projectnaptha.com/4.0.0',
          logger: function () {}
        });
      }).catch(function (error) {
        browserOcrWorkerPromise = null;
        throw error;
      });
    }
    return browserOcrWorkerPromise;
  }

  function loadBrowserOcrEngine() {
    if (window.Tesseract && typeof window.Tesseract.createWorker === 'function') return Promise.resolve();
    if (!browserOcrScriptPromise) {
      browserOcrScriptPromise = new Promise(function (resolve, reject) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
        script.async = true;
        script.onload = function () {
          if (window.Tesseract && typeof window.Tesseract.createWorker === 'function') resolve();
          else {
            browserOcrScriptPromise = null;
            reject(new Error('OCR 引擎加载失败，请检查网络后重试'));
          }
        };
        script.onerror = function () {
          browserOcrScriptPromise = null;
          reject(new Error('OCR 引擎加载失败，请检查网络后重试'));
        };
        document.head.appendChild(script);
      });
    }
    return browserOcrScriptPromise;
  }

  function applyImportAnalysisText(rawText, ocrLines, preferredProductId) {
    const analysis = window.DYAnalyzer.analyzeText(rawText, { preferredProductId: preferredProductId || '' });
    state.importState.status = 'done';
    state.importState.stage = 'done';
    state.importState.rawText = rawText;
    state.importState.ocrLines = ocrLines || [];
    state.importState.analysis = analysis;
    state.importState.selectedPointIds = analysis.pointIds.slice();
    state.importState.selectedSceneId = analysis.recommendedSceneId;
    state.importState.selectedPersonaId = analysis.recommendedPersonaId;
    state.importState.error = '';
    renderApp({ preserveScroll: true });
    if (state.page === 'import' && window.innerWidth <= 1000) {
      window.setTimeout(function () {
        const panel = document.querySelector('.import-right');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
    toast(analysis.matched ? '识别完成，已匹配产品与卖点' : '识别完成，可保存为自定义产品', 'spark');
  }

  function reanalyzeImport(preferredProductId) {
    const imp = state.importState;
    if (!imp.rawText) {
      toast('没有可重新分析的文字', 'info');
      return;
    }
    applyImportAnalysisText(imp.rawText, imp.ocrLines, preferredProductId || null);
  }

  function analyzeManualText() {
    const text = state.importState.manualText.trim();
    if (text.replace(/\s/g, '').length < 12) {
      toast('至少粘贴一段产品资料', 'info');
      return;
    }
    state.importState.manualOpen = false;
    applyImportAnalysisText(text, [], null);
  }

  function applyImportResult() {
    const imp = state.importState;
    const analysis = imp.analysis;
    if (!analysis) {
      toast('请先上传并识别产品信息图', 'info');
      return;
    }
    if (!analysis.product && !analysis.customPoints.length) {
      state.importState.status = 'error';
      state.importState.error = '还没有提取到可用卖点。请补充产品名称、卖点和价格，再带入文案工坊。';
      state.importState.manualOpen = true;
      state.importState.manualText = state.importState.manualText || imp.rawText || '';
      renderApp({ preserveScroll: true });
      toast('请先补充至少一条产品卖点', 'info');
      return;
    }
    const selectedPoints = imp.selectedPointIds.slice();
    const sceneId = imp.selectedSceneId || analysis.recommendedSceneId;
    const personaId = imp.selectedPersonaId || analysis.recommendedPersonaId;

    if (analysis.product) {
      state.productId = analysis.productId;
      state.pointIds = selectedPoints.length ? selectedPoints : analysis.pointIds.slice();
      state.sceneId = sceneId;
      state.personaId = personaId;
      state.previewIndex = 0;
      state.seed += 1;
      selectDefaultImages(analysis.product);
      regenerate();
    } else {
      const product = buildCustomProduct(window.DYAnalyzer.buildCustomForm(analysis));
      if (!product.points.length) {
        toast('没有提取到可用卖点，请手动粘贴更完整的产品资料', 'info');
        return;
      }
      state.customProducts.push(product);
      state.products = D.products.concat(state.customProducts);
      writeStore(STORE_CUSTOM, state.customProducts);
      state.productId = product.id;
      state.pointIds = product.points.slice(0, 5).map(function (p) { return p.id; });
      state.sceneId = sceneId;
      state.personaId = personaId;
      state.previewIndex = 0;
      state.seed += 1;
      selectDefaultImages(product);
      regenerate();
    }
    state.page = 'studio';
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('已带入工坊，卖点、场景和语气都配好了', 'spark');
  }

  function importPage() {
    const imp = state.importState;
    return '' +
      '<div class="page-head import-head">' +
        '<div><span class="eyebrow">SMART PRODUCT IMPORT</span><h1>识图建档</h1><p>上传产品卖点截图、详情页或海报，自动识别产品、卖点、价格，并推荐适合的场景、语气和人群。</p></div>' +
        '<div class="page-head-actions">' +
          '<button class="btn" data-action="toggle-manual">' + icon('pen') + '手动粘贴文字</button>' +
          '<button class="btn btn-primary" data-upload-info>' + icon('upload') + '上传产品信息图</button>' +
        '</div>' +
      '</div>' +
      '<div class="import-layout ' + (imp.status === 'done' || imp.status === 'error' ? 'has-result' : '') + '">' +
        '<div class="import-left">' + importUploadCard(imp) + manualPanel(imp) + '<div class="import-privacy">' + icon('info') + '<span>图片在当前浏览器中识别，不会上传到应用服务器；首次使用会从公共 CDN 下载 OCR 引擎和中文语言包。</span></div></div>' +
        '<div class="import-right">' + importResultPanel(imp) + '</div>' +
      '</div>';
  }

  function importUploadCard(imp) {
    if (!imp.dataUrl) {
      return '' +
        '<div class="import-dropzone" data-info-drop tabindex="0" role="button" aria-label="上传产品信息图">' +
          '<span class="drop-icon">' + icon('scan') + '</span>' +
          '<h2>把产品信息图拖进来</h2>' +
          '<p>产品卖点截图、详情页长图、海报都可以。系统会识别文字，再整理成能直接写文案的产品档案。</p>' +
          '<button class="btn btn-accent" data-upload-info>' + icon('upload') + '选择图片</button>' +
          '<div class="drop-meta"><span>JPG / PNG / WebP</span><i></i><span>单张 ≤ 18MB</span><i></i><span>浏览器中文 OCR</span></div>' +
        '</div>';
    }
    return '' +
      '<div class="info-preview-card">' +
        '<div class="info-preview-head"><span>' + icon('image') + '产品信息图</span><span class="file-name">' + escapeHtml(imp.fileName || '图片') + '</span><button class="link-btn" data-action="clear-import">移除</button></div>' +
        '<div class="info-preview-body">' +
          '<img src="' + escapeHtml(imp.dataUrl) + '" alt="上传的产品信息图">' +
          (imp.status === 'processing' ? '<div class="scan-overlay"><span class="scan-line"></span><span class="scan-label">' + (imp.stage === 'analyze' ? '匹配产品与卖点…' : '读取图片文字…') + '</span></div>' : '') +
        '</div>' +
        '<div class="info-preview-foot"><span class="status-dot-inline ' + (imp.status === 'error' ? 'error' : '') + '"><i></i>' + (imp.status === 'processing' ? '正在识别' : imp.status === 'error' ? '识别失败' : '识别完成') + '</span><button class="btn btn-sm" data-upload-info>' + icon('refresh') + '重新上传</button></div>' +
      '</div>';
  }

  function manualPanel(imp) {
    if (!imp.manualOpen) {
      return '<button class="manual-toggle" data-action="toggle-manual">' + icon('pen') + '<span>没有清晰图片？手动粘贴产品文字</span>' + icon('arrow') + '</button>';
    }
    return '' +
      '<div class="manual-panel">' +
        '<div class="manual-head"><strong>手动粘贴产品资料</strong><button class="link-btn" data-action="toggle-manual">收起</button></div>' +
        '<p>把产品名称、卖点、价格、规格粘贴进来，同样会自动匹配产品、场景与人群。</p>' +
        '<textarea data-manual-text maxlength="6000" placeholder="例如：&#10;黑猪肉梅干菜馅饼&#10;黑猪肉含量≥27%，梅干菜≥3%&#10;无需解冻，空气炸锅200℃10分钟&#10;两袋39.9起，四袋再减10元">' + escapeHtml(imp.manualText || '') + '</textarea>' +
        '<div class="manual-actions"><button class="link-btn" data-action="fill-import-sample">填入示例文字</button><button class="btn btn-sm btn-primary" data-action="analyze-manual">分析这段文字' + icon('arrow') + '</button></div>' +
      '</div>';
  }

  function importResultPanel(imp) {
    if (imp.status === 'idle') return importEmptyPanel();
    if (imp.status === 'processing') return importLoadingPanel(imp);
    if (imp.status === 'error') return importErrorPanel(imp);
    if (!imp.analysis) return importEmptyPanel();
    return importAnalysisPanel(imp.analysis, imp);
  }

  function importEmptyPanel() {
    return '' +
      '<div class="import-empty-panel">' +
        '<span class="empty-panel-icon">' + icon('scan') + '</span>' +
        '<span class="eyebrow">WHAT YOU GET</span>' +
        '<h2>一张图，整理出四件事</h2>' +
        '<p>不用再对着卖点截图手动抄。识别完成后，你只需要核对并选择。</p>' +
        '<div class="extract-grid">' +
          '<div><span class="extract-no">01</span><strong>产品匹配</strong><p>匹配已有产品，或者自动提取名称和价格</p></div>' +
          '<div><span class="extract-no">02</span><strong>卖点提炼</strong><p>从文字中挑出可以写进朋友圈的卖点</p></div>' +
          '<div><span class="extract-no">03</span><strong>场景推荐</strong><p>早餐、送礼、办公室……哪个场景更合适</p></div>' +
          '<div><span class="extract-no">04</span><strong>人群与语气</strong><p>宝妈、上班族、送礼人群，对应不同说话方式</p></div>' +
        '</div>' +
        '<div class="import-example-note">' + icon('spark') + '<span>例：上传一张「陈皮豆沙月饼卖点」截图，会自动推荐「中秋送礼 · 送礼人群 · 克制高级」。</span></div>' +
      '</div>';
  }

  function importLoadingPanel(imp) {
    return '' +
      '<div class="import-loading-panel">' +
        '<div class="loading-orbit"><span>' + icon('scan') + '</span></div>' +
        '<span class="eyebrow">READING YOUR IMAGE</span>' +
        '<h2>' + (imp.stage === 'analyze' ? '正在匹配产品与卖点…' : imp.stage === 'enhance' ? '文字较模糊，正在增强图片重试…' : '正在读取图片文字…') + '</h2>' +
        '<p>OCR 正在浏览器中处理。<br>长截图或首次加载语言包时需要多等几秒。</p>' +
        '<div class="loading-steps">' +
          '<span class="done">' + icon('check') + '图片预处理</span>' +
          '<span class="' + (imp.stage === 'analyze' ? 'done' : 'active') + '">' + icon('pen') + '文字识别</span>' +
          '<span class="' + (imp.stage === 'analyze' ? 'active' : '') + '">' + icon('spark') + '产品与卖点分析</span>' +
        '</div>' +
      '</div>';
  }

  function importErrorPanel(imp) {
    return '' +
      '<div class="import-error-panel">' +
        '<span class="error-icon">' + icon('info') + '</span>' +
        '<span class="eyebrow">OCR NEEDS A LITTLE HELP</span>' +
        '<h2>识别结果需要核对</h2>' +
        '<p>' + escapeHtml(imp.error || '图片文字不够清晰，或者浏览器 OCR 引擎未能加载。') + '</p>' +
        '<div class="error-actions">' +
          '<button class="btn btn-primary" data-upload-info>' + icon('upload') + '换一张图片</button>' +
          '<button class="btn" data-action="toggle-manual">' + icon('pen') + '粘贴文字分析</button>' +
        '</div>' +
        '<div class="error-tip">' + icon('info') + '<span>建议使用清晰、无遮挡的产品信息截图；也可以手动粘贴产品资料，效果一样。</span></div>' +
      '</div>';
  }

  function importAnalysisPanel(analysis, imp) {
    const selectedPoints = imp.selectedPointIds || [];
    const product = analysis.product;
    return '' +
      '<div class="analysis-panel">' +
        '<div class="analysis-top">' +
          '<div><span class="eyebrow">ANALYSIS READY</span><h2>' + (analysis.matched ? '已整理成产品档案' : '提取到一份产品资料') + '</h2><p>' + escapeHtml(analysis.summary) + '</p></div>' +
          '<span class="confidence-badge ' + (analysis.confidence === '高' ? 'high' : analysis.confidence === '中' ? 'mid' : 'low') + '">' + escapeHtml(analysis.confidence) + '置信度</span>' +
        '</div>' +
        importProductCard(analysis, product) +
        importPointsSection(analysis, product, selectedPoints) +
        '<section class="analysis-section"><div class="analysis-section-head"><h3>适合的发布场景</h3><span>选一个主场景</span></div><div class="reco-grid">' + analysis.scenes.map(function (scene, i) { return importSceneCard(scene, i, imp.selectedSceneId); }).join('') + '</div></section>' +
        '<section class="analysis-section"><div class="analysis-section-head"><h3>对应的语气与人群</h3><span>选一种说话方式</span></div><div class="reco-grid persona-grid">' + analysis.personas.map(function (persona, i) { return importPersonaCard(persona, i, imp.selectedPersonaId); }).join('') + '</div></section>' +
        '<section class="audience-strip"><div><span class="eyebrow">BEST AUDIENCE</span><strong>这组内容更适合发给</strong></div><div class="audience-tags">' + analysis.audience.map(function (a) { return '<span>' + escapeHtml(a) + '</span>'; }).join('') + '</div></section>' +
        '<div class="import-actions"><div class="import-actions-note">' + icon('spark') + '<span>带入后仍可在工坊里调整卖点和图片。</span></div><button class="btn btn-accent" data-action="apply-import">' + (analysis.matched ? '带入文案工坊' : '保存为自定义产品并写文案') + icon('arrow') + '</button></div>' +
        (imp.rawText ? '<details class="raw-ocr"><summary>查看 OCR 识别原文 <span>' + imp.rawText.replace(/\s/g, '').length + ' 字</span></summary><pre>' + escapeHtml(imp.rawText) + '</pre></details>' : '') +
      '</div>';
  }

  function importProductCard(analysis, product) {
    const image = product ? getProductImage(product) : D.placeholderImage;
    const alternatives = analysis.alternatives || [];
    return '' +
      '<div class="analysis-product-card">' +
        '<div class="analysis-product-media"><img src="' + escapeHtml(image) + '" alt=""><span>' + (product ? '产品库匹配' : '待新建') + '</span></div>' +
        '<div class="analysis-product-body">' +
          '<span class="eyebrow">PRODUCT</span>' +
          '<h3>' + escapeHtml(product ? product.name : analysis.customName) + '</h3>' +
          '<div class="analysis-product-meta"><strong>' + escapeHtml(analysis.price || '价格待补充') + '</strong><span>' + escapeHtml(analysis.spec || '规格待补充') + '</span></div>' +
          (analysis.alternatives && analysis.alternatives.length ? '<div class="alt-products"><span>还识别到</span>' + analysis.alternatives.map(function (alt, i) { return '<button data-import-alt="' + escapeHtml(alt.product.id) + '">' + escapeHtml(alt.product.name) + '</button>'; }).join('') + '</div>' : '') +
        '</div>' +
        '<div class="product-correct"><label for="import-product-select">不是这个？</label><div class="select-wrap"><select id="import-product-select" data-import-product>' +
          '<option value="">自动判断</option>' +
          state.products.filter(function (p) { return !p.custom; }).map(function (p) { return '<option value="' + escapeHtml(p.id) + '"' + (product && product.id === p.id ? ' selected' : '') + '>' + escapeHtml(p.name) + '</option>'; }).join('') +
        '</select>' + icon('chevron-down') + '</div></div>' +
      '</div>';
  }

  function importPointsSection(analysis, product, selectedPoints) {
    if (!product) {
      return '<section class="analysis-section"><div class="analysis-section-head"><h3>提取到的卖点</h3><span>将用于创建自定义产品</span></div><div class="custom-point-list">' + (analysis.customPoints.length ? analysis.customPoints.map(function (point) { return '<div>' + icon('check') + '<span>' + escapeHtml(point) + '</span></div>'; }).join('') : '<p class="muted">没有提取到明确卖点，建议手动补充。</p>') + '</div></section>';
    }
    return '' +
      '<section class="analysis-section">' +
        '<div class="analysis-section-head"><h3>提炼到的卖点</h3><span>已选 ' + selectedPoints.length + ' / 5，点击调整</span></div>' +
        '<div class="import-point-grid">' +
          product.points.map(function (point) {
            const active = selectedPoints.indexOf(point.id) !== -1;
            const disabled = !active && selectedPoints.length >= 5;
            return '<button class="import-point ' + (active ? 'active' : '') + '" data-import-point="' + escapeHtml(point.id) + '"' + (disabled ? ' disabled' : '') + '><span class="point-check">' + icon('check') + '</span><span><strong>' + escapeHtml(point.label) + '</strong><small>' + escapeHtml(point.short) + '</small></span></button>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  function importSceneCard(scene, index, selectedId) {
    const active = scene.id === selectedId;
    const ranks = ['首选', '次选', '备选'];
    return '' +
      '<button class="reco-card ' + (active ? 'active' : '') + '" data-import-scene="' + escapeHtml(scene.id) + '" aria-pressed="' + active + '">' +
        '<div class="reco-card-top"><strong>' + escapeHtml(scene.label) + '</strong><span>' + ranks[index] + '</span></div>' +
        '<div class="reco-audience">适合：' + escapeHtml(scene.audience) + '</div>' +
        '<p>' + escapeHtml(scene.reason) + '</p>' +
      '</button>';
  }

  function importPersonaCard(persona, index, selectedId) {
    const active = persona.id === selectedId;
    const ranks = ['首选', '次选', '备选'];
    return '' +
      '<button class="reco-card ' + (active ? 'active' : '') + '" data-import-persona="' + escapeHtml(persona.id) + '" aria-pressed="' + active + '">' +
        '<div class="reco-card-top"><strong>' + escapeHtml(persona.label) + '</strong><span>' + ranks[index] + '</span></div>' +
        '<div class="reco-audience">人群：' + escapeHtml(persona.audience) + '</div>' +
        '<p>' + escapeHtml(persona.reason) + '</p>' +
      '</button>';
  }

  /* ---------------- render: products ---------------- */
  function productsPage() {
    return '' +
      '<div class="page-head">' +
        '<div><span class="eyebrow">PRODUCT LIBRARY</span><h1>产品库</h1><p>产品资料来自群聊截图整理。每款产品都预设了卖点、场景和价格文案，点一下就能带进工坊。</p></div>' +
        '<div class="page-head-actions"><button class="btn btn-primary" data-action="open-custom">' + icon('plus') + '添加自定义产品</button></div>' +
      '</div>' +
      '<div class="product-library">' +
        state.products.map(function (p) { return productLibraryCard(p); }).join('') +
        '<button class="library-custom" data-action="open-custom">' +
          '<span class="plus-circle">' + icon('plus') + '</span>' +
          '<span class="library-custom-title">添加自己的产品</span><span class="library-custom-desc">名称、价格、卖点，填完就能生成</span>' +
        '</button>' +
      '</div>' +
      '<div class="product-footnote">' + icon('info') + '自定义产品保存在本机浏览器，不会上传服务器。产品资料来自截图，发布前请按实际包装核对。</div>';
  }

  function productLibraryCard(product) {
    const tags = product.points.slice(0, 3);
    return '' +
      '<article class="library-card">' +
        '<div class="library-media"><span class="tag">' + escapeHtml(product.tag) + '</span><img src="' + escapeHtml(getProductImage(product)) + '" alt="' + escapeHtml(product.name) + '" loading="lazy"></div>' +
        '<div class="library-body">' +
          '<span class="eyebrow">' + escapeHtml(product.category) + '</span>' +
          '<h3>' + escapeHtml(product.name) + '</h3>' +
          '<p class="library-headline">' + escapeHtml(product.headline) + '</p>' +
          '<div class="library-points">' + tags.map(function (p) { return '<span>' + escapeHtml(p.label) + '</span>'; }).join('') + '</div>' +
          '<div class="library-bottom">' +
            '<div><div class="library-price"><strong>' + escapeHtml(product.price) + '</strong><small>' + escapeHtml(product.priceNote || '') + '</small></div><div class="library-spec">' + escapeHtml(product.spec || '') + '</div></div>' +
            '<div class="library-actions">' +
              (product.custom ? '<button class="btn btn-sm btn-ghost" data-delete-product="' + escapeHtml(product.id) + '" title="删除自定义产品" aria-label="删除">' + icon('trash') + '</button>' : '') +
              '<button class="btn btn-sm btn-primary" data-use-product="' + escapeHtml(product.id) + '">用它写文案' + icon('arrow') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ---------------- render: materials ---------------- */
  function materialsPage() {
    const productCount = state.materials.filter(function (m) { return m.category === 'product'; }).length;
    const sellerCount = state.materials.filter(function (m) { return m.category === 'seller'; }).length;
    const uploadCount = state.materials.filter(function (m) { return !m.isSample; }).length;
    const filtered = state.materials.filter(function (m) {
      return state.materialTab === 'all' || m.category === state.materialTab;
    }).sort(function (a, b) {
      if (a.isSample === b.isSample) return 0;
      return a.isSample ? 1 : -1;
    });
    return '' +
      '<div class="page-head">' +
        '<div><span class="eyebrow">MATERIAL LIBRARY</span><h1>素材库</h1><p>产品图和卖家秀都放在这里。点击素材即可加入或移出本次朋友圈配图，最多 9 张。</p></div>' +
        '<div class="page-head-actions">' +
          '<button class="btn" data-upload="product">' + icon('upload') + '上传产品图</button>' +
          '<button class="btn btn-primary" data-upload="seller">' + icon('upload') + '上传卖家秀</button>' +
        '</div>' +
      '</div>' +
      '<div class="material-summary">' +
        '<div><strong>' + productCount + '</strong><span>产品图</span></div>' +
        '<div><strong>' + sellerCount + '</strong><span>卖家秀</span></div>' +
        '<div><strong>' + uploadCount + '</strong><span>本地上传</span></div>' +
        '<div><strong>' + state.selectedImageIds.length + '</strong><span>本次已选</span></div>' +
      '</div>' +
      '<div class="material-upload-row">' +
        '<button class="upload-card" data-upload="product" data-drop="product">' +
          '<span class="upload-icon">' + icon('package') + '</span>' +
          '<span class="upload-copy"><strong class="upload-title">产品图</strong><span class="upload-desc">包装、产品特写、横截面、细节图</span></span>' +
          '<span class="upload-cta">选择图片</span>' +
        '</button>' +
        '<button class="upload-card" data-upload="seller" data-drop="seller">' +
          '<span class="upload-icon">' + icon('image') + '</span>' +
          '<span class="upload-copy"><strong class="upload-title">卖家秀</strong><span class="upload-desc">早餐桌、家庭餐桌、办公室下午茶、开箱实拍</span></span>' +
          '<span class="upload-cta">选择图片</span>' +
        '</button>' +
      '</div>' +
      '<div class="material-toolbar">' +
        '<div class="material-tabs">' +
          materialTab('all', '全部素材') +
          materialTab('product', '产品图') +
          materialTab('seller', '卖家秀') +
        '</div>' +
        '<p>点击卡片加入配图 · 上传图片仅当前会话有效</p>' +
      '</div>' +
      '<div class="material-grid">' + (filtered.length ? filtered.map(materialCard).join('') : '<div class="material-empty">这个分类还没有素材，上传几张试试。</div>') + '</div>' +
      '<div class="product-footnote">' + icon('info') + '示例素材为原创示意图，可直接用于预览；正式发布前建议替换成你的实拍图。上传图片不会离开本机。</div>';
  }

  function materialTab(key, label) {
    return '<button class="' + (state.materialTab === key ? 'active' : '') + '" data-material-tab="' + key + '">' + label + '</button>';
  }

  function materialCard(m) {
    const selected = state.selectedImageIds.indexOf(m.id) !== -1;
    return '' +
      '<article class="material-card ' + (selected ? 'selected' : '') + '" data-material-id="' + escapeHtml(m.id) + '" tabindex="0" role="button" aria-pressed="' + selected + '" aria-label="' + escapeHtml((selected ? '移出配图：' : '加入配图：') + m.label) + '">' +
        '<div class="material-thumb"><img src="' + escapeHtml(m.src) + '" alt="' + escapeHtml(m.label) + '" loading="lazy"><span class="material-type-tag">' + (m.category === 'product' ? '产品图' : '卖家秀') + '</span><span class="material-check">' + icon('check') + '</span></div>' +
        '<div class="material-body">' +
          '<h4>' + escapeHtml(m.label) + '</h4>' +
          '<p>' + (m.isSample ? '原创示例素材' : '本地上传') + '</p>' +
          '<div class="material-actions">' +
            '<button class="toggle-link" data-material-toggle="' + escapeHtml(m.id) + '">' + (selected ? '移出本次' : '加入本次') + '</button>' +
            (m.isSample ? '<span></span>' : '<button class="delete-link" data-material-delete="' + escapeHtml(m.id) + '">删除</button>') +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ---------------- render: saved ---------------- */
  function savedPage() {
    return '' +
      '<div class="page-head">' +
        '<div><span class="eyebrow">SAVED IDEAS</span><h1>收藏夹</h1><p>把喜欢的文案先存下来，发布前再挑一条。收藏保存在本机浏览器。</p></div>' +
        (state.saved.length ? '<div class="page-head-actions"><button class="btn" data-action="clear-saved">' + icon('trash') + '清空收藏</button></div>' : '') +
      '</div>' +
      (state.saved.length ?
        '<div class="saved-toolbar"><span>共 ' + state.saved.length + ' 条收藏</span><span>最近收藏在前</span></div>' +
        '<div class="saved-grid">' + state.saved.map(savedCard).join('') + '</div>' :
        '<div class="empty-state"><div><div class="empty-icon">' + icon('bookmark') + '</div><h3>还没有收藏的文案</h3><p>在工坊里看到喜欢的句子，点一下卡片右下角的书签，就会出现在这里。</p><button class="btn btn-primary" data-action="go-studio">去写一条' + icon('arrow') + '</button></div></div>');
  }

  function savedCard(item) {
    return '' +
      '<article class="saved-card">' +
        '<div class="saved-head"><div><h3>' + escapeHtml(item.title) + '</h3><div class="saved-meta">' + escapeHtml(item.productName) + ' · ' + formatDateTime(item.createdAt) + '</div></div><span class="copy-chars">' + (item.chars || G.charCount(item.text)) + ' 字</span></div>' +
        '<div class="saved-text">' + formatCopy(item.text) + '</div>' +
        '<div class="saved-foot"><span class="copy-foot-info">' + icon('bookmark') + '已收藏</span><div class="copy-btns"><button class="copy-btn" data-copy-saved="' + escapeHtml(item.id) + '">' + icon('copy') + '<span>复制</span></button><button class="copy-btn icon-only" data-delete-saved="' + escapeHtml(item.id) + '" title="删除收藏" aria-label="删除收藏">' + icon('trash') + '</button></div></div>' +
      '</article>';
  }

  /* ---------------- file inputs ---------------- */
  function ensureFileInputs() {
    if (!productInput) {
      productInput = document.createElement('input');
      productInput.type = 'file';
      productInput.accept = 'image/*';
      productInput.multiple = true;
      productInput.style.display = 'none';
      productInput.addEventListener('change', function () {
        handleFiles(productInput.files, 'product');
        productInput.value = '';
      });
      document.body.appendChild(productInput);
    }
    if (!sellerInput) {
      sellerInput = document.createElement('input');
      sellerInput.type = 'file';
      sellerInput.accept = 'image/*';
      sellerInput.multiple = true;
      sellerInput.style.display = 'none';
      sellerInput.addEventListener('change', function () {
        handleFiles(sellerInput.files, 'seller');
        sellerInput.value = '';
      });
      document.body.appendChild(sellerInput);
    }
    if (!infoInput) {
      infoInput = document.createElement('input');
      infoInput.type = 'file';
      infoInput.accept = 'image/jpeg,image/png,image/webp,image/*';
      infoInput.style.display = 'none';
      infoInput.addEventListener('change', function () {
        if (infoInput.files && infoInput.files[0]) handleInfoFile(infoInput.files[0]);
        infoInput.value = '';
      });
      document.body.appendChild(infoInput);
    }
  }

  function triggerUpload(category) {
    ensureFileInputs();
    if (category === 'product') productInput.click();
    else if (category === 'seller') sellerInput.click();
    else if (category === 'info') infoInput.click();
  }

  function triggerInfoUpload() {
    ensureFileInputs();
    infoInput.click();
  }

  /* ---------------- event delegation ---------------- */
  function handleAction(action) {
    if (action === 'guide') { openModal('guide'); return; }
    if (action === 'open-custom') { openModal('custom'); return; }
    if (action === 'go-materials') { switchPage('materials'); return; }
    if (action === 'go-studio') { switchPage('studio'); return; }
    if (action === 'go-import') { switchPage('import'); return; }
    if (action === 'shuffle') { shuffle(); return; }
    if (action === 'download') { downloadAll(); return; }
    if (action === 'clear-saved') { clearSaved(); return; }
    if (action === 'close-modal') { closeModal(); return; }
    if (action === 'toggle-manual') {
      state.importState.manualOpen = !state.importState.manualOpen;
      renderApp({ preserveScroll: true });
      return;
    }
    if (action === 'clear-import') { resetImport(); return; }
    if (action === 'apply-import') { applyImportResult(); return; }
    if (action === 'analyze-manual') { analyzeManualText(); return; }
    if (action === 'fill-import-sample') {
      state.importState.manualText = sampleInfoText();
      state.importState.manualOpen = true;
      renderApp({ preserveScroll: true });
      return;
    }
  }

  document.addEventListener('click', function (event) {
    const target = event.target;

    if (target.closest('[data-close-modal]')) { closeModal(); return; }
    const overlay = target.closest('[data-overlay]');
    if (overlay && target === overlay) { closeModal(); return; }

    const actionEl = target.closest('[data-action]');
    if (actionEl) {
      event.preventDefault();
      handleAction(actionEl.getAttribute('data-action'));
      return;
    }

    const uploadEl = target.closest('[data-upload]');
    if (uploadEl) { triggerUpload(uploadEl.getAttribute('data-upload')); return; }

    const infoUploadEl = target.closest('[data-upload-info]');
    if (infoUploadEl) { triggerInfoUpload(); return; }

    const infoDropEl = target.closest('[data-info-drop]');
    if (infoDropEl) { triggerInfoUpload(); return; }

    const navEl = target.closest('[data-nav]');
    if (navEl) { switchPage(navEl.getAttribute('data-nav')); return; }

    const altProductEl = target.closest('[data-import-alt]');
    if (altProductEl) { reanalyzeImport(altProductEl.getAttribute('data-import-alt')); return; }

    const importPointEl = target.closest('[data-import-point]');
    if (importPointEl) {
      const id = importPointEl.getAttribute('data-import-point');
      const list = state.importState.selectedPointIds;
      if (list.indexOf(id) !== -1) {
        if (list.length <= 1) { toast('至少保留 1 个卖点', 'info'); return; }
        state.importState.selectedPointIds = list.filter(function (x) { return x !== id; });
      } else {
        if (list.length >= 5) { toast('最多选择 5 个卖点', 'info'); return; }
        state.importState.selectedPointIds = list.concat(id);
      }
      renderApp({ preserveScroll: true });
      return;
    }

    const importSceneEl = target.closest('[data-import-scene]');
    if (importSceneEl) {
      state.importState.selectedSceneId = importSceneEl.getAttribute('data-import-scene');
      renderApp({ preserveScroll: true });
      return;
    }

    const importPersonaEl = target.closest('[data-import-persona]');
    if (importPersonaEl) {
      state.importState.selectedPersonaId = importPersonaEl.getAttribute('data-import-persona');
      renderApp({ preserveScroll: true });
      return;
    }

    const useProduct = target.closest('[data-use-product]');
    if (useProduct) {
      applyProduct(useProduct.getAttribute('data-use-product'), { navigate: true });
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast('已带入工坊，开始挑卖点吧', 'spark');
      return;
    }

    const deleteProduct = target.closest('[data-delete-product]');
    if (deleteProduct) { deleteCustomProduct(deleteProduct.getAttribute('data-delete-product')); return; }

    const productOpt = target.closest('[data-product-id]');
    if (productOpt) {
      const id = productOpt.getAttribute('data-product-id');
      if (id !== state.productId) {
        applyProduct(id);
        renderApp({ preserveScroll: true });
      }
      return;
    }

    const pointEl = target.closest('[data-point]');
    if (pointEl) { togglePoint(pointEl.getAttribute('data-point')); return; }

    const sceneEl = target.closest('[data-scene]');
    if (sceneEl) { setOption('scene', sceneEl.getAttribute('data-scene')); return; }

    const personaEl = target.closest('[data-persona]');
    if (personaEl) { setOption('persona', personaEl.getAttribute('data-persona')); return; }

    const lengthEl = target.closest('[data-length]');
    if (lengthEl) { setOption('length', lengthEl.getAttribute('data-length')); return; }

    const toggleEl = target.closest('[data-toggle]');
    if (toggleEl) { setOption('toggle', toggleEl.getAttribute('data-toggle')); return; }

    const copyBtn = target.closest('[data-copy-index]');
    if (copyBtn) {
      event.stopPropagation();
      copyVariant(parseInt(copyBtn.getAttribute('data-copy-index'), 10), copyBtn);
      return;
    }

    const saveBtn = target.closest('[data-save-index]');
    if (saveBtn) {
      event.stopPropagation();
      saveVariant(parseInt(saveBtn.getAttribute('data-save-index'), 10));
      return;
    }

    const copySaved = target.closest('[data-copy-saved]');
    if (copySaved) {
      const item = state.saved.find(function (s) { return s.id === copySaved.getAttribute('data-copy-saved'); });
      if (item) copyText(item.text, copySaved);
      return;
    }

    const deleteSavedBtn = target.closest('[data-delete-saved]');
    if (deleteSavedBtn) { deleteSaved(deleteSavedBtn.getAttribute('data-delete-saved')); return; }

    const variantEl = target.closest('[data-variant-index]');
    if (variantEl) {
      state.previewIndex = parseInt(variantEl.getAttribute('data-variant-index'), 10);
      renderApp({ preserveScroll: true });
      return;
    }

    const removeImg = target.closest('[data-remove-image]');
    if (removeImg) {
      event.stopPropagation();
      removeImage(removeImg.getAttribute('data-remove-image'));
      return;
    }

    const coverImg = target.closest('[data-cover-image]');
    if (coverImg) { setCover(coverImg.getAttribute('data-cover-image')); return; }

    const materialTabEl = target.closest('[data-material-tab]');
    if (materialTabEl) {
      state.materialTab = materialTabEl.getAttribute('data-material-tab');
      renderApp({ preserveScroll: true });
      return;
    }

    const materialDelete = target.closest('[data-material-delete]');
    if (materialDelete) {
      event.stopPropagation();
      deleteMaterial(materialDelete.getAttribute('data-material-delete'));
      return;
    }

    const materialToggle = target.closest('[data-material-toggle]');
    if (materialToggle) {
      event.stopPropagation();
      toggleMaterial(materialToggle.getAttribute('data-material-toggle'));
      return;
    }

    const materialCardEl = target.closest('[data-material-id]');
    if (materialCardEl) { toggleMaterial(materialCardEl.getAttribute('data-material-id')); return; }
  });

  document.addEventListener('change', function (event) {
    const target = event.target;
    if (target.matches('[data-cta-select]')) {
      setOption('cta', target.value);
      return;
    }
    if (target.matches('[data-import-product]')) {
      reanalyzeImport(target.value || null);
      return;
    }
    if (target.matches('[data-note]')) {
      state.sellerNote = target.value;
      regenerate();
      renderApp({ preserveScroll: true });
    }
  });

  document.addEventListener('input', function (event) {
    if (event.target.matches('[data-note]')) {
      state.sellerNote = event.target.value;
      const counter = document.querySelector('[data-note-count]');
      if (counter) counter.textContent = state.sellerNote.length + '/80';
    }
    if (event.target.matches('[data-manual-text]')) {
      state.importState.manualText = event.target.value;
    }
  });

  document.addEventListener('keydown', function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && state.page !== 'import') {
      event.preventDefault();
      shuffle();
      return;
    }
    if (event.key === 'Escape' && state.modal) {
      closeModal();
      return;
    }
    const infoDropEl = event.target.closest ? event.target.closest('[data-info-drop]') : null;
    if (infoDropEl && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      triggerInfoUpload();
      return;
    }
    const materialCardEl = event.target.closest ? event.target.closest('[data-material-id]') : null;
    if (materialCardEl && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      toggleMaterial(materialCardEl.getAttribute('data-material-id'));
    }
  });

  document.addEventListener('submit', function (event) {
    if (event.target.id !== 'custom-product-form') return;
    event.preventDefault();
    const form = event.target;
    const nameField = form.querySelector('[name="name"]').closest('.form-field');
    const pointsField = form.querySelector('[name="points"]').closest('.form-field');
    const name = form.querySelector('[name="name"]').value.trim();
    const points = form.querySelector('[name="points"]').value.trim();
    nameField.classList.toggle('invalid', !name);
    pointsField.classList.toggle('invalid', !points);
    if (!name || !points) return;
    saveCustomProduct({
      name: name,
      headline: form.querySelector('[name="headline"]').value,
      price: form.querySelector('[name="price"]').value,
      spec: form.querySelector('[name="spec"]').value,
      points: points
    });
  });

  document.addEventListener('dragover', function (event) {
    const infoZone = event.target.closest('[data-info-drop]');
    if (infoZone) {
      event.preventDefault();
      infoZone.classList.add('dragover');
      return;
    }
    const zone = event.target.closest('[data-drop]');
    if (!zone) return;
    event.preventDefault();
    zone.classList.add('dragover');
  });
  document.addEventListener('dragleave', function (event) {
    const infoZone = event.target.closest('[data-info-drop]');
    if (infoZone) infoZone.classList.remove('dragover');
    const zone = event.target.closest('[data-drop]');
    if (zone) zone.classList.remove('dragover');
  });
  document.addEventListener('drop', function (event) {
    const infoZone = event.target.closest('[data-info-drop]');
    if (infoZone) {
      event.preventDefault();
      infoZone.classList.remove('dragover');
      if (event.dataTransfer.files && event.dataTransfer.files[0]) handleInfoFile(event.dataTransfer.files[0]);
      return;
    }
    const zone = event.target.closest('[data-drop]');
    if (!zone) return;
    event.preventDefault();
    zone.classList.remove('dragover');
    handleFiles(event.dataTransfer.files, zone.getAttribute('data-drop'));
  });

  /* ---------------- boot ---------------- */
  function init() {
    const custom = readStore(STORE_CUSTOM, []);
    const saved = readStore(STORE_SAVED, []);
    state.customProducts = Array.isArray(custom) ? custom.filter(function (p) { return p && p.custom && p.id && p.name; }) : [];
    state.saved = Array.isArray(saved) ? saved.filter(function (s) { return s && s.id && s.text; }) : [];
    state.products = D.products.concat(state.customProducts);
    state.materials = D.samples.map(function (s) { return Object.assign({}, s); });
    ensureFileInputs();
    applyProduct(state.products[0].id);
    state.page = 'studio';
    renderApp();
  }

  init();
})();
