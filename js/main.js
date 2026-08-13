document.addEventListener('DOMContentLoaded', () => {
    // 1. 네비게이션 스무스 스크롤 (바닐라 JS)
    const links = document.querySelectorAll('nav a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // 헤더 높이만큼 오프셋을 주기 위해
                const headerHeight = document.querySelector('.kitsch-header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. 폼 제출 이벤트 핸들링 (UI 임시 로직)
    const worryForm = document.getElementById('worry-form');
    const resultArea = document.getElementById('result-area');
    const loadingUI = document.getElementById('loading');
    const quoteResult = document.getElementById('quote-result');
    const quoteText = document.getElementById('quote-text');
    const resetBtn = document.getElementById('reset-btn');

    if (worryForm) {
        worryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 입력값 확인 (빈 입력은 HTML required로 1차 방어됨)
            const category = document.getElementById('category').value;
            const text = document.getElementById('worry-text').value;

            if (!category || !text.trim()) {
                alert("입력란이 너무 허전하네요! 고민을 적어주셔야 해결책도 나옵니다.");
                return;
            }

            // 로딩 UI 노출
            resultArea.classList.remove('hidden');
            loadingUI.classList.remove('hidden');
            quoteResult.classList.add('hidden');
            
            // 버튼 비활성화 방지
            const submitBtn = worryForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            // TODO: 실제 API 연동은 Phase 3 (api.js)에서 구현될 예정. 
            // 현재는 UI 시뮬레이션을 위해 setTimeout 사용
            setTimeout(() => {
                loadingUI.classList.add('hidden');
                quoteResult.classList.remove('hidden');
                
                // 가짜 임시 결과 텍스트 노출
                quoteText.innerHTML = `(임시 결과)<br>걱정 마세요! 내일의 당신이 오늘의 당신보다 더 똑똑할 수도 있습니다.<br>미룰 수 있을 때까지 미루는 것도 훌륭한 에너지 절약 기술입니다. 🚀`;
                
                submitBtn.disabled = false;
            }, 2000); // 2초 후 로딩 완료 시뮬레이션
        });
    }

    // 3. 리셋 버튼 (다시하기)
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            worryForm.reset();
            resultArea.classList.add('hidden');
            
            // 폼으로 다시 스크롤
            const generatorSection = document.getElementById('generator');
            const headerHeight = document.querySelector('.kitsch-header').offsetHeight;
            window.scrollTo({
                top: generatorSection.getBoundingClientRect().top + window.scrollY - headerHeight - 20,
                behavior: 'smooth'
            });
        });
    }
});
