// 0D: generate site_seo_pages — core local landing + 19 service + 4 condition pages.
// Writes per-locale content (section outline + COMPLETE seo object) to content_entries
// at seo-pages/<slug>.json, and registers each slug+page_type in the site_seo_pages table.
// Bodies are outline-level (Phase 1I/2D complete them); seo objects are final (0D gate).
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue; let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[m[1]]) process.env[m[1]] = v;
}
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SITE = 'spa-paradise';
const cat = {
  en: JSON.parse(fs.readFileSync('content/spa-paradise/en/collections/services.json', 'utf-8')),
  zh: JSON.parse(fs.readFileSync('content/spa-paradise/zh/collections/services.json', 'utf-8')),
};
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');

const pages = []; // { slug, pageType, serviceRef?, townSlug?, en:{...}, zh:{...} }

// ---- 1 core local landing ----
pages.push({
  slug: 'massage-middletown-ny', pageType: 'seo-local-landing',
  en: { h1: 'Massage in Middletown, NY', title: 'Massage in Middletown, NY | Spa Paradise',
        desc: 'Licensed massage in Middletown, NY — Swedish, deep tissue, hot stone, couples & more. Transparent pricing, open every day, English & 中文.',
        kw: ['massage middletown ny', 'massage near me middletown', 'day spa middletown ny'], cluster: 'local-massage-middletown' },
  zh: { h1: '纽约米德尔敦按摩', title: '纽约米德尔敦按摩 | 天堂水疗',
        desc: '米德尔敦的持牌按摩——瑞典式、深层组织、热石、情侣按摩等。价格透明，每天营业，提供中英文服务。',
        kw: ['米德尔敦按摩', '米德尔敦水疗'], cluster: 'local-massage-middletown' },
});

// ---- 19 service pages (one per catalog service) ----
const enServices = cat.en.services, zhById = Object.fromEntries(cat.zh.services.map((s) => [s.id, s]));
for (const s of enServices) {
  const z = zhById[s.id];
  pages.push({
    slug: `${s.slug}-middletown-ny`, pageType: 'seo-service', serviceRef: s.id,
    en: { h1: `${s.name} in Middletown, NY`, title: clip(`${s.name} in Middletown, NY | Spa Paradise`, 60),
          desc: clip(`${s.short} ${s.name} in Middletown, NY at Spa Paradise — licensed therapists, transparent pricing, online booking.`, 155),
          kw: [`${s.name.toLowerCase()} middletown ny`, `${s.name.toLowerCase()} near me`, 'spa paradise'], cluster: `service-${s.id}` },
    zh: { h1: `纽约米德尔敦${z.name}`, title: clip(`纽约米德尔敦${z.name} | 天堂水疗`, 60),
          desc: clip(`${z.short} 天堂水疗的${z.name}——持牌理疗师、价格透明、在线预约。`, 155),
          kw: [`米德尔敦${z.name}`, `${z.name}`], cluster: `service-${s.id}` },
  });
}

