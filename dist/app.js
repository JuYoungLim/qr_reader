'use strict';
const $ = id => document.getElementById(id);
const fileInput = $('file');
let sequence = 0;
let previewURL = null;
let copyTimer;
function clearView() {
  clearTimeout(copyTimer);
  if (previewURL) URL.revokeObjectURL(previewURL);
  previewURL = null;
  $('preview').hidden = true;
  $('preview').removeAttribute('src');
  $('upload-placeholder').hidden = false;
  $('replace').hidden = true;
  $('result').hidden = true;
  $('empty').hidden = false;
  $('result-text').value = '';
  $('open-link').hidden = true;
  $('open-link').removeAttribute('href');
  $('badge').textContent = '대기 중';
  $('badge').className = 'badge';
  $('status').textContent = '';
  $('file-name').textContent = '스크린샷도 사용할 수 있어요';
  $('copy').textContent = '결과 복사';
  $('reset').disabled = true;
  document.querySelector('.result-panel').setAttribute('aria-busy', 'false');
}
function showError(message) {
  $('badge').textContent = '확인 필요';
  $('badge').className = 'badge error';
  $('status').textContent = message;
}
async function readFile(file) {
  if (!file) return;
  const current = ++sequence;
  clearView();
  $('reset').disabled = false;
  if (!/^image\/(png|jpeg|webp|gif|bmp|x-ms-bmp)$/i.test(file.type)) {
    showError('PNG, JPG, WEBP, GIF 또는 BMP 이미지 파일을 선택해 주세요.'); return;
  }
  if (file.size > 20 * 1024 * 1024) { showError('20MB 이하의 이미지를 선택해 주세요.'); return; }
  $('file-name').textContent = file.name || '붙여넣은 이미지';
  $('badge').textContent = '읽는 중…';
  $('status').textContent = '이미지에서 QR코드를 찾고 있어요.';
  document.querySelector('.result-panel').setAttribute('aria-busy', 'true');
  const url = URL.createObjectURL(file);
  previewURL = url;
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (current !== sequence) return;
    if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error('이미지 해상도가 너무 큽니다. QR코드 부분을 잘라 다시 넣어주세요.');
    $('preview').src = url;
    $('preview').hidden = false;
    $('upload-placeholder').hidden = true;
    $('replace').hidden = false;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (current !== sequence) return;
    if (typeof jsQR !== 'function') throw new Error('스캐너를 불러오지 못했습니다. 페이지를 새로고침해 주세요.');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    let code = null;
    for (const maxSide of [1600, 2800]) {
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      code = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
      if (code || scale === 1) break;
      await new Promise(resolve => setTimeout(resolve, 0));
      if (current !== sequence) return;
    }
    if (!code) throw new Error('QR코드를 찾지 못했어요. 코드 전체가 보이는 선명한 이미지로 다시 시도해 주세요.');
    $('empty').hidden = true;
    $('result').hidden = false;
    $('result-text').value = code.data;
    $('badge').textContent = '인식 완료';
    $('badge').className = 'badge success';
    $('status').textContent = 'QR코드 내용을 확인했습니다.';
    $('result-type').textContent = '인식된 텍스트';
    try {
      const link = new URL(code.data);
      if (['https:', 'http:'].includes(link.protocol)) {
        $('open-link').href = link.href;
        $('open-link').hidden = false;
        $('result-type').textContent = '인식된 URL';
      }
    } catch { /* Text QR codes do not have a URL. */ }
  } catch (error) {
    if (current !== sequence) return;
    showError(error.name === 'EncodingError' ? '이미지를 열 수 없어요. 다른 이미지 파일로 다시 시도해 주세요.' : error.message);
  } finally {
    if (current === sequence) document.querySelector('.result-panel').setAttribute('aria-busy', 'false');
  }
}
$('dropzone').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { const file = fileInput.files[0]; fileInput.value = ''; readFile(file); });
for (const event of ['dragenter', 'dragover']) $('dropzone').addEventListener(event, e => { e.preventDefault(); $('dropzone').classList.add('dragover'); });
for (const event of ['dragleave', 'drop']) $('dropzone').addEventListener(event, e => { e.preventDefault(); $('dropzone').classList.remove('dragover'); });
$('dropzone').addEventListener('drop', e => readFile(e.dataTransfer.files[0]));
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());
document.addEventListener('paste', e => {
  const item = Array.from(e.clipboardData?.items || []).find(item => item.type.startsWith('image/'));
  if (item) { e.preventDefault(); readFile(item.getAsFile()); }
});
$('reset').addEventListener('click', () => { sequence++; clearView(); fileInput.value = ''; });
$('copy').addEventListener('click', async () => {
  const current = sequence;
  try {
    await navigator.clipboard.writeText($('result-text').value);
    if (current !== sequence) return;
    $('copy').textContent = '복사 완료 ✓';
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { $('copy').textContent = '결과 복사'; }, 1800);
  } catch {
    $('result-text').focus(); $('result-text').select();
    $('status').textContent = '자동 복사를 사용할 수 없어요. 선택된 내용을 Ctrl+C 또는 ⌘+C로 복사해 주세요.';
  }
});
