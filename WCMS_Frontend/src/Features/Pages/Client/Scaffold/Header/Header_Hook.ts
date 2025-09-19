import { useEffect } from 'react';

export function useHeaderBehaviorRef(headerRef: React.RefObject<HTMLElement|null>) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const toggleActive = () => {
      if (!headerEl.classList.contains('active')) {
        headerEl.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        headerEl.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    };

    const btnMain = headerEl.querySelector('button.main');
    const btnClose = headerEl.querySelector('button.closemain');
    const overlay = headerEl.querySelector('div.overlayer');

    btnMain?.addEventListener('click', toggleActive);
    btnClose?.addEventListener('click', toggleActive);
    overlay?.addEventListener('click', toggleActive);

    const handleScroll = () => {
      const scroll = window.scrollY;
      const logos = document.querySelectorAll('.logo');
      const mains = document.querySelectorAll('.main');

      logos.forEach((el) => el.classList.toggle('hide', scroll >= 100));
      mains.forEach((el) => el.classList.toggle('bg-custom-s5', scroll >= 100));
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      btnMain?.removeEventListener('click', toggleActive);
      btnClose?.removeEventListener('click', toggleActive);
      overlay?.removeEventListener('click', toggleActive);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headerRef]);
}  

export function handleSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter') {
    const target = event.target as HTMLInputElement;
    if (target.value.trim()) {
      window.open(
        `https://www.google.com.tw/search?hl=zh-TW&as_sitesearch=https%3A%2F%2Ford.ntua.edu.tw%2F&q=${encodeURIComponent(target.value)}`
      );
    }
  }
}
