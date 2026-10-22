/* 本地文案引擎：基于产品资料、卖点、场景、人设与长度，组合出可直接发布的朋友圈文案。
 * 不调用任何外部接口，刷新也不会丢失用户自己添加的产品（产品库另行持久化）。
 */
(function () {
  'use strict';

  const D = window.DYData;

  const lengthConfig = {
    short: { proofCount: 1, sensory: false, context: false, persona: false, trust: false, bullet: false },
    standard: { proofCount: 2, sensory: true, context: false, persona: true, trust: false, bullet: false },
    long: { proofCount: 3, sensory: true, context: true, persona: true, trust: true, bullet: false }
  };

  function pick(list, seed) {
    if (!list || !list.length) return '';
    const i = Math.abs(Math.floor(seed)) % list.length;
    return list[i];
  }

  function unique(list) {
    return Array.from(new Set(list.filter(Boolean)));
  }

  function ensurePeriod(text) {
    const s = String(text || '').trim();
    if (!s) return '';
    if (/[。！？!?…”’」』]$/.test(s)) return s;
    return s + '。';
  }

  function normalizeNote(note) {
    const s = String(note || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    return ensurePeriod(s);
  }

  function getScene(product, sceneId) {
    if (D.sceneLibrary[sceneId] && product.sceneIds.indexOf(sceneId) !== -1) return D.sceneLibrary[sceneId];
    if (product.custom) {
      const custom = D.customScenes[sceneId] || D.customScenes.daily;
      return custom;
    }
    return D.sceneLibrary[product.defaultScene] || D.sceneLibrary.breakfast;
  }

  function getPoints(product, pointIds) {
    const selected = (pointIds || []).map(function (id) {
      return product.points.find(function (p) { return p.id === id; });
    }).filter(Boolean);
    return selected.length ? selected : product.points.slice(0, 3);
  }

  function getPersona(id) {
    return D.personas.find(function (p) { return p.id === id; }) || D.personas[0];
  }

  function getCta(id) {
    return D.ctas.find(function (c) { return c.id === id; }) || D.ctas[0];
  }

  function addEmoji(line, emoji) {
    if (!line || !emoji) return line;
    if (/[：:]$/.test(line)) return line;
    const m = line.match(/([。！？!?])$/);
    if (m) return line.slice(0, -1) + emoji + m[1];
    return line + emoji;
  }

  function angleScene(ctx) {
    const lines = [];
    lines.push(ctx.sceneOpener);
    if (ctx.cfg.context) lines.push(ctx.context);
    if (ctx.cfg.sensory) lines.push(ctx.sensory);
    lines.push.apply(lines, ctx.proofs(ctx.cfg.proofCount, ctx.length.id === 'short'));
    if (ctx.cfg.trust) lines.push(ctx.trust);
    lines.push(ctx.finalPitch);
    return lines;
  }

  function angleSeller(ctx) {
    const lines = [ctx.scene.sellerHook];
    if (ctx.note) lines.push(ctx.note);
    if (ctx.length.id !== 'short') lines.push(ctx.sellerLine);
    if (ctx.cfg.sensory) lines.push(ctx.sensory);
    lines.push.apply(lines, ctx.proofs(Math.max(1, ctx.cfg.proofCount - 1), ctx.length.id === 'short'));
    lines.push(ctx.finalPitch);
    return lines;
  }

  function angleValue(ctx) {
    const lines = [];
    const lead = ctx.product.productType === 'mooncake'
      ? '这盒月饼，几个实在信息放一起：'
      : '这款的几个实在信息，给你列清楚：';
    lines.push(lead);
    const proofList = ctx.proofs(ctx.cfg.proofCount + 1, true);
    proofList.forEach(function (line) { lines.push('· ' + line); });
    if (ctx.cfg.trust) lines.push(ctx.trust);
    if (ctx.cfg.context) lines.push(ctx.context);
    lines.push(ctx.finalPitch);
    return lines;
  }

  function anglePrice(ctx) {
    const lines = [];
    if (ctx.actionPrice) {
      lines.push('价格和规格写在这儿：' + ctx.actionPrice);
    } else {
      lines.push('先说说这款的口感和吃法：');
    }
    if (ctx.cfg.sensory) lines.push(ctx.sensory);
    lines.push.apply(lines, ctx.proofs(1));
    if (ctx.cfg.context) lines.push(ctx.context);
    if (ctx.cta) lines.push(ctx.cta);
    return lines;
  }

  function angleShort(ctx) {
    const lines = [ctx.scene.shortHook];
    lines.push(ctx.proofs(1, true)[0]);
    const pitch = [ctx.price, ctx.cta].filter(Boolean).join('');
    if (pitch) lines.push(pitch);
    return lines;
  }

  function angleStory(ctx) {
    const lines = [ctx.personaOpener];
    lines.push(ctx.sceneOpener);
    if (ctx.cfg.context) lines.push(ctx.context);
    if (ctx.cfg.sensory) lines.push(ctx.sensory);
    lines.push.apply(lines, ctx.proofs(ctx.length.id === 'short' ? 1 : Math.max(2, ctx.cfg.proofCount), ctx.length.id === 'short'));
    if (ctx.cfg.trust) lines.push(ctx.trust);
    lines.push([ctx.finalPitch, ctx.length.id === 'short' ? '' : ctx.personaCloser].filter(Boolean).join(''));
    return lines;
  }

  const angles = [
    { id: 'scene', title: '场景种草', note: '从发布场景切入', build: angleScene },
    { id: 'seller', title: '卖家秀', note: '像顺手拍完发的', build: angleSeller },
    { id: 'value', title: '卖点直给', note: '适合配九宫格', build: angleValue },
    { id: 'price', title: '价格行动', note: '把优惠说清楚', build: anglePrice },
    { id: 'short', title: '短句安利', note: '一眼看完', build: angleShort },
    { id: 'story', title: '走心日常', note: '像真实生活记录', build: angleStory }
  ];

  function buildContext(product, options, seed) {
    const length = D.lengths.find(function (l) { return l.id === options.length; }) || D.lengths[1];
    const cfg = Object.assign({}, lengthConfig[length.id] || lengthConfig.standard);
    const scene = getScene(product, options.sceneId);
    const points = getPoints(product, options.pointIds);
    const persona = getPersona(options.personaId);
    const ctaObj = getCta(options.ctaId);
    const emojiEnabled = options.emoji !== false;
    const priceEnabled = options.price !== false;
    const ctaEnabled = options.cta !== false;
    const hashtagsEnabled = options.hashtags !== false;

    const sceneEmoji = scene.emoji || '✨';
    const productEmoji = pick(product.emojis || ['✨'], seed + 2);
    const sceneOpener = pick(scene.openers, seed + 8);

    const sensory = product.voice && product.voice.sensory
      ? pick(product.voice.sensory, seed + 1)
      : '用料实在，吃起来能尝出区别。';
    const context = product.voice && product.voice.context
      ? pick(product.voice.context, seed + 3)
      : '好食材不一定会说话，但吃进嘴里就知道。';
    const trust = product.voice && product.voice.trust
      ? product.voice.trust
      : '用料和细节都摆在这里。';
    const sellerLine = product.voice && product.voice.sellerLines
      ? pick(product.voice.sellerLines, seed + 4)
      : '随手拍的，没有摆盘。';
    const personaOpener = pick(persona.openers, seed + 5);
    const personaCloser = pick(persona.closers, seed + 6);

    const price = product.priceLines
      ? (length.id === 'short'
        ? product.priceLines.short
        : length.id === 'long'
          ? pick([product.priceLines.standard, product.priceLines.action], seed + 2)
          : pick([product.priceLines.short, product.priceLines.standard], seed + 2))
      : product.price;
    const actionPrice = product.priceLines ? pick([
      product.priceLines.action,
      product.priceLines.standard,
      product.priceLines.short
    ], seed + 7) : product.price;
    const cta = ctaEnabled ? ctaObj.text : '';

    function proofs(count, short) {
      if (!points.length) return [];
      const result = [];
      for (let i = 0; i < Math.min(count, points.length); i += 1) {
        const p = points[(seed + i) % points.length];
        result.push(short ? p.short : p.copy);
      }
      return result;
    }

    const priceForPitch = priceEnabled ? price : '';
    const finalPitch = [priceForPitch, cta].filter(Boolean).join('');

    return {
      product: product,
      scene: scene,
      sceneOpener: sceneOpener,
      persona: persona,
      personaOpener: personaOpener,
      personaCloser: personaCloser,
      length: length,
      cfg: cfg,
      points: points,
      sensory: sensory,
      context: context,
      trust: trust,
      sellerLine: sellerLine,
      note: normalizeNote(options.sellerNote),
      price: priceForPitch,
      actionPrice: priceEnabled ? actionPrice : '',
      cta: cta,
      finalPitch: finalPitch || personaCloser,
      proofs: proofs,
      emojiEnabled: emojiEnabled,
      sceneEmoji: sceneEmoji,
      productEmoji: productEmoji,
      hashtagsEnabled: hashtagsEnabled
    };
  }

  function finishVariant(lines, ctx, angleIndex) {
    let clean = lines
      .filter(function (line) { return line && String(line).trim(); })
      .map(function (line) { return ensurePeriod(line); });

    // 标题句（“把卖点摊开说：”）不需要句号，单独还原
    clean = clean.map(function (line) {
      if (/[：:]$/.test(line.replace(/。$/, ''))) return line.replace(/。$/, '');
      return line;
    });

    if (ctx.emojiEnabled) {
      if (clean[0]) clean[0] = addEmoji(clean[0], ctx.sceneEmoji);
      if (clean.length > 2 && angleIndex !== 4) {
        clean[clean.length - 1] = addEmoji(clean[clean.length - 1], ctx.productEmoji);
      }
    }

    let text = clean.join('\n\n');
    if (ctx.hashtagsEnabled) {
      const tags = unique([
        pick(ctx.scene.hashtags, angleIndex),
        pick(ctx.product.hashtags, angleIndex + 2),
        pick(ctx.product.hashtags, angleIndex + 3)
      ]).slice(0, 3);
      if (tags.length) text += '\n\n' + tags.slice(0, 2).join(' ');
    }
    return text;
  }

  function charCount(text) {
    return String(text || '').replace(/\s/g, '').length;
  }

  function generate(product, options) {
    if (!product) return [];
    const seed = Math.abs(parseInt(options.seed, 10) || 0);
    const results = angles.map(function (angle, index) {
      const localSeed = seed + index * 7;
      const ctx = buildContext(product, options, localSeed);
      const lines = angle.build(ctx);
      const text = finishVariant(lines, ctx, index);
      return {
        id: angle.id + '-' + (seed + index),
        angle: angle.id,
        title: angle.title,
        note: angle.note,
        text: text,
        chars: charCount(text),
        angleIndex: index
      };
    });
    return results;
  }

  window.DYGenerator = {
    generate: generate,
    charCount: charCount
  };
})();
