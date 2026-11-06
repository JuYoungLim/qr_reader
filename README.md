# QR 이미지 리더

브라우저 안에서 이미지를 분석해 QR코드 내용을 표시하는 정적 웹사이트입니다.

- 파일 선택, 드래그 앤 드롭, 클립보드 이미지 붙여넣기
- 이미지 미리보기, 결과 복사, HTTP/HTTPS 링크 열기
- PNG, JPEG, WEBP, GIF(첫 프레임), BMP / 최대 20MB
- 이미지 서버 전송 및 저장 없음
- 한 이미지에서 처음 발견한 QR코드 하나를 표시

`dist/index.html`을 브라우저로 열거나 `node preview.cjs` 실행 후 http://localhost:4173 에 접속하세요. 클립보드 자동 복사는 HTTPS 또는 localhost 환경에서 지원됩니다.

QR 디코딩: jsQR 1.4.0 (Apache-2.0), 라이선스는 `dist/vendor/LICENSE-jsQR.txt` 참고.

## Vercel 배포

Vercel에서 이 GitHub 저장소를 Import하면 `vercel.json` 설정을 사용해 `dist` 폴더가 배포됩니다. Framework Preset은 Other이며 별도 설치나 빌드 명령이 필요하지 않습니다.
