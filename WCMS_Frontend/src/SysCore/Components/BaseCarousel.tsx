import type * as jquery from "jquery";
declare global {
  interface Window {
    $: typeof jquery;
    jQuery: typeof jquery;
  }
  interface JQuery {
    owlCarousel: (options?: any) => JQuery;
  }
}

interface OwlCarouselProps {
  selectorId: string;       // '#Event' or '#Gallery' or '#Video'
  itemCount: number;        // items: 2 or 3 or 4
}

export function BaseCarousel({ selectorId, itemCount }: OwlCarouselProps) {
  if (typeof window === 'undefined') return;
    if (typeof window.$ !== 'function') return;
    const $el = window.$(selectorId);
    if (!$el || $el.length === 0) return;
    if ($el.length > 0 && typeof $el.owlCarousel === 'function') {
      $el.owlCarousel({items: itemCount, loop: true, dots: true, nav: true, margin: 30, autoplayTimeout: 3000, autoplayHoverPause: true,
        responsive: {
          0: { items: 1 }, 767: { items: 2 }, 991: { items: 3 }, 1200: { items: itemCount },
        },
      });
      // 事件綁定
      window.$(`${selectorId}_start`).on('click', () => {
        $el.trigger('play.owl.autoplay', [6000]);
      });
      window.$(`${selectorId}_pause`).on('click', () => {
        $el.trigger('stop.owl.autoplay');
      });

      window.$(`${selectorId} .owl-nav button`).attr('tabIndex', '7');
    }
};
