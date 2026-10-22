/* 壹号食志 · 朋友圈文案工坊
 * 产品资料均来自群聊截图中的卖点与价格，未额外编造功效。
 * 文案引擎在浏览器本地运行，不依赖网络。
 */
(function () {
  'use strict';

  const sceneLibrary = {
    breakfast: {
      id: 'breakfast',
      label: '早餐救星',
      emoji: '🌤',
      tagline: '早晨赶时间，也能吃口热的',
      openers: [
        '早上赶时间时，提前备好早餐会从容一些。',
        '空气炸锅 200℃ 10 分钟，趁这会儿可以准备饮品和餐具。',
        '早餐不知道吃什么时，可以把冷冻层里的馅饼拿出来加热。',
        '孩子要上学、大人要上班，早上最缺的就是时间。'
      ],
      sellerHook: '空气炸锅 200℃ 10 分钟，掰开看看馅料，配杯豆浆就是一顿。',
      shortHook: '空气炸锅 200℃ 10 分钟，早餐简单热好。',
      hashtags: ['#早餐灵感', '#快手早餐', '#今天早餐吃什么'],
      imageTip: '首图放掰开的横截面，第二张放早餐桌，第三张放独立包装。'
    },
    afterwork: {
      id: 'afterwork',
      label: '下班快手饭',
      emoji: '🌙',
      tagline: '不想开火，也不想将就',
      openers: [
        '下班回来不想开火，但又不想随便对付一口。',
        '一个人吃饭，最怕折腾半小时、吃只吃五分钟。',
        '累了一天，厨房里能少一步是一步。',
        '到家只想躺下，但胃不同意。'
      ],
      sellerHook: '平底锅煎好配点青菜，简单就是一顿下班后的晚餐。',
      shortHook: '下班不想开火，平底锅煎 6 分钟就是一顿。',
      hashtags: ['#下班吃什么', '#一人食', '#快手晚餐'],
      imageTip: '用平底锅煎制的实拍最有说服力，可以带一点厨房背景。'
    },
    family: {
      id: 'family',
      label: '家庭餐桌',
      emoji: '🏠',
      tagline: '一家人坐下来，热乎乎吃顿饭',
      openers: [
        '家里有孩子之后，早餐真的能省一分钟是一分钟。',
        '家里早餐时间紧，能简单热好、趁热吃上几口就不错。',
        '一家人围在桌边，热乎乎地分着吃，比什么都踏实。',
        '一家人围着桌子分着吃，早餐也能从容一点。'
      ],
      sellerHook: '切开配上鸡蛋和青菜，家常早餐这样搭配很方便。',
      shortHook: '配上鸡蛋和青菜，早餐搭配省心一些。',
      hashtags: ['#家庭餐桌', '#孩子早餐', '#好好吃饭'],
      imageTip: '拍孩子餐盘里的一小块，比拍整袋更有生活感。'
    },
    stock: {
      id: 'stock',
      label: '冰箱囤货',
      emoji: '🧊',
      tagline: '冷冻层备一点，忙时方便取用',
      openers: [
        '冰箱里囤点能随时拿出来吃的东西，日子会从容很多。',
        '冷冻层里备点方便加热的食物，忙起来时能省些时间。',
        '与其每天早上纠结，不如一次性把早餐安排好。',
        '忙起来的时候，冰箱里有没有存货，真的不一样。'
      ],
      sellerHook: '独立包装放进冷冻层，想吃时按需要取用。',
      shortHook: '按需要放进冷冻层，想吃时随手取一份。',
      hashtags: ['#冰箱囤货', '#早餐储备', '#居家必备'],
      imageTip: '拍冰箱抽屉里的独立包装，整齐感很加分。'
    },
    friends: {
      id: 'friends',
      label: '朋友分享',
      emoji: '🫶',
      tagline: '朋友来家里，添一道简单的茶点',
      openers: [
        '朋友来家里坐坐，准备点茶水和简单吃食就很合适。',
        '有些东西适合一个人吃，有些东西适合分给朋友。',
        '朋友来家里坐坐，准备点简单的吃食和茶水就很好。',
        '不一定天天发朋友圈，遇到适合分享的吃食就记下来。'
      ],
      sellerHook: '煎好装盘，配点茶水或小菜，朋友来家里也能一起分享。',
      shortHook: '煎好装盘，朋友来家可以一起尝。',
      hashtags: ['#朋友聚会', '#在家吃饭', '#好物分享'],
      imageTip: '拍一桌人分食的场景，或者朋友拿着半块馅饼的手。'
    },
    craving: {
      id: 'craving',
      label: '深夜嘴馋',
      emoji: '✨',
      tagline: '夜里想吃点热乎的，份量按饭量来',
      openers: [
        '晚上追剧的时候，总得有点热乎的东西。',
        '不是饿，就是嘴巴寂寞。',
        '夜里最受不了的，是厨房飘出来的那点焦香。',
        '夜里嘴馋时，热一份当加餐，吃多少按自己的饭量来。'
      ],
      sellerHook: '追剧时热一份当加餐，掰开能看到里面的馅料。',
      shortHook: '追剧时热一份，香香脆脆当加餐。',
      hashtags: ['#深夜食堂', '#追剧零食', '#今天吃什么'],
      imageTip: '暖光下拍掰开的瞬间，热气比滤镜更有用。'
    },
    midautumn: {
      id: 'midautumn',
      label: '中秋送礼',
      emoji: '🌕',
      tagline: '体面，但不张扬',
      openers: [
        '中秋挑月饼，口味、规格和包装都可以提前看看。',
        '送礼最怕华而不实，盒子好看，打开却不想吃。',
        '中秋送礼，先看看口味和规格是不是对方喜欢的。',
        '月饼年年有，但能让人记住味道的不多。'
      ],
      sellerHook: '礼盒拆开是这样的，黑鎏金铁盒很有质感，八个装分着吃也刚好。',
      shortHook: '黑鎏金铁盒配陈皮豆沙，送人体面也不张扬。',
      hashtags: ['#中秋送礼', '#月饼礼盒', '#中秋团圆'],
      imageTip: '首图拍礼盒整体，第二张开盒，第三张拍切开的月饼。'
    },
    office: {
      id: 'office',
      label: '办公室下午茶',
      emoji: '☕️',
      tagline: '下午三点，需要一点甜',
      openers: [
        '下午三点，办公室最需要一点甜。',
        '开会开到一半，桌上有一盒月饼，气氛都松快了点。',
        '同事之间分享零食，是最不费力的社交。',
        '一盒八个，办公室分一圈刚刚好。'
      ],
      sellerHook: '今天带了一盒到办公室，切开一个分着吃，陈皮味一下就被认出来了。',
      shortHook: '一盒八个，办公室分一圈刚刚好。',
      hashtags: ['#办公室下午茶', '#同事分享', '#下午茶时间'],
      imageTip: '拍办公桌一角，礼盒和咖啡同框，松弛感就出来了。'
    },
    familyMoon: {
      id: 'familyMoon',
      label: '家人分享',
      emoji: '🍵',
      tagline: '小小一个，配茶刚好',
      openers: [
        '一家人坐下来喝茶，月饼切小块分着吃，比一人一大块舒服。',
        '长辈怕甜，小孩怕腻，小小一个刚刚好。',
        '晚上的茶几上，有一块月饼、一杯热茶，就很圆满。',
        '月饼不用大，能一家人分着吃就好。'
      ],
      sellerHook: '晚上切了两个，配一壶茶，老人小孩都能吃。',
      shortHook: '50g 一个，配茶刚好，不甜不腻。',
      hashtags: ['#家人分享', '#喝茶时间', '#中秋团圆'],
      imageTip: '拍切开的小块和茶杯，突出“一人一个不浪费”。'
    },
    gift: {
      id: 'gift',
      label: '走亲访友',
      emoji: '🎁',
      tagline: '拿得出手，也留得住客',
      openers: [
        '走亲访友带什么，是每年中秋的必答题。',
        '送礼这件事，贵不一定对，合不合适更重要。',
        '今年准备了几盒，送长辈、送朋友都体面。',
        '礼盒不用太浮夸，打开有内容才是真本事。'
      ],
      sellerHook: '黑鎏金铁盒提在手里有分量，打开是八个独立小月饼，日常送礼不突兀。',
      shortHook: '提在手里有分量的黑鎏金铁盒，送长辈朋友都合适。',
      hashtags: ['#走亲访友', '#中秋伴手礼', '#礼盒推荐'],
      imageTip: '拍礼盒提手和包装细节，比单纯摆拍更像真实送礼。'
    },
    teatime: {
      id: 'teatime',
      label: '独享茶点',
      emoji: '🌿',
      tagline: '给自己留一点慢下来的时间',
      openers: [
        '不一定要等中秋，想喝茶的时候就可以开一个。',
        '下午给自己泡壶茶，配一块陈皮豆沙，时间会慢下来。',
        '一个人吃月饼，也不用觉得奇怪。',
        '小小一个，刚好够解馋，也刚好够配一壶茶。'
      ],
      sellerHook: '周末下午泡了壶茶，切了一个，陈皮香和茶香很搭。',
      shortHook: '一壶茶，一个小月饼，周末就有了着落。',
      hashtags: ['#独处时光', '#茶点搭配', '#慢生活'],
      imageTip: '拍茶汤、月饼切面和窗边自然光，越简单越高级。'
    }
  };

  const products = [
    {
      id: 'meigancai',
      name: '黑猪肉梅干菜馅饼',
      shortName: '梅干菜馅饼',
      tag: '招牌经典',
      category: '速冻馅饼',
      productType: 'pie',
      headline: '黑猪肉 ≥27% · 梅干菜三蒸三晒',
      price: '两袋 39.9 起',
      priceNote: '四袋再减 10 元',
      spec: '4 片 / 袋 · 单片独立包装',
      image: 'assets/samples/sample-meigancai.svg',
      accent: '#b95e2d',
      soft: '#f5e3cd',
      emojis: ['🥟', '✨', '🫓'],
      points: [
        { id: 'pork', label: '黑猪肉 ≥27%', short: '黑猪肉含量 ≥27%，肉含量行业顶配。', copy: '只用自家黑猪肉，黑猪肉含量 ≥27%，肉含量直接拉到行业顶配。' },
        { id: 'meigancai', label: '三蒸三晒梅干菜', short: '梅干菜 ≥3%，三蒸三晒，咸香解腻。', copy: '梅干菜三蒸三晒，含量 ≥3%，咸香解腻，肉香里混着菜香，吃着不齁。' },
        { id: 'easy', label: '0 分钟出餐', short: '无需解冻，空气炸锅 10 分钟。', copy: '无需解冻，空气炸锅 200℃ 10 分钟，或者平底锅煎 6 分钟。' },
        { id: 'pack', label: '单片独立包装', short: '一袋 4 片，独立包装，不串味。', copy: '一袋 4 片，单片独立包装，干净不串味，冰箱随便放。' },
        { id: 'price', label: '两袋 39.9 起', short: '两袋 39.9 起，四袋再减 10 块。', copy: '两袋 39.9 起，四袋再减 10 块，一袋 4 片，囤四袋能吃一个月左右。' },
        { id: 'taste', label: '皮薄酥脆', short: '煎到金黄，皮薄酥脆，掰开全是肉。', copy: '煎到两面金黄，皮薄酥脆，掰开全是肉和梅干菜。' }
      ],
      defaultPoints: ['pork', 'meigancai', 'easy'],
      sceneIds: ['breakfast', 'afterwork', 'family', 'stock', 'friends', 'craving'],
      defaultScene: 'breakfast',
      voice: {
        sensory: [
          '煎到两面金黄，皮薄酥脆，掰开是满满的肉和梅干菜，咸香里带一点菜香。',
          '咬下去先是酥脆的皮，再是黑猪肉的油香，梅干菜把腻感收得刚刚好。',
          '不用解冻直接下锅，厨房里很快就飘出焦香，掰开的横截面全是料。'
        ],
        context: [
          '以前总觉得速冻食品是将就，后来发现，忙的时候能吃到一口扎实的，已经很不容易。',
          '早餐这件事，说大不大，但每天早上都要面对。能少纠结一次，就多轻松一点。',
          '家里常备一点，不是为了偷懒，是为了在赶时间的早晨，依然能吃口热的。'
        ],
        trust: '配料、规格和价格都写清楚，挑的时候可以对照着看。',
        sellerLines: [
          '掰开的横截面能看见肉和梅干菜，馅料比较直观。',
          '没有摆盘，就是家里平时的样子，热乎、管饱。',
          '拍得不算精致，但都是自己吃了觉得好，才想发出来。'
        ],
        shortHooks: [
          '空气炸锅 200℃ 10 分钟，早餐多睡半小时。',
          '皮薄酥脆，掰开全是黑猪肉和梅干菜。',
          '两袋 39.9 起，四袋再减 10 块。'
        ]
      },
      priceLines: {
        short: '两袋 39.9 起，四袋再减 10 块。',
        standard: '两袋 39.9 起，四袋再减 10 块，一袋 4 片，囤四袋能吃一个月左右。',
        action: '两袋 39.9 起，四袋直接再减 10 块，算下来更划算。'
      },
      hashtags: ['#黑猪肉馅饼', '#梅干菜', '#早餐推荐'],
      imageTips: [
        '首图放掰开的横截面，能看见肉和梅干菜',
        '第二张放单片独立包装，突出干净方便',
        '第三张放早餐桌实拍，增加生活感'
      ]
    },
    {
      id: 'lobster',
      name: '黑猪肉小龙虾馅饼',
      shortName: '小龙虾馅饼',
      tag: '鲜辣上新',
      category: '速冻馅饼',
      productType: 'pie',
      headline: '黑猪肉 ≥17% + 龙虾仁 ≥8%',
      price: '两袋 39.9 起',
      priceNote: '也可选双拼 49.9',
      spec: '4 片 / 袋 · 单片独立包装',
      image: 'assets/samples/sample-lobster.svg',
      accent: '#c2472f',
      soft: '#f3ddd3',
      emojis: ['🦞', '🌶', '✨'],
      points: [
        { id: 'pork', label: '双料合计 ≥25%', short: '黑猪肉 ≥17% + 龙虾仁 ≥8%，双料合计 ≥25%。', copy: '黑猪肉 ≥17%，再加 ≥8% 冻煮龙虾仁，双料合计 ≥25%，一口能吃到海鲜鲜甜和肉香。' },
        { id: 'shrimp', label: '整颗去壳龙虾仁', short: '不是虾泥、虾粉或香精，掰开看得见。', copy: '不是虾泥、不是虾粉、不是香精，掰开能看见整颗去壳龙虾仁。' },
        { id: 'taste', label: '麻辣鲜香', short: '麻辣鲜香，速冻馅饼里少见的口味。', copy: '麻辣鲜香，速冻馅饼里少见的口味，比想象中好吃很多。' },
        { id: 'easy', label: '0 分钟出餐', short: '无需解冻，空气炸锅 10 分钟。', copy: '无需解冻，空气炸锅 200℃ 10 分钟，或者平底锅煎 6 分钟。' },
        { id: 'pack', label: '单片独立包装', short: '一袋 4 片，独立包装，不串味。', copy: '一袋 4 片，单片独立包装，干净不串味，冰箱随便放。' },
        { id: 'price', label: '两袋 39.9 起', short: '两袋 39.9 起，四袋再减 10 块。', copy: '两袋 39.9 起，四袋再减 10 块；想尝两种口味也可以选双拼 49.9。' }
      ],
      defaultPoints: ['pork', 'shrimp', 'taste'],
      sceneIds: ['breakfast', 'afterwork', 'craving', 'friends', 'stock'],
      defaultScene: 'craving',
      voice: {
        sensory: [
          '咬开先是麻辣鲜香，再嚼到整颗去壳龙虾仁，海鲜的甜和黑猪肉的香一起上来。',
          '麻辣味不是浮在表面的辣，咬到龙虾仁的时候，海鲜的鲜甜才慢慢出来。',
          '皮煎得酥脆，里面的馅带着一点辣，越吃越香，完全不像速冻食品。'
        ],
        context: [
          '小龙虾馅饼这个组合，听起来像噱头，所以第一次吃的时候特意掰开看了。',
          '速冻馅饼吃过不少，麻辣小龙虾味还是头一回见。',
          '对速冻食品的期待本来不高，但这个口味确实有点超出预期。'
        ],
        trust: '用料敢掰开给你看，味道才敢让你试。',
        sellerLines: [
          '掰开的横截面能看见龙虾仁，馅料比较直观。',
          '没有滤镜，麻辣的红油和龙虾仁的颜色很实在。',
          '拍完就趁热吃了，凉了皮就不脆了。'
        ],
        shortHooks: [
          '掰开能看见整颗龙虾仁的馅饼，真不多见。',
          '麻辣鲜香，黑猪肉 ≥17% + 龙虾仁 ≥8%。',
          '没吃过建议先试双拼 49.9。'
        ]
      },
      priceLines: {
        short: '两袋 39.9 起，四袋再减 10 块。',
        standard: '两袋 39.9 起，四袋再减 10 块，想尝两种口味也可以选双拼 49.9。',
        action: '两袋 39.9 起，四袋直接再减 10 块，双拼 49.9 也能试。'
      },
      hashtags: ['#小龙虾馅饼', '#麻辣鲜香', '#黑猪肉'],
      imageTips: [
        '首图一定要拍掰开的横截面，龙虾仁是主角',
        '第二张拍煎制过程，滋滋的油光很抓人',
        '第三张放双拼组合，解决选择困难'
      ]
    },
    {
      id: 'duopin',
      name: '黑猪肉双拼馅饼',
      shortName: '双拼馅饼',
      tag: '选择困难救星',
      category: '速冻馅饼',
      productType: 'pie',
      headline: '梅干菜 + 小龙虾，一次尝两种',
      price: '双拼 49.9',
      priceNote: '一袋两种口味',
      spec: '两种口味 · 单片独立包装',
      image: 'assets/samples/sample-duopin.svg',
      accent: '#a85a32',
      soft: '#f2e2ce',
      emojis: ['🥟', '🦞', '🫶'],
      points: [
        { id: 'pork', label: '双料合计 ≥25%', short: '黑猪肉 + 龙虾仁双料合计 ≥25%。', copy: '梅干菜款黑猪肉 ≥27%；小龙虾款黑猪肉 ≥17% + 龙虾仁 ≥8%，双料合计 ≥25%。' },
        { id: 'meigancai', label: '三蒸三晒梅干菜', short: '梅干菜 ≥3%，咸香解腻。', copy: '梅干菜三蒸三晒，含量 ≥3%，咸香解腻，肉香里混着菜香。' },
        { id: 'shrimp', label: '整颗去壳龙虾仁', short: '不是虾泥，掰开看得见。', copy: '不是虾泥、不是虾粉、不是香精，掰开能看见整颗去壳龙虾仁。' },
        { id: 'easy', label: '0 分钟出餐', short: '无需解冻，空气炸锅 10 分钟。', copy: '无需解冻，空气炸锅 200℃ 10 分钟，或者平底锅煎 6 分钟。' },
        { id: 'pack', label: '单片独立包装', short: '一袋 4 片，独立包装，不串味。', copy: '一袋 4 片，单片独立包装，干净不串味，冰箱随便放。' },
        { id: 'price', label: '双拼 49.9', short: '双拼 49.9，两种口味一次尝。', copy: '双拼 49.9，梅干菜和小龙虾各一半，不用纠结选哪个。' }
      ],
      defaultPoints: ['pork', 'meigancai', 'shrimp'],
      sceneIds: ['breakfast', 'family', 'stock', 'friends', 'afterwork'],
      defaultScene: 'family',
      voice: {
        sensory: [
          '一半是咸香解腻的梅干菜，一半是麻辣鲜香的小龙虾，两种口味换着吃，不容易腻。',
          '梅干菜款肉香混着菜香，小龙虾款能嚼到整颗龙虾仁，一袋就把两种都尝了。',
          '煎一盘端上桌，喜欢清淡的吃梅干菜，喜欢重口的拿小龙虾，谁都不用迁就。'
        ],
        context: [
          '每次买速冻食品最纠结的就是口味，选一个怕吃腻，买两袋又怕吃不完。',
          '双拼的好处很直接：不用做选择，两种都能吃到。',
          '家里人口味不一样的时候，双拼是最省事的办法。'
        ],
        trust: '两种口味都用了自家黑猪肉，不是拿一个口味凑数。',
        sellerLines: [
          '这次两种口味各煎了一个，掰开放在一起拍，差别一眼就能看出来。',
          '一盘双拼端上桌，喜欢哪个拿哪个，基本不用劝。',
          '没有摆盘，家里吃什么样就拍什么样。'
        ],
        shortHooks: [
          '梅干菜 + 小龙虾，双拼 49.9，不用选。',
          '一袋两种口味，全家人的喜好都照顾到。',
          '咸香和麻辣各一半，换着吃不容易腻。'
        ]
      },
      priceLines: {
        short: '双拼 49.9，两种口味一次尝。',
        standard: '双拼 49.9，梅干菜和小龙虾各一半，一袋解决选择困难。',
        action: '双拼 49.9 先尝两种，四袋组合再减 10 块。'
      },
      hashtags: ['#双拼馅饼', '#选择困难', '#黑猪肉'],
      imageTips: [
        '两种口味各拍一个掰开的横截面，对比最直观',
        '拍一盘双拼端上桌，突出“全家都能吃”',
        '包装图放在最后，补齐方便储存的信息'
      ]
    },
    {
      id: 'mooncake',
      name: '陈皮豆沙月饼',
      shortName: '陈皮豆沙月饼',
      tag: '中秋礼盒',
      category: '月饼礼盒',
      productType: 'mooncake',
      headline: '新会陈皮 × 红豆沙 · 50g 小规格',
      price: '128 元 / 盒',
      priceNote: '一盒 8 个',
      spec: '50g × 8 个 · 黑鎏金铁盒',
      image: 'assets/samples/sample-mooncake.svg',
      accent: '#9b6b32',
      soft: '#ece2d0',
      emojis: ['🥮', '🌕', '🍵'],
      points: [
        { id: 'chenpi', label: '新会陈皮提香', short: '红豆沙绵密，陈皮提香解腻，不齁不腻。', copy: '红豆沙绵密细腻，新会陈皮提香解腻，当经典遇上经典，吃着不齁不腻。' },
        { id: 'low', label: '低糖低油', short: '每 100g 糖 4.6g、脂肪 11.6g。', copy: '每 100g 糖仅 4.6g、脂肪 11.6g，比传统月饼清淡，老人小孩都能吃。' },
        { id: 'size', label: '50g 小规格', short: '一人一个刚好，不浪费。', copy: '50g 一个，8 个装，一人一个刚好吃完，不像大饼吃不完放坏。' },
        { id: 'box', label: '黑鎏金铁盒', short: '「鎏金岁月」设计，低调大气。', copy: '黑色铁盒「鎏金岁月」设计，低调大气不张扬，日常送礼不突兀。' },
        { id: 'brand', label: '御唐府出品', short: '高端系列，品牌品控有保障。', copy: '御唐府高端系列出品，品牌品控有保障。' },
        { id: 'share', label: '8 个分享装', short: '办公室分、家人吃都够。', copy: '一盒 8 个，办公室分、家里人吃都够，性价比高。' }
      ],
      defaultPoints: ['chenpi', 'low', 'size'],
      sceneIds: ['midautumn', 'office', 'familyMoon', 'gift', 'teatime'],
      defaultScene: 'midautumn',
      voice: {
        sensory: [
          '切开能看到绵密的红豆沙，入口先是豆香，再慢慢泛出新会陈皮的清香，不齁不腻。',
          '豆沙磨得很细，陈皮的味道不是冲出来的，是吃完之后留在嘴里的那一点香。',
          '50g 小小一个，配一口茶刚好，不会吃到最后觉得甜得发腻。'
        ],
        context: [
          '如果担心月饼吃多了偏腻，可以留意口味和规格，按需分着吃。',
          '中秋送礼，盒子好看是加分项，但真正决定会不会回购的，还是味道。',
          '以前总觉得月饼是任务，现在发现，选对了也可以是很舒服的一口茶点。'
        ],
        trust: '御唐府高端系列出品，品牌品控有保障。',
        sellerLines: [
          '切面能看见红豆沙和陈皮，口味细节可以对照图片了解。',
          '搭配茶水或咖啡，作为办公室下午茶也合适。',
          '黑金配色简洁大方，送礼前可以先确认对方喜欢的口味。'
        ],
        shortHooks: [
          '新会陈皮配红豆沙，不齁不腻，小小一个刚好。',
          '50g 一个，配茶刚好，不浪费。',
          '128 一盒 8 个，中秋送礼体面不张扬。'
        ]
      },
      priceLines: {
        short: '128 一盒 8 个。',
        standard: '128 一盒 8 个，办公室分、家里吃都够。',
        action: '128 一盒 8 个，中秋送礼体面，自己吃也不心疼。'
      },
      hashtags: ['#陈皮豆沙月饼', '#中秋礼盒', '#下午茶'],
      imageTips: [
        '首图拍礼盒整体，黑金质感要拍出来',
        '第二张拍切面，红豆沙和陈皮看得见',
        '第三张拍茶杯同框，补足“配茶刚好”的氛围'
      ]
    }
  ];

  const customScenes = {
    daily: {
      id: 'daily',
      label: '日常分享',
      emoji: '☀️',
      tagline: '把今天的好东西记一笔',
      openers: ['最近吃到一样值得记一笔的东西。', '有些好物不一定会天天发，但吃到了就想说两句。', '日常里的一点小惊喜，分享给你们。'],
      sellerHook: '配图可以选日常实拍，产品细节和包装都拍清楚。',
      shortHook: '最近吃到的好东西，记一笔。',
      hashtags: ['#日常分享', '#好物推荐'],
      imageTip: '选一张最真实的实拍当首图，更容易让人停下来。'
    },
    customFamily: {
      id: 'customFamily',
      label: '家庭分享',
      emoji: '🏠',
      tagline: '一家人一起吃，才更香',
      openers: ['给家里挑吃的，我会先看看配料和规格。', '一家人分着吃，口味和份量都可以按需安排。', '把这款的配料、规格和吃法整理出来，给家里挑选时做个参考。'],
      sellerHook: '拍下家常餐桌的样子，配料和规格也一并写清楚。',
      shortHook: '配料和规格写清楚，挑选时多一个参考。',
      hashtags: ['#家庭分享', '#好吃推荐'],
      imageTip: '拍家人围坐或分食的画面，增加真实感。'
    },
    customGift: {
      id: 'customGift',
      label: '送礼推荐',
      emoji: '🎁',
      tagline: '拿得出手，也留得住心意',
      openers: ['送礼这件事，体面和用心最好都有。', '挑礼物的时候，总会想对方收到会不会真的喜欢。', '今年送礼清单里，又多了一个选择。'],
      sellerHook: '包装和产品内容都展示出来，方便送礼前了解细节。',
      shortHook: '拿得出手，也留得住心意。',
      hashtags: ['#送礼推荐', '#伴手礼'],
      imageTip: '首图拍包装整体，第二张拍打开后的内容。'
    }
  };

  const personas = [
    {
      id: 'owner',
      label: '主理人',
      hint: '真诚、不端着',
      openers: ['今天把这款的用料和吃法整理一下，想了解的朋友可以看看。', '不绕弯子，先把产品信息和吃法说清楚。', '规格、口味和价格放在一起，方便对照着看。'],
      closers: ['适不适合自己，按口味和需求来选就好。', '有想确认的细节，欢迎来问我。']
    },
    {
      id: 'mom',
      label: '宝妈',
      hint: '先看用料，再谈好吃',
      openers: ['给家里选吃的，我会先看配料、规格和保存方式。', '家里日常备点吃的，方便和口味都得考虑。', '整理了这款的配料和做法，给家里挑吃的时多个参考。'],
      closers: ['给家里买之前，记得按自己的需求看清配料表。', '口味因人而异，适合自家习惯最重要。']
    },
    {
      id: 'foodie',
      label: '吃货',
      hint: '嘴刁、真实、重口感',
      openers: ['吃东西我比较看重口感，酥不酥、馅料够不够，吃一口就知道。', '这款我先把口味和做法写出来，爱吃这一口的可以参考。', '喜欢什么口味很看个人，我把能确认的信息尽量说具体。'],
      closers: ['口感偏好因人而异，喜欢这类口味的可以了解一下。', '想看配料或做法细节，可以问我。']
    },
    {
      id: 'minimal',
      label: '克制高级',
      hint: '少形容词，多留白',
      openers: ['好的食物，不需要太多形容词。', '简单的东西，做好就不简单。', '不太会吆喝，但愿意把细节讲清楚。'],
      closers: ['喜欢的话，可以试试。', '细节都在图里，也在味道里。']
    },
    {
      id: 'funny',
      label: '幽默嘴替',
      hint: '像朋友聊天，有点好笑',
      openers: ['认真说，这款的吃法还挺省事，做法我写在下面。', '今天不讲大道理，直接说说它怎么吃、是什么口味。', '馅饼趁热吃更香，做法简单写一下，赶时间也能参考。'],
      closers: ['喜欢这个口味的话，可以看看规格和活动。', '想试试的话，先按自己的口味和需求来选。']
    }
  ];

  const ctas = [
    { id: 'dm', label: '私信我', text: '想了解规格或活动，私信我就行。' },
    { id: 'comment', label: '评论区留言', text: '想了解的可以留言，我看到后回复。' },
    { id: 'scan', label: '扫码了解', text: '需要的话可以扫码了解详情。' },
    { id: 'silent', label: '不加 CTA', text: '' }
  ];

  const lengths = [
    { id: 'short', label: '短句', hint: '60–110 字' },
    { id: 'standard', label: '标准', hint: '120–200 字' },
    { id: 'long', label: '走心长文', hint: '220–320 字' }
  ];

  const samples = [
    { id: 'sample-meigancai', category: 'product', productId: 'meigancai', src: 'assets/samples/sample-meigancai.svg', label: '梅干菜馅饼', isSample: true },
    { id: 'sample-lobster', category: 'product', productId: 'lobster', src: 'assets/samples/sample-lobster.svg', label: '小龙虾馅饼', isSample: true },
    { id: 'sample-duopin', category: 'product', productId: 'duopin', src: 'assets/samples/sample-duopin.svg', label: '双拼馅饼', isSample: true },
    { id: 'sample-mooncake', category: 'product', productId: 'mooncake', src: 'assets/samples/sample-mooncake.svg', label: '陈皮豆沙礼盒', isSample: true },
    { id: 'sample-breakfast', category: 'seller', productType: 'pie', src: 'assets/samples/seller-breakfast.svg', label: '早餐实拍', isSample: true },
    { id: 'sample-family', category: 'seller', productType: 'pie', src: 'assets/samples/seller-family.svg', label: '家庭餐桌', isSample: true },
    { id: 'sample-mooncake-table', category: 'seller', productType: 'mooncake', src: 'assets/samples/seller-mooncake.svg', label: '礼盒开箱', isSample: true },
    { id: 'sample-office', category: 'seller', productType: 'mooncake', src: 'assets/samples/seller-office.svg', label: '办公室下午茶', isSample: true }
  ];

  window.DYData = {
    products,
    customScenes,
    sceneLibrary,
    personas,
    ctas,
    lengths,
    samples,
    materialTypes: [
      { id: 'product', label: '产品图', hint: '包装、产品特写、细节图' },
      { id: 'seller', label: '卖家秀', hint: '早餐桌、家庭餐桌、开箱实拍' }
    ],
    placeholderImage: 'assets/samples/placeholder.svg',
    brand: {
      name: '壹号食志',
      en: 'MOMENTS LAB',
      slogan: '把好食材，写成让人想下单的朋友圈。'
    }
  };
})();