// ---- 4 launch condition pages ----
const conditions = [
  { slug: 'back-pain', en: 'Back Pain', zh: '背部疼痛', svc: 'deep-tissue-massage' },
  { slug: 'neck-shoulder-tension', en: 'Neck & Shoulder Tension', zh: '颈肩紧绷', svc: 'deep-tissue-massage' },
  { slug: 'prenatal-comfort', en: 'Prenatal Comfort', zh: '孕期舒缓', svc: 'prenatal-massage' },
  { slug: 'stress-relief', en: 'Stress Relief', zh: '舒缓压力', svc: 'swedish-massage' },
  { slug: 'tension-headaches', en: 'Tension Headaches', zh: '紧张性头痛', svc: 'deep-tissue-massage' },
  { slug: 'sports-recovery', en: 'Sports Recovery', zh: '运动恢复', svc: 'sports-massage' },
  { slug: 'tired-feet', en: 'Tired, Aching Feet', zh: '足部疲劳酸痛', svc: 'foot-reflexology' },
  { slug: 'desk-posture-tension', en: 'Desk & Posture Tension', zh: '久坐姿势性紧绷', svc: 'deep-tissue-massage' },
  { slug: 'better-sleep', en: 'Better Sleep & Relaxation', zh: '改善睡眠与放松', svc: 'aromatherapy-massage' },
  { slug: 'muscle-soreness', en: 'Muscle Soreness', zh: '肌肉酸痛', svc: 'hot-stone-massage' },
];
for (const c of conditions) {
  pages.push({
    slug: `massage-for-${c.slug}-middletown-ny`, pageType: 'seo-condition', serviceRef: c.svc,
    en: { h1: `Massage for ${c.en} in Middletown, NY`, title: clip(`Massage for ${c.en} in Middletown, NY`, 60),
          desc: clip(`Soothing, licensed massage in Middletown, NY for ${c.en.toLowerCase()}. Wellness-focused relief — book online, English & 中文.`, 155),
          kw: [`massage for ${c.en.toLowerCase()} middletown ny`, `${c.en.toLowerCase()} massage near me`], cluster: `condition-${c.slug}` },
    zh: { h1: `纽约米德尔敦${c.zh}按摩`, title: clip(`纽约米德尔敦${c.zh}按摩`, 60),
          desc: clip(`米德尔敦针对${c.zh}的舒缓持牌按摩。以放松与舒缓为本——在线预约，提供中英文服务。`, 155),
          kw: [`${c.zh}按摩`, `米德尔敦${c.zh}`], cluster: `condition-${c.slug}` },
  });
}

