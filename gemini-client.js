const BLUE_SCOUT_AI_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxvyo59LsqRySBpinKRk6lOKrzBlTT7FSu0-xAygrpsmy3s7eOutUlYY4_5dFhSvxGe/exec';

function imageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진을 읽을 수 없어요.'));
    reader.onload = () => {
      const imageUrl = String(reader.result);
      const [head, data] = imageUrl.split(',');
      resolve({
        data,
        mimeType: (head.match(/data:(.*?);/) || [])[1] || 'image/jpeg',
        previewUrl: imageUrl
      });
    };
    reader.readAsDataURL(file);
  });
}

function queryResult(token) {
  return new Promise((resolve) => {
    const callback = `blueScoutResult_${token.replace(/[^a-z0-9]/gi, '')}`;
    const script = document.createElement('script');
    window[callback] = (data) => {
      delete window[callback];
      script.remove();
      resolve(data);
    };
    script.src = `${BLUE_SCOUT_AI_ENDPOINT}?action=result&token=${encodeURIComponent(token)}&callback=${callback}`;
    script.onerror = () => {
      delete window[callback];
      script.remove();
      resolve({ ok: false, pending: true });
    };
    document.head.appendChild(script);
  });
}

async function analyzePhotoWithGemini(file) {
  $('toast').textContent = 'AI가 사진을 분석하고 있어요…';
  $('toast').classList.remove('hidden');
  const photo = await imageData(file);
  const token = `${Date.now()}${Math.random().toString(36).slice(2)}`;
  const frame = document.createElement('iframe');
  frame.name = `blueScoutUpload${token}`;
  frame.hidden = true;
  document.body.appendChild(frame);

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = BLUE_SCOUT_AI_ENDPOINT;
  form.target = frame.name;
  const field = document.createElement('textarea');
  field.name = 'payload';
  field.value = JSON.stringify({ image: photo.data, mimeType: photo.mimeType, token });
  form.appendChild(field);
  document.body.appendChild(form);
  form.submit();

  for (let i = 0; i < 25; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const data = await queryResult(token);
    if (!data.pending) {
      frame.remove();
      form.remove();
      if (!data.ok) throw new Error(data.error || 'AI 분석에 실패했어요.');
      showAiResult(data.result, photo.previewUrl);
      return;
    }
  }
  frame.remove();
  form.remove();
  throw new Error('AI 분석 시간이 초과됐어요.');
}

function showAiResult(result, previewUrl) {
  if (!result.recognized) {
    result = {
      ...result,
      name: '해양 생물로 확인되지 않았어요',
      latin: 'Not a marine target',
      category: '미확인',
      rarity: '-',
      risk: '재촬영 필요',
      confidence: 0,
      points: 0,
      description: '해양 생물·물고기·해양 지질 사진인지 확인하기 어려워요.',
      guide: '대상이 크게 보이도록 다시 촬영해 주세요.'
    };
  }

  current = {
    name: result.name,
    latin: result.latin || '',
    type: result.category || '미확인',
    rarity: result.rarity || '-',
    risk: result.risk || '확인 필요',
    score: Number(result.confidence) || 0,
    emoji: '🐟',
    points: Number(result.points) || 0,
    xp: 80,
    description: result.description || '',
    guide: result.guide || ''
  };

  const resultVisual = $('resultVisual');
  const isMackerel = /고등어|mackerel/i.test(`${current.name} ${current.latin}`);
  const illustrationUrl = isMackerel ? './assets/cute-mackerel.png' : '';
  resultVisual.style.backgroundImage = illustrationUrl ? `url("${illustrationUrl}")` : '';
  resultVisual.style.backgroundPosition = 'center';
  resultVisual.style.backgroundSize = 'cover';
  resultVisual.style.backgroundRepeat = 'no-repeat';
  $('resultEmoji').style.opacity = illustrationUrl ? '0' : '1';

  $('resultEmoji').textContent = current.emoji;
  $('speciesName').textContent = current.name;
  $('latinName').textContent = current.latin;
  $('typeLabel').textContent = current.type;
  $('factType').textContent = current.type;
  $('rarity').textContent = current.rarity;
  $('rarityStatus').textContent = current.rarity;
  $('riskStatus').textContent = current.risk;
  $('confidence').textContent = current.score;
  $('description').textContent = current.description;
  $('guide').textContent = current.guide;
  $('rewardPoint').textContent = current.points;
  $('rewardXp').textContent = current.xp;
  $('saveRecord').disabled = !result.recognized || !current.points;
  screen('resultScreen');
}

function handlePhoto(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  analyzePhotoWithGemini(file).catch((error) => {
    $('toast').textContent = error.message;
    $('toast').classList.remove('hidden');
  });
}
$('fileInput').onchange = (event) => handlePhoto(event.target);
$('cameraInput').onchange = (event) => handlePhoto(event.target);
