document.addEventListener('DOMContentLoaded', () => {
    const worryForm  = document.getElementById('worry-form');
    const resultArea = document.getElementById('result-area');
    const loadingUI  = document.getElementById('loading');
    const quoteResult = document.getElementById('quote-result');
    const quoteText  = document.getElementById('quote-text');
    const submitBtn  = worryForm ? worryForm.querySelector('button[type="submit"]') : null;
    const saveBtn    = document.getElementById('save-btn');
    const saveToast  = document.getElementById('save-toast');
    const shareBtn   = document.getElementById('share-btn');
    const shareToast = document.getElementById('share-toast');

    // 저장 버튼이 눌릴 때 사용할 현재 처방전 데이터 (클로저 변수)
    let _currentCategory = '';
    let _currentWorry    = '';
    let _currentQuote    = '';

    // 저장 버튼 이벤트
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!_currentQuote) return;
            window.ParadoxMind.Archive.save(_currentCategory, _currentWorry, _currentQuote);

            // 저장 완료 토스트 표시 후 버튼 비활성화 (중복 방지)
            saveBtn.disabled = true;
            saveBtn.textContent = '✅ 저장됨';
            if (saveToast) {
                saveToast.classList.remove('hidden');
                setTimeout(() => saveToast.classList.add('hidden'), 3000);
            }
        });
    }

    // 공유하기 버튼 이벤트 (카카오톡/SNS/클립보드)
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            if (!_currentQuote) return;
            const res = await window.ParadoxMind.sharePrescription(_currentWorry, _currentQuote);
            if (res && res.type === 'clipboard' && shareToast) {
                shareToast.classList.remove('hidden');
                setTimeout(() => shareToast.classList.add('hidden'), 3500);
            }
        });
    }

    if (worryForm) {
        worryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const category = document.getElementById('category').value;
            const text = document.getElementById('worry-text').value;

            // [예외 1: 빈 입력]
            if (!category || !text.trim()) {
                alert("입력란이 너무 허전하네요! 고민을 적어주셔야 해결책도 나옵니다.");
                return;
            }

            // 로딩 UI 노출
            resultArea.classList.remove('hidden');
            loadingUI.classList.remove('hidden');
            quoteResult.classList.add('hidden');
            submitBtn.disabled = true;

            // [예외 2: 타임아웃 10초 설정]
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
                // 백엔드 API 호출 (Vercel Serverless)
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category, text }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // [예외 3: API 오류 4xx/5xx]
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }

                const data = await response.json();
                
                // 현재 처방전 데이터 기록
                _currentCategory = category;
                _currentWorry    = text;
                _currentQuote    = data.quote;

                // [정상 동작] DOM 렌더링
                loadingUI.classList.add('hidden');
                quoteResult.classList.remove('hidden');
                quoteText.innerHTML = data.quote.replaceAll('\n', '<br>');

                // 저장 버튼 초기화 (새 처방전 생성 시 재활성화)
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = '💾 보관함 저장';
                }
                if (saveToast) saveToast.classList.add('hidden');
                if (shareToast) shareToast.classList.add('hidden');
                
            } catch (error) {
                loadingUI.classList.add('hidden');
                quoteResult.classList.remove('hidden');
                
                if (error.name === 'AbortError') {
                    quoteText.innerHTML = "AI가 너무 깊은 깨달음을 얻고 있나 봅니다. 잠시 후 다시 시도해주세요. (요청 시간 15초 초과)";
                } else {
                    quoteText.innerHTML = "현재 우주적 기운이 맞지 않아 명언 제조기가 고장났습니다. 나중에 다시 시도해주세요. (API 연동 오류)";
                }
            } finally {
                submitBtn.disabled = false;
            }
        });
    }
});
