import { useState, useEffect, useRef } from 'react';

/**
* useScrollReveal — Lightweight, performant IntersectionObserver hook
*
* Options:
* - threshold: ratio of element visible before triggering (default 0.15)
* - rootMargin: margin around root viewport (default '0px 0px -50px 0px')
* - triggerOnce: whether to stay active once triggered (default true)
*/
export const useScrollReveal = ({
threshold = 0.15,
rootMargin = '0px 0px -40px 0px',
triggerOnce = true
} = {}) => {
const [isVisible, setIsVisible] = useState(false);
const elementRef = useRef(null);

useEffect(() => {
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
setIsVisible(true);
return;
}

const element = elementRef.current;
if (!element) return;

const observer = new IntersectionObserver(
([entry]) => {
if (entry.isIntersecting) {
setIsVisible(true);
if (triggerOnce) {
observer.unobserve(element);
}
} else if (!triggerOnce) {
setIsVisible(false);
}
},
{ threshold, rootMargin }
);

observer.observe(element);

return () => {
observer.disconnect();
};
}, [threshold, rootMargin, triggerOnce]);

return [elementRef, isVisible];
};

export default useScrollReveal;