// ---- 6 resource articles (seo-resource) ----
const RESOURCES = [
  {
    slug: 'how-much-does-a-massage-cost-middletown-ny', cluster: 'resource-cost',
    en: { h1: 'How Much Does a Massage Cost in Middletown, NY?', title: 'How Much Does a Massage Cost in Middletown, NY?',
      desc: 'A clear guide to massage prices in Middletown, NY — every treatment and length, with no hidden fees.',
      answer: 'At Spa Paradise, massage in Middletown, NY ranges from about {priceMin} to {priceMax} depending on the treatment and length. Every price is published — what you see is what you pay, with no service charge and gratuity always optional.',
      body: '## What you pay\nOur menu lists a price for every treatment and length, from a 30-minute reset to a 90-minute deep session. Nothing is charged when you book; you pay after your treatment.\n\n## What affects the price\nLength is the biggest factor, followed by the type of work — a specialized treatment like hot stone or couples costs more than a standard Swedish. Add-ons such as hot stones or cupping are a small flat fee.\n\n## Tipping and fees\nGratuity is appreciated but never required, and there is no service charge or surprise add-on. The menu price is the treatment price.' },
    zh: { h1: '纽约米德尔敦按摩多少钱？', title: '纽约米德尔敦按摩多少钱？',
      desc: '纽约米德尔敦按摩价格的清晰指南——每项护理与时长，绝无隐藏收费。',
      answer: '在天堂水疗，纽约米德尔敦的按摩价格约为 {priceMin} 至 {priceMax}，取决于护理类型与时长。每个价格都公开透明——所见即所付，没有服务费，小费始终自愿。',
      body: '## 您需要支付什么\n我们的菜单为每项护理与时长都标明价格，从30分钟的快速放松到90分钟的深层护理。预约时不收取任何费用，护理结束后再付款。\n\n## 哪些因素影响价格\n时长是最主要的因素，其次是护理类型——热石或情侣等专门护理会比标准瑞典式更贵。热石或拔罐等附加项目为小额固定费用。\n\n## 小费与费用\n小费我们心存感谢，但从不强制；没有服务费，也没有意外加价。菜单价格就是护理价格。' },
    svc: 'swedish-massage',
  },
  {
    slug: 'deep-tissue-vs-swedish-massage', cluster: 'resource-deep-vs-swedish',
    en: { h1: 'Deep Tissue vs. Swedish Massage: Which Is Right for You?', title: 'Deep Tissue vs. Swedish Massage | Spa Paradise',
      desc: 'Swedish massage is gentle and relaxing; deep tissue uses firmer, focused pressure for stubborn tension. Here is how to choose.',
      answer: 'Choose Swedish massage for whole-body relaxation with long, gentle strokes. Choose deep tissue if you want slower, firmer, focused pressure to work through stubborn knots and tension. Not sure? Tell your therapist your goal and they will adjust.',
      body: '## Swedish massage\nLong, flowing strokes and light-to-medium pressure for stress relief and overall relaxation. A great default if you simply want to unwind.\n\n## Deep tissue massage\nSlower strokes and firmer, targeted pressure that reaches deeper muscle layers. Best for chronic tightness, knots, and recovery work.\n\n## How to decide\nThink about your goal, not just the name. You can always ask your therapist to go lighter or firmer during the session — your comfort guides the work.' },
    zh: { h1: '深层组织 vs. 瑞典式按摩：哪种适合您？', title: '深层组织 vs. 瑞典式按摩 | 天堂水疗',
      desc: '瑞典式按摩温和放松；深层组织以更坚实、集中的力度处理顽固紧绷。以下是如何选择。',
      answer: '若想全身放松，选择以舒缓长推手法为主的瑞典式按摩。若想以更慢、更坚实、集中的力度化解顽固结节与紧绷，则选择深层组织。不确定？告诉理疗师您的目标，他们会随之调整。',
      body: '## 瑞典式按摩\n舒缓流畅的长推手法，轻到中等力度，适合减压与整体放松。如果只是想放松，这是很好的默认选择。\n\n## 深层组织按摩\n更慢的手法与更坚实、针对性的力度，可触及更深的肌肉层。最适合长期紧绷、结节与恢复需求。\n\n## 如何决定\n关注您的目标，而非名称本身。护理过程中您随时可以请理疗师调轻或调重——您的舒适决定手法力度。' },
    svc: 'deep-tissue-massage',
  },
  {
    slug: 'what-to-expect-first-massage', cluster: 'resource-first-visit',
    en: { h1: 'What to Expect at Your First Massage', title: 'What to Expect at Your First Massage | Spa Paradise',
      desc: 'Arrive a few minutes early, share your goals, and undress only to your comfort. Here is exactly how your first massage works.',
      answer: 'Arrive a few minutes early, tell us your goals and any areas to focus on or avoid, and undress only to your comfort — you are always professionally draped. Your therapist checks in on pressure throughout, and you pay after.',
      body: '## Before your session\nArrive a few minutes early to settle in. We will ask about your goals and any areas to focus on or avoid.\n\n## During the massage\nYou undress only to your comfort and are covered with a sheet the whole time; only the area being worked on is exposed. Speak up anytime about pressure or temperature.\n\n## After\nTake your time getting up, drink some water, and pay at the desk. Gratuity is always optional.' },
    zh: { h1: '第一次按摩会是怎样的体验', title: '第一次按摩会是怎样 | 天堂水疗',
      desc: '提前几分钟到达，说明您的目标，只需脱至自己舒适的程度。以下是第一次按摩的完整流程。',
      answer: '请提前几分钟到达，告诉我们您的目标以及需重点处理或避开的部位，只需脱至自己舒适的程度——全程都有专业盖布遮护。理疗师会全程关注力度，护理结束后再付款。',
      body: '## 护理之前\n提前几分钟到达以便安顿。我们会询问您的目标以及需重点处理或避开的部位。\n\n## 按摩过程中\n您只需脱至自己舒适的程度，全程以盖布覆盖，仅露出正在护理的部位。力度或温度如有需要请随时告知。\n\n## 护理之后\n慢慢起身，喝些水，到前台付款。小费始终自愿。' },
    svc: 'swedish-massage',
  },
  {
    slug: 'how-often-should-you-get-a-massage', cluster: 'resource-how-often',
    en: { h1: 'How Often Should You Get a Massage?', title: 'How Often Should You Get a Massage? | Spa Paradise',
      desc: 'For general wellness, many people enjoy a massage every 4–6 weeks; for specific tension or training, more often can help.',
      answer: 'For general relaxation and wellbeing, many people enjoy a massage every four to six weeks. If you are managing specific tension or training hard, a session every one to two weeks for a while can help — then settle into a maintenance rhythm.',
      body: '## For general wellness\nA monthly massage is a comfortable rhythm for most people to stay relaxed and loosen everyday tension.\n\n## For specific tension or training\nDuring a busy or active stretch, weekly or biweekly sessions can help you stay ahead of tightness, then ease back to monthly.\n\n## Finding your rhythm\nThere is no one-size-fits-all answer. Notice how you feel between visits — our membership makes a regular monthly massage easy and affordable.' },
    zh: { h1: '多久按摩一次比较好？', title: '多久按摩一次比较好 | 天堂水疗',
      desc: '若为日常保健，许多人每4–6周按摩一次；若针对特定紧绷或训练，频率高一些会有帮助。',
      answer: '若为日常放松与健康，许多人每四到六周按摩一次。若正在处理特定紧绷或进行高强度训练，一段时间内每一到两周一次会有帮助——之后再回到保养的节奏。',
      body: '## 日常保健\n每月一次按摩对大多数人来说是舒适的节奏，有助于保持放松、缓解日常紧绷。\n\n## 针对特定紧绷或训练\n在忙碌或活动量大的阶段，每周或每两周一次有助于提前化解紧绷，之后再回到每月一次。\n\n## 找到您的节奏\n没有一刀切的答案。留意两次之间的身体感受——我们的会员让每月规律按摩变得轻松又实惠。' },
    svc: 'swedish-massage',
  },
  {
    slug: 'benefits-of-cupping', cluster: 'resource-cupping',
    en: { h1: 'What Are the Benefits of Cupping?', title: 'What Are the Benefits of Cupping? | Spa Paradise',
      desc: 'Cupping uses gentle suction to ease muscle tension and support circulation, often paired with massage.',
      answer: 'Cupping uses gentle suction to help ease muscle tension and support circulation. Many people find it a relaxing complement to massage. It can leave temporary circular marks that usually fade within a few days.',
      body: '## What cupping feels like\nWarm or suction cups are placed on the skin to create a gentle pulling sensation that many find deeply relaxing.\n\n## When people choose it\nCupping is often added to a massage for areas of stubborn tightness, especially the back and shoulders.\n\n## Good to know\nThe temporary circular marks are normal and usually fade within a few days. If you have any medical concerns, check with your doctor first.' },
    zh: { h1: '拔罐有哪些好处？', title: '拔罐有哪些好处 | 天堂水疗',
      desc: '拔罐通过温和的吸力舒缓肌肉紧张、促进循环，常与按摩搭配进行。',
      answer: '拔罐通过温和的吸力帮助舒缓肌肉紧张、促进循环。许多人觉得它是按摩的放松补充。可能会留下暂时的圆形印记，通常几天内自行消退。',
      body: '## 拔罐的感受\n将温罐或吸罐置于皮肤上，产生温和的牵拉感，许多人觉得十分放松。\n\n## 人们何时选择拔罐\n拔罐常加入按摩中，用于顽固紧绷的部位，尤其是背部与肩部。\n\n## 温馨提示\n暂时的圆形印记属正常现象，通常几天内消退。如有任何身体顾虑，请先咨询医生。' },
    svc: 'massage-cupping',
  },
  {
    slug: 'what-is-foot-reflexology', cluster: 'resource-reflexology',
    en: { h1: 'What Is Foot Reflexology Good For?', title: 'What Is Foot Reflexology Good For? | Spa Paradise',
      desc: 'Foot reflexology applies pressure to points on the feet for a deeply relaxing experience — done fully clothed in a recliner lounge.',
      answer: 'Foot reflexology applies gentle pressure to specific points on the feet for a deeply relaxing experience. It is a favorite after long days on your feet, done fully clothed from the ankle up in our recliner lounge.',
      body: '## What it is\nReflexology focuses on the feet with pressure-point work that many find calming and restorative.\n\n## Why people love it\nIt is a low-key, comfortable treatment — perfect after a long shift or a lot of walking, and an easy first spa experience.\n\n## What to expect\nYou relax in a recliner, clothed from the ankle up, while your therapist works on your feet. Sessions run 30 or 60 minutes.' },
    zh: { h1: '足部反射疗法有什么好处？', title: '足部反射疗法有什么好处 | 天堂水疗',
      desc: '足部反射疗法按压足部穴位，带来深度放松——在躺椅休息区进行，全程着装。',
      answer: '足部反射疗法对足部特定穴位施以温和按压，带来深度放松。它是长时间站立后的人气之选，在我们的躺椅休息区进行，脚踝以上保持着装。',
      body: '## 这是什么\n反射疗法专注于足部的穴位手法，许多人觉得宁静而舒缓。\n\n## 人们为何喜欢\n这是一种轻松舒适的护理——长时间值班或步行后尤其适合，也是很好的初次水疗体验。\n\n## 护理流程\n您在躺椅上放松，脚踝以上着装，理疗师为您处理双脚。护理时长为30或60分钟。' },
    svc: 'foot-reflexology',
  },
];
for (const r of RESOURCES) {
  pages.push({
    slug: r.slug, pageType: 'seo-resource', serviceRef: r.svc,
    en: { h1: r.en.h1, title: clip(r.en.title, 60), desc: clip(r.en.desc, 155), kw: [r.slug.replace(/-/g, ' '), 'massage middletown ny'], cluster: r.cluster, _res: r.en },
    zh: { h1: r.zh.h1, title: clip(r.zh.title, 60), desc: clip(r.zh.desc, 155), kw: [r.zh.h1, '米德尔敦按摩'], cluster: r.cluster, _res: r.zh },
  });
}

