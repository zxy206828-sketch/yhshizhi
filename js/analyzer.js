/* 产品信息图识别结果分析器
 * 输入 OCR 文字 / 手动粘贴的产品资料，输出：匹配产品、卖点、价格、推荐场景、语气与人群。
 * 纯前端规则引擎，不依赖外部接口；容易按自己的品类扩展关键词。
 */
(function () {
  'use strict';

  const D = window.DYData;

  const sceneAudience = {
    breakfast: '上班族 · 学生党 · 宝妈',
    afterwork: '独居青年 · 下班族 · 一人食',
    family: '宝妈 · 有孩家庭 · 家庭采购',
    stock: '囤货党 · 忙碌家庭',
    friends: '朋友聚会 · 分享型用户',
    craving: '夜宵党 · 追剧人群 · 重口味',
    midautumn: '中秋送礼 · 企业采购',
    office: '白领 · 办公室下午茶',
    familyMoon: '长辈 · 家庭分享',
    gift: '走亲访友 · 送礼人群',
    teatime: '独居青年 · 茶饮爱好者',
    daily: '日常分享 · 泛人群',
    customFamily: '家人 · 家庭分享',
    customGift: '送礼人群 · 走亲访友'
  };

  const personaAudience = {
    owner: '老客 · 信任型买家',
    mom: '宝妈 · 有孩家庭',
    foodie: '尝鲜党 · 重口味人群',
    minimal: '送礼人群 · 品质敏感型',
    funny: '年轻朋友 · 轻松社交'
  };

  const sceneRules = {
    breakfast: ['早餐', '多睡', '空气炸锅', '洗脸', '早上', '孩子上学', '十分钟'],
    afterwork: ['下班', '不想开火', '平底锅', '一个人', '快手', '累'],
    family: ['孩子', '宝妈', '家庭', '一家人', '主动吃', '餐桌', '挑食'],
    stock: ['囤', '冰箱', '四袋', '一个月', '库存', '冷冻'],
    friends: ['朋友', '分享', '聚会', '端上桌', '客人'],
    craving: ['追剧', '夜', '嘴馋', '麻辣', '香味', '深更'],
    midautumn: ['中秋', '月饼', '团圆', '节日', '中秋送礼'],
    office: ['办公室', '下午', '同事', '下午茶', '开会'],
    familyMoon: ['家人', '长辈', '父母', '喝茶', '茶几'],
    gift: ['送礼', '礼盒', '走亲', '伴手礼', '体面', '送礼不突兀'],
    teatime: ['茶', '下午茶', '独处', '慢下来', '茶点'],
    daily: ['日常', '分享', '最近', '随手拍'],
    customFamily: ['孩子', '家人', '家庭', '爸妈'],
    customGift: ['送礼', '礼物', '礼盒', '包装']
  };

  const personaRules = {
    owner: ['自家', '壹号', '店里', '我们', '主理人', '自己出', '自营'],
    mom: ['孩子', '宝妈', '小孩', '家庭', '家人', '主动吃', '挑食'],
    foodie: ['好吃', '鲜香', '麻辣', '掰开', '口感', '噱头', '尝', '越吃越香'],
    minimal: ['礼盒', '中秋', '铁盒', '低调', '送礼', '品质', '高级', '鎏金'],
    funny: ['救星', '干仗', '懒', '不想开火', '居然', '真香', '一口', '没刹住']
  };

  const personaReasons = {
    owner: '图中出现「自家 / 壹号」等主理人口吻',
    mom: '图中出现「孩子 / 宝妈 / 家庭」等关键词',
    foodie: '图中强调「好吃 / 鲜香 / 口感」',
    minimal: '图中强调「礼盒 / 中秋 / 品质」',
    funny: '适合更轻松、像朋友聊天的语气'
  };

  const productRules = {
    meigancai: {
      must: ['梅干菜', '馅饼'],
      nice: ['黑猪肉', '三蒸三晒', '27', '空气炸锅', '早餐', '皮薄', '酥脆']
    },
    lobster: {
      must: ['小龙虾', '馅饼'],
      nice: ['龙虾仁', '麻辣', '17', '8%', '双料', '虾泥', '香精', '鲜香']
    },
    duopin: {
      must: ['双拼'],
      nice: ['梅干菜', '小龙虾', '两种口味', '两种都', '49.9', '馅饼', '各一半']
    },
    mooncake: {
      must: ['月饼'],
      nice: ['陈皮', '豆沙', '中秋', '礼盒', '铁盒', '鎏金', '50g', '128', '低糖', '御唐府']
    }
  };

  const pointRules = {
    meigancai: {
      pork: ['黑猪肉', '肉含量', '顶配', '≥27', '27%', '自家黑猪'],
      meigancai: ['梅干菜', '三蒸三晒', '咸香', '解腻', '菜香'],
      easy: ['无需解冻', '空气炸锅', '10分钟', '平底锅', '6分钟', '0分钟', '出餐'],
      pack: ['独立包装', '单片', '一袋4片', '不串味', '冰箱随便放'],
      price: ['39.9', '四袋', '减10', '两袋', '少10块', '更优惠'],
      taste: ['皮薄', '酥脆', '掰开', '全是肉', '金黄']
    },
    lobster: {
      pork: ['黑猪肉', '17%', '双料', '25%', '肉香'],
      shrimp: ['龙虾仁', '虾泥', '虾粉', '香精', '整颗', '去壳', '掰开看得见'],
      taste: ['麻辣', '鲜香', '好吃', '口味', '越吃越香'],
      easy: ['无需解冻', '空气炸锅', '10分钟', '平底锅', '6分钟', '0分钟'],
      pack: ['独立包装', '单片', '一袋4片', '不串味', '冰箱'],
      price: ['39.9', '双拼', '49.9', '四袋', '减10']
    },
    duopin: {
      pork: ['双料', '25%', '黑猪肉', '17%', '27%'],
      meigancai: ['梅干菜', '三蒸三晒', '咸香', '解腻'],
      shrimp: ['龙虾仁', '虾泥', '整颗', '去壳', '香精'],
      easy: ['无需解冻', '空气炸锅', '10分钟', '平底锅', '6分钟'],
      pack: ['独立包装', '单片', '一袋4片', '不串味', '冰箱'],
      price: ['双拼', '49.9', '四袋', '减10', '两袋', '39.9']
    },
    mooncake: {
      chenpi: ['陈皮', '红豆沙', '豆沙', '绵密', '解腻', '不齁', '新会'],
      low: ['4.6', '11.6', '低糖', '低油', '糖仅', '脂肪', '清淡'],
      size: ['50g', '8个', '一人一个', '不浪费', '小规格', '50克'],
      box: ['鎏金', '铁盒', '黑金', '低调', '设计', '大气'],
      brand: ['御唐府', '高端系列', '品牌', '品控'],
      share: ['分享装', '办公室', '家里人', '一盒8个', '8个', '性价比']
    }
  };

  const sceneReasons = {
    breakfast: '识别到「早餐 / 空气炸锅 / 多睡」等描述',
    afterwork: '识别到「下班 / 不想开火 / 一人食」等描述',
    family: '识别到「孩子 / 宝妈 / 家庭餐桌」等描述',
    stock: '识别到「囤货 / 冰箱 / 四袋」等描述',
    friends: '识别到「朋友 / 分享 / 聚会」等描述',
    craving: '识别到「麻辣 / 追剧 / 夜宵」等描述',
    midautumn: '识别到「中秋 / 月饼 / 团圆」等描述',
    office: '识别到「办公室 / 下午茶 / 同事」等描述',
    familyMoon: '识别到「家人 / 长辈 / 喝茶」等描述',
    gift: '识别到「送礼 / 礼盒 / 体面」等描述',
    teatime: '识别到「茶 / 独处 / 慢下来」等描述',
    daily: '适合日常分享型内容',
    customFamily: '识别到「家人 / 爸妈 / 家庭」等描述',
    customGift: '识别到「送礼 / 礼盒 / 包装」等描述'
  };

  const OcrFixes = [
    [/黑\s*[犭猎]?\s*者?\s*肉/g, '黑猪肉'],
    [/黑\s*肉/g, '黑猪肉'],
    [/解\s*冫\s*东/g, '解冻'],
    [/冫\s*东/g, '冻'],
    [/[囗口]\s*味/g, '口味'],
    [/一\s*[囗口]/g, '一口'],
    [/0\s*乞/g, '吃'],
    [/馅\s*餅|餡\s*餅|陷\s*饼/g, '馅饼'],
    [/月\s*餅|月\s*餠|目\s*饼/g, '月饼'],
    [/阝\s*东\s*皮/g, '陈皮'],
    [/阝\s*东/g, '陈'],
    [/陈\s*[脾皮]/g, '陈皮'],
    [/龙\s*[虾吓]/g, '龙虾'],
    [/小\s*虾/g, '小龙虾'],
    [/虾\s*[仁人]/g, '虾仁'],
    [/独立\s*主\s*装/g, '独立包装'],
    [/小\s*规\s*袼/g, '小规格'],
    [/鎏\s*金\s*岁\s*目/g, '鎏金岁月'],
    [/褡\s*配/g, '搭配'],
    [/突\s*江/g, '突兀'],
    [/牲\s*价\s*比/g, '性价比'],
    [/中\s*耿/g, '中秋'],
    [/[齄齁]/g, '齁'],
    [/膩/g, '腻'],
    [/1009/g, '100g'],
    [/509/g, '50g'],
    [/冫\s*2\s*[〕】\]]\s*[%％]/g, '27%'],
    [/冫\s*1\s*[〕】\]]\s*[%％]/g, '17%'],
    [/冫\s*8\s*[%％]/g, '8%'],
    [/冫\s*25\s*[%％]/g, '25%'],
    [/冫\s*3\s*[%％]/g, '3%'],
    [/39\s*[·.,]\s*9/g, '39.9'],
    [/49\s*[·.,]\s*9/g, '49.9'],
    [/请\s*勿\s*直\s*接\s*转\s*发/g, ''],
    [/Murmure/gi, ''],
    [/群\s*聊\s*的\s*聊\s*天\s*记\s*录/g, '']
  ];

  function normalize(input) {
    let text = String(input || '').replace(/^\uFEFF/, '');
    text = text.replace(/\r/g, '\n').replace(/\u3000/g, ' ').replace(/\u00a0/g, ' ');
    // 去掉 OCR 在每个汉字之间插入的空格
    for (let i = 0; i < 6; i += 1) {
      text = text.replace(/([\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])/g, '$1');
    }
    text = text.replace(/([\u4e00-\u9fa5])\s+(?=[0-9≥≤<>%])/g, '$1');
    text = text.replace(/([0-9≥≤<>%])\s+(?=[\u4e00-\u9fa5])/g, '$1');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/[：:]\s+/g, '：');
    text = text.replace(/[，,]\s+/g, '，');
    text = text.replace(/[。.]\s+/g, '。');
    OcrFixes.forEach(function (pair) { text = text.replace(pair[0], pair[1]); });
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
  }

  function cleanLines(lines) {
    return (lines || []).map(function (line) { return normalize(line); }).filter(Boolean);
  }

  function countHits(text, tokens) {
    let hits = 0;
    (tokens || []).forEach(function (token) {
      if (token && text.indexOf(token) !== -1) hits += 1;
    });
    return hits;
  }

  function identifyProduct(text) {
    const scores = [];
    D.products.forEach(function (product) {
      const rule = productRules[product.id];
      if (!rule) return;
      let score = 0;
      rule.must.forEach(function (token) { if (text.indexOf(token) !== -1) score += 15; });
      rule.nice.forEach(function (token) { if (text.indexOf(token) !== -1) score += 3; });
      if (product.id === 'duopin' && text.indexOf('梅干菜') !== -1 && text.indexOf('小龙虾') !== -1) score += 25;
      scores.push({ product: product, score: score });
    });
    scores.sort(function (a, b) { return b.score - a.score; });
    return scores;
  }

  function identifyPoints(product, text) {
    const rules = pointRules[product.id] || {};
    const scored = product.points.map(function (point) {
      const tokens = rules[point.id] || [];
      const score = countHits(text, tokens);
      return { point: point, score: score };
    });
    const matched = scored.filter(function (item) { return item.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });
    const selected = [];
    // 产品资料里的核心卖点优先，OCR 漏字时也不会丢主卖点。
    (product.defaultPoints || []).forEach(function (id) {
      const point = product.points.find(function (p) { return p.id === id; });
      if (point && selected.indexOf(point) === -1) selected.push(point);
    });
    matched.forEach(function (item) {
      if (selected.length < 5 && selected.indexOf(item.point) === -1) selected.push(item.point);
    });
    scored.forEach(function (item) {
      if (selected.length < 5 && item.score > 0 && selected.indexOf(item.point) === -1) selected.push(item.point);
    });
    return selected.slice(0, 5);
  }

  function recommendScenes(product, text) {
    const list = (product.sceneIds || []).map(function (id) {
      const scene = product.custom ? D.customScenes[id] : D.sceneLibrary[id];
      if (!scene) return null;
      const tokens = sceneRules[id] || [];
      const hits = tokens.filter(function (token) { return text.indexOf(token) !== -1; });
      return {
        id: id,
        label: scene.label,
        audience: sceneAudience[id] || '日常分享',
        score: 2 + hits.length * 3 + (id === product.defaultScene ? 2 : 0),
        hits: hits,
        reason: hits.length ? sceneReasons[id] || ('识别到「' + hits.slice(0, 2).join('、') + '」') : '产品默认场景，适合大众分享',
        imageTip: scene.imageTip
      };
    }).filter(Boolean);
    list.sort(function (a, b) { return b.score - a.score; });
    return list.slice(0, 3);
  }

  function recommendPersonas(text) {
    const list = D.personas.map(function (persona) {
      const tokens = personaRules[persona.id] || [];
      const hits = tokens.filter(function (token) { return text.indexOf(token) !== -1; });
      return {
        id: persona.id,
        label: persona.label,
        hint: persona.hint,
        audience: personaAudience[persona.id] || '泛人群',
        score: 1 + hits.length * 3,
        hits: hits,
        reason: hits.length ? personaReasons[persona.id] : '通用语气，适合大多数分享'
      };
    });
    list.sort(function (a, b) { return b.score - a.score; });
    return list.slice(0, 3);
  }

  function extractPrice(text, product) {
    if (product) return product.price;
    const matches = text.match(/(?:¥|￥)?\s*(\d{1,4}(?:\.\d{1,2})?)\s*(?:元|块|起|一盒|盒|袋)/g) || [];
    const cleaned = matches.map(function (m) { return m.replace(/\s+/g, ''); });
    return cleaned[0] || '';
  }

  function extractSpec(text, product) {
    if (product && product.spec) return product.spec;
    const matches = text.match(/\d+\s*(?:g|克|片|个|枚|袋|盒)(?:\s*[×xX*]\s*\d+\s*(?:g|克|片|个|枚))?/g) || [];
    return matches.slice(0, 3).join(' · ') || '';
  }

  function extractName(text) {
    const lines = text.split('\n').map(function (line) {
      return line.replace(/^[●•·*\-—\s【】\[\]（）()]+/, '').trim();
    }).filter(Boolean);
    const labelled = lines.map(function (line) {
      return line.replace(/^(?:产品名称|商品名称|品名|产品名)\s*[：:]?\s*/, '').trim();
    }).find(function (line, index) {
      return lines[index] !== line && line.length >= 2 && line.length <= 32 && !/(卖点|核心|价格|规格|群聊|截图)/.test(line);
    });
    if (labelled) return labelled;
    const candidates = lines.map(function (line) {
      return line.replace(/^(?:产品介绍|产品信息|商品介绍|产品卖点)\s*[：:]?\s*/, '').replace(/[：:].*$/, '').trim();
    }).filter(function (line) {
      return line.length >= 2 && line.length <= 28 && /[\u3400-\u9fff]/.test(line) &&
        !/(卖点|核心|口味|包装|价格|转发|群聊|截图|发货|详情|规格|配料表|产品介绍|产品信息)/.test(line);
    });
    if (candidates.length) return candidates[0];
    return '图片识别产品';
  }

  function extractCustomPoints(text) {
    const banned = /(卖点|核心卖点|请勿|转发|群聊|聊天记录|Murmure|扫码|私信|想要的|发货地|发货|物流|快递|运费|地址|电话|客服|售后|保质期|有效期|生产日期|储存|保存|阴凉|包装方式|净含量|食品生产|执行标准|许可证|订单)/;
    const feature = /(手工|现烤|现做|低糖|无糖|无添加|不添加|添加|选用|精选|含量|口感|香|酥|脆|软|糯|馅|芝士|肉|豆沙|扁桃仁|杏仁|坚果|颗粒|独立包装|无需解冻|空气炸锅|烤箱|分钟|冷冻|冷藏|回购|天然|真材实料|层层|新鲜|醇|清甜|回味)/;
    const raw = text.replace(/\n/g, '。').split(/[。；;!?！？，,、]/).map(function (s) {
      return s.replace(/^[●•·*\-—\s【】\[\]（）()]+/, '').replace(/\s+/g, '').trim();
    }).filter(function (s) {
      const chinese = (s.match(/[\u3400-\u9fff]/g) || []).length;
      const latin = (s.match(/[A-Za-z]/g) || []).length;
      return s.length >= 4 && s.length <= 58 && chinese >= 4 && latin <= 2 && !banned.test(s) && feature.test(s);
    });
    const unique = [];
    raw.forEach(function (line) {
      if (unique.indexOf(line) === -1) unique.push(line);
    });
    return unique.slice(0, 5).map(polishCustomPoint);
  }

  function polishCustomPoint(source) {
    const text = String(source || '').replace(/[，,、；;。]+$/g, '').trim();
    if (/(空气炸锅|烤箱|平底锅|蒸锅|微波炉|无需解冻|分钟|加热)/.test(text)) {
      return '吃法简单：' + text + '，照着说明加热就能享用。';
    }
    if (/(独立包装|单片包装|小包装)/.test(text)) {
      return '独立分装：' + text + '，取用更方便。';
    }
    if (/(手工|现烤|现做|制作|工艺)/.test(text)) {
      return '制作有讲究：' + text + '。';
    }
    if (/(黑猪肉|猪肉|小龙虾|龙虾|虾仁|梅干菜|豆沙|陈皮|扁桃仁|杏仁|腰果|核桃|芝士|奶酪|配料|用料|含量)/.test(text)) {
      return '用料亮点：' + text + '。';
    }
    if (/(酥|脆|软|糯|绵密|鲜香|清甜|醇|多汁|爆汁|香)/.test(text)) {
      return '口感亮点：' + text + '。';
    }
    return '产品亮点：' + text + '。';
  }

  function analyzeText(rawText, options) {
    const opts = options || {};
    const normalized = normalize(rawText);
    const lines = cleanLines(normalized.split('\n'));
    const text = normalized.replace(/\n/g, ' ');
    const productScores = identifyProduct(text);
    const best = productScores[0] || null;
    const preferred = opts.preferredProductId
      ? D.products.find(function (p) { return p.id === opts.preferredProductId; })
      : null;
    const matched = !!(preferred || (best && best.score >= 20));
    const product = preferred || (matched ? best.product : null);
    const extractedName = extractName(normalized);
    const points = product ? identifyPoints(product, text) : [];
    const customPoints = product ? [] : extractCustomPoints(normalized);
    const scenes = recommendScenes(product || {
      id: 'custom',
      custom: true,
      sceneIds: ['daily', 'customFamily', 'customGift'],
      defaultScene: 'daily'
    }, text);
    const personas = recommendPersonas(text);
    const confidence = preferred ? '手动选择' : !best ? '低' : best.score >= 38 ? '高' : best.score >= 20 ? '中' : '低';
    const alternatives = productScores.filter(function (x) {
      return x.score > 0 && (!product || x.product.id !== product.id);
    }).slice(0, 3);

    return {
      rawText: String(rawText || ''),
      normalizedText: normalized,
      lines: lines,
      matched: matched,
      product: product,
      productId: product ? product.id : null,
      productName: product ? product.name : extractedName,
      confidence: confidence,
      score: preferred ? 99 : (best ? best.score : 0),
      alternatives: alternatives,
      price: extractPrice(text, null) || (product ? product.price : ''),
      spec: extractSpec(text, null) || (product ? product.spec : ''),
      points: product ? points : [],
      pointIds: product ? points.map(function (p) { return p.id; }) : [],
      customPoints: customPoints,
      customHeadline: customPoints[0] || (product ? product.headline : ''),
      customName: extractedName,
      scenes: scenes,
      personas: personas,
      recommendedSceneId: scenes[0] ? scenes[0].id : 'daily',
      recommendedPersonaId: personas[0] ? personas[0].id : 'owner',
      audience: uniqueAudiences(scenes, personas),
      summary: product
        ? (preferred ? '已切换为手动选择的「' + product.name + '」，卖点与场景已重新匹配。' : '匹配到产品库中的「' + product.name + '」，已根据图片文字匹配 ' + points.length + ' 个卖点。')
        : (customPoints.length
          ? '没有匹配到产品库，已将识别内容整理润色为 ' + customPoints.length + ' 条卖点文案，可核对后用于生成。'
          : '没有匹配到产品库，也没有提取到明确卖点。请核对识别原文或手动补充产品资料。')
    };
  }

  function uniqueAudiences(scenes, personas) {
    const result = [];
    scenes.forEach(function (scene) {
      scene.audience.split('·').forEach(function (a) {
        const v = a.trim();
        if (v && result.indexOf(v) === -1) result.push(v);
      });
    });
    personas.slice(0, 2).forEach(function (persona) {
      persona.audience.split('·').forEach(function (a) {
        const v = a.trim();
        if (v && result.indexOf(v) === -1) result.push(v);
      });
    });
    return result.slice(0, 6);
  }

  function buildCustomForm(analysis) {
    return {
      name: analysis.customName || '图片识别产品',
      headline: analysis.customHeadline || '',
      price: analysis.price || '',
      spec: analysis.spec || '',
      points: (analysis.customPoints || []).join('\n')
    };
  }

  window.DYAnalyzer = {
    normalize: normalize,
    analyzeText: analyzeText,
    buildCustomForm: buildCustomForm,
    sceneAudience: sceneAudience,
    personaAudience: personaAudience
  };
})();
