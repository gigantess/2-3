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

    // 2. 폼 제출 이벤트 핸들링은 api.js에서 전담합니다.

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