// ---- 10 near-location town pages (seo-near-location) ----
// Honest framing: located in Middletown, serving each town. Same NAP. Town-specific drive copy.
// Distinct, town-specific drive copy per page (avoids doorway-page similarity; check:uniqueness gate).
const TOWNS = [
  { slug: 'goshen', en: 'Goshen', zh: '戈申', min: 10, route: 'Route 17M',
    enDrive: "Just up Route 17M, Goshen sits barely ten minutes from our door — close enough that plenty of Goshen regulars stop in on a lunch break. If you work near the Orange County government center or shop along Main Street, an unhurried massage or facial is only a short hop south into Middletown.",
    zhDrive: "沿17M公路向上，戈申距我们门口仅约十分钟——近到许多戈申常客会趁午休顺道而来。若您在橙县政府中心一带工作，或在主街附近购物，向南到米德尔敦稍作停留，便能享受一次从容的按摩或面部护理。" },
  { slug: 'wallkill', en: 'Wallkill', zh: '沃尔基尔', min: 15, route: 'Route 208',
    enDrive: "From the Wallkill area it's a relaxed fifteen-minute drive down Route 208 into town. Guests come from across the Wallkill River valley — some after a morning on the rail trail — for licensed therapists and the kind of published, no-surprise pricing that's hard to find nearby.",
    zhDrive: "从沃尔基尔一带沿208公路进城，是一段轻松的十五分钟车程。客人们从沃尔基尔河谷各处赶来——有些人是在铁路步道上晨练之后——只为持牌理疗师，以及周边难得一见的公开、透明、无意外的价格。" },
  { slug: 'scotchtown', en: 'Scotchtown', zh: '斯科奇敦', min: 8, route: 'Route 211',
    enDrive: "Scotchtown is practically next door — about eight minutes south on Route 211, our closest neighborhood of all. It's the easiest trip in the area, whether you're squeezing in a quick reflexology session or settling in for a full ninety-minute massage.",
    zhDrive: "斯科奇敦几乎就在隔壁——沿211公路向南约八分钟，是我们最近的街区。无论是抽空做一次快速足疗，还是安心享受整整九十分钟的按摩，这都是周边最便捷的一趟。" },
  { slug: 'monroe', en: 'Monroe', zh: '门罗', min: 20, route: 'Route 17',
    enDrive: "Coming from Monroe, Route 17 west brings you over in about twenty minutes. Many guests turn a day near Museum Village into an afternoon for two, booking our private couples room with tea service and making the drive part of the treat.",
    zhDrive: "从门罗出发，沿17号公路向西约二十分钟即到。许多客人会把博物馆村附近的一天，延伸为双人的午后时光——预订我们的私密情侣房并附茶点，连这段车程也成了享受的一部分。" },
  { slug: 'chester', en: 'Chester', zh: '切斯特', min: 15, route: 'Routes 17 & 94',
    enDrive: "Chester is a straightforward fifteen minutes via Routes 17 and 94. If you commute through the Chester train station, we're an easy stop on the way home — trade the platform for a warm room and some hard-earned quiet.",
    zhDrive: "从切斯特经17号与94号公路过来，约十五分钟便捷直达。若您每天经切斯特火车站通勤，我们正是回家路上顺道的一站——把站台换成一间温暖的房间，享受来之不易的宁静。" },
  { slug: 'montgomery', en: 'Montgomery', zh: '蒙哥马利', min: 20, route: 'Route 211',
    enDrive: "From the historic Village of Montgomery, Route 211 leads to us in about twenty minutes — a pleasant drive along the Wallkill that ends, fittingly, in a calm and unhurried treatment. It's a favorite reset for folks who like to make an outing of it.",
    zhDrive: "从历史悠久的蒙哥马利村出发，沿211公路约二十分钟即达——一段沿沃尔基尔河的宜人车程，恰好以一场从容平静的护理收尾。对于喜欢顺道出游的人来说，这是深受欢迎的放松之选。" },
  { slug: 'pine-bush', en: 'Pine Bush', zh: '派恩布什', min: 20, route: 'Route 302',
    enDrive: "Pine Bush guests reach us in roughly twenty minutes along Route 302. It's worth the drive from the village for a spa that publishes every price, speaks both English and 中文, and keeps the same menu open seven days a week.",
    zhDrive: "派恩布什的客人沿302公路约二十分钟即可抵达。为了一家公开每项价格、中英文皆通、且全周无休保持同一菜单的水疗，从镇上专程一趟也十分值得。" },
  { slug: 'otisville', en: 'Otisville', zh: '奥蒂斯维尔', min: 12, route: 'Route 211 West',
    enDrive: "Otisville is a short twelve-minute hop east on Route 211. Whether you're driving in from the hamlet for foot reflexology after a long shift or a deep-tissue session on the weekend, we keep things simple, transparent, and easy to book.",
    zhDrive: "奥蒂斯维尔沿211公路向东，仅约十二分钟的短途车程。无论您是值完长班后从村里赶来做足部反射疗法，还是周末来一场深层组织按摩，我们都让一切保持简单、透明、易于预约。" },
  { slug: 'washingtonville', en: 'Washingtonville', zh: '华盛顿维尔', min: 20, route: 'Routes 208 & 94',
    enDrive: "From Washingtonville, Routes 208 and 94 bring you over in about twenty minutes. It's an easy add-on to a day at Brotherhood Winery — swap the tasting room for a treatment room and let a massage or facial round out the afternoon.",
    zhDrive: "从华盛顿维尔经208号与94号公路过来约二十分钟。把它顺道加进兄弟会酒庄的一日行程再合适不过——将品酒室换作护理室，让一场按摩或面部护理为午后画上句点。" },
  { slug: 'new-hampton', en: 'New Hampton', zh: '新汉普顿', min: 10, route: 'Route 17M West',
    enDrive: "New Hampton is just ten minutes west on Route 17M. From the crossroads you're only minutes from a full menu of massage, reflexology, and body care — close enough to make a standing weekly appointment genuinely effortless.",
    zhDrive: "新汉普顿沿17M公路向西仅约十分钟。从十字路口出发，您距离按摩、反射疗法与身体护理的完整菜单只有几分钟之遥——近到把每周固定预约真正变成轻而易举的事。" },
];
for (const tn of TOWNS) {
  const enCtx = tn.enDrive;
  const zhCtx = tn.zhDrive;
  pages.push({
    slug: `massage-${tn.slug}-ny`, pageType: 'seo-near-location', serviceRef: 'swedish-massage', townSlug: tn.slug,
    en: { h1: `Massage near ${tn.en}, NY`, title: clip(`Massage near ${tn.en}, NY | Spa Paradise`, 60), desc: clip(`Licensed massage serving ${tn.en}, NY — about ${tn.min} min from Middletown via ${tn.route}. Transparent pricing, open every day.`, 155), kw: [`massage ${tn.en.toLowerCase()} ny`, `massage near ${tn.en.toLowerCase()}`], cluster: `near-${tn.slug}`, _drive: enCtx },
    zh: { h1: `${tn.zh}附近的按摩`, title: clip(`${tn.zh}附近的按摩 | 天堂水疗`, 60), desc: clip(`服务${tn.zh}的持牌按摩——距米德尔敦约${tn.min}分钟（沿${tn.route}）。价格透明，每天营业。`, 155), kw: [`${tn.zh}按摩`, `${tn.zh}附近按摩`], cluster: `near-${tn.slug}`, _drive: zhCtx },
  });
}

