// 사용자가 제공한 대한민국 생태계교란 생물 목록을 앱 판정에 사용합니다.
const BLUE_SCOUT_INVASIVE_SPECIES = [
  { name: '황소개구리', latin: 'Lithobates catesbeianus', designated: '1998년', aliases: ['황소 개구리'] },
  { name: '파랑볼우럭(블루길)', latin: 'Lepomis macrochirus', designated: '1998년', aliases: ['파랑볼우럭', '블루길'] },
  { name: '큰입배스', latin: 'Micropterus salmoides', designated: '1998년', aliases: ['큰입 배스', '배스'] },
  { name: '붉은귀거북속 전종', latin: 'Trachemys spp.', designated: '2001년', aliases: ['붉은귀거북', '붉은귀 거북', '청거북', 'Trachemys'] },
  { name: '뉴트리아', latin: 'Myocastor coypus', designated: '2009년', aliases: [] },
  { name: '꽃매미', latin: 'Lycorma delicatula', designated: '2012년', aliases: [] },
  { name: '붉은불개미', latin: 'Solenopsis invicta', designated: '2018년', aliases: ['붉은 불개미'] },
  { name: '등검은말벌', latin: 'Vespa velutina nigrithorax', designated: '2019년', aliases: ['등검은 말벌'] },
  { name: '리버쿠터', latin: 'Pseudemys concinna', designated: '2020년 3월 30일', aliases: ['리버 쿠터'] },
  { name: '중국줄무늬목거북', latin: 'Mauremys sinensis', designated: '2020년 3월 30일', aliases: ['중국 줄무늬목거북'] },
  { name: '미국선녀벌레', latin: 'Metcalfa pruinosa', designated: '2020년 3월 30일', aliases: ['미국 선녀벌레'] },
  { name: '갈색날개매미충', latin: 'Ricania shantungensis', designated: '2020년 3월 30일', aliases: ['갈색날개 매미충'] },
  { name: '미국가재', latin: 'Procambarus clarkii', designated: '2020년', aliases: ['미국 가재', '붉은가재'] },
  { name: '악어거북속 전종', latin: 'Macrochelys', designated: '2020년 12월 30일', aliases: ['악어거북', '악어 거북', 'Macrochelys spp.'] },
  { name: '플로리다레드벨리쿠터', latin: 'Pseudemys nelsoni', designated: '2020년 12월 30일', aliases: ['플로리다붉은배거북', '플로리다 레드벨리쿠터'] },
  { name: '긴다리비틀개미', latin: 'Anoplolepis gracilipes', designated: '2020년 12월 30일', aliases: ['긴다리 비틀개미'] },
  { name: '빗살무늬미주메뚜기', latin: 'Melanoplus differentialis', designated: '2020년 12월 30일', aliases: ['빗살무늬 미주메뚜기'] },
  { name: '아르헨티나개미', latin: 'Linepithema humile', designated: '2020년 6월 1일', aliases: ['아르헨티나 개미'] },
  { name: '갈색송어', latin: 'Salmo trutta', designated: '2021년 8월 31일', aliases: ['갈색 송어', '브라운 트라우트'] },
  { name: '늑대거북', latin: 'Chelydra serpentina', designated: '2022년 10월 28일', aliases: ['늑대 거북', '스내핑터틀'] },
  { name: '열대불개미', latin: 'Solenopsis geminata', designated: '2023년 9월 25일', aliases: ['열대 불개미'] },
  { name: '열대긴수염개미', latin: 'Paratrechina longicornis', designated: '2024년 10월 31일', aliases: ['열대 긴수염개미', '미친개미'] }
];

function normalizeSpeciesText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\bspp\.?\b/g, '')
    .replace(/[^0-9a-z가-힣]/g, '');
}

function findInvasiveSpecies(name, latin) {
  const nameKey = normalizeSpeciesText(name);
  const latinKey = normalizeSpeciesText(latin);
  return BLUE_SCOUT_INVASIVE_SPECIES.find((species) => {
    const names = [species.name, ...(species.aliases || [])]
      .map(normalizeSpeciesText);
    const scientificName = normalizeSpeciesText(species.latin);
    return Boolean(nameKey) && names.some((candidate) =>
      candidate && (candidate === nameKey || nameKey.includes(candidate) || candidate.includes(nameKey))
    ) || (scientificName && latinKey &&
      (scientificName === latinKey || latinKey.includes(scientificName) || scientificName.includes(latinKey)));
  }) || null;
}

window.BLUE_SCOUT_INVASIVE_SPECIES = BLUE_SCOUT_INVASIVE_SPECIES;
window.findInvasiveSpecies = findInvasiveSpecies;