function buildContent(p, loc) {
  const d = p[loc];
  const seo = {
    title: d.title, description: d.desc, h1: d.h1,
    canonicalUrl: `/${loc}/${p.slug}`,
    schema: p.pageType === 'seo-condition' ? ['Service', 'FAQPage'] : p.pageType === 'seo-resource' ? ['Article', 'FAQPage'] : p.pageType === 'seo-near-location' ? ['LocalBusiness', 'FAQPage'] : ['Service', 'Offer', 'FAQPage'],
    keywords: d.kw, noindex: false, changefreq: 'monthly', priority: 0.7,
    keywordCluster: d.cluster, pageType: p.pageType,
  };
  // Section stack per pageType. Resources carry real article content; service/condition
  // bodies are concise (enrichable via admin).
  let sections;
  if (p.pageType === 'seo-resource') {
    const res = d._res;
    sections = [
      { articleHero: { headline: d.h1, directAnswer: res.answer } },
      { richText: { variant: 'article', body: res.body } },
      { reviewedBy: { teamRef: 'mei-lin-chen', dateReviewed: '2026-06-01' } },
    ];
  } else if (p.pageType === 'seo-near-location') {
    sections = [
      { hero: { variant: 'local', headline: d.h1, subline: '' } },
      { richText: { variant: 'driveContext', body: d._drive } },
    ];
  } else if (p.pageType === 'seo-condition') {
    sections = [{ hero: { variant: 'empathy', headline: d.h1, subline: '' } }, { richText: { variant: 'howHelps', body: '' } }, { protectedNotice: { variant: 'seeDoctor', body: 'If your symptoms are severe, worsening, or new, please see a doctor first. Massage is a wellness service and not a substitute for medical care.', locked: true } }];
  } else {
    sections = [{ hero: { variant: 'service', headline: d.h1, subline: '', serviceRef: p.serviceRef } }, { richText: { variant: 'whatItIs', body: '' } }, { menuTable: { variant: 'compact', serviceRef: p.serviceRef, showAddOns: false } }];
  }
  return { slug: p.slug, pageType: p.pageType, serviceRef: p.serviceRef || null, sections, seo, published: true };
}

async function main() {
  let rows = 0, entries = 0;
  for (const p of pages) {
    // registry row
    const { error: regErr } = await supabase.from('site_seo_pages').upsert(
      { site_id: SITE, slug: p.slug, page_type: p.pageType, active: true }, { onConflict: 'site_id,slug' });
    if (regErr) throw new Error(`registry ${p.slug}: ${regErr.message}`);
    rows++;
    // per-locale content
    for (const loc of ['en', 'zh']) {
      const data = buildContent(p, loc);
      const { error } = await supabase.from('content_entries').upsert(
        { site_id: SITE, locale: loc, path: `seo-pages/${p.slug}.json`, data, updated_by: 'seed-0D' },
        { onConflict: 'site_id,locale,path' });
      if (error) throw new Error(`${loc}/${p.slug}: ${error.message}`);
      entries++;
    }
  }
  const counts = pages.reduce((a, p) => ((a[p.pageType] = (a[p.pageType] || 0) + 1), a), {});
  console.log(`Registered ${rows} site_seo_pages rows + ${entries} content entries.`);
  console.log('By type:', JSON.stringify(counts));
}
main().catch((e) => { console.error('SEO seed error:', e.message); process.exit(1); });
