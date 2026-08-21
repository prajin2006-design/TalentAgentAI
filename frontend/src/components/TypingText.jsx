import React, { useState, useEffect, useRef } from 'react';
import './TypingText.css';

/**
* TypingText — Premium Progressive Headline Typing Reveal Component
*
* Props:
* - lines: Array of { text: string, className?: string, cursorClass?: string }
*   OR text: string
* - speed: base typing speed in ms (default 42ms)
* - delay: initial start delay in ms (default 500ms)
* - cursor: boolean (default true)
* - onComplete: callback function invoked when typing finishes
*/
export const TypingText = ({
lines = [
{ text: 'YOUR CAREER.', className: 'black-text', cursorClass: 'black-cursor' },
{ text: 'UNDERSTOOD.', className: 'blue-text', cursorClass: 'blue-cursor' }
],
text = null,
speed = 42,
delay = 500,
cursor = true,
onComplete
}) => {
// Normalize input into structured lines
const normalizedLines = text
? [{ text, className: '', cursorClass: 'blue-cursor' }]
: lines;

const [revealedChars, setRevealedChars] = useState(() => normalizedLines.map(() => 0));
const [currentLineIdx, setCurrentLineIdx] = useState(0);
const [isTypingActive, setIsTypingActive] = useState(false);
const [isComplete, setIsComplete] = useState(false);
const [showCursor, setShowCursor] = useState(cursor);
const [cursorBlink, setCursorBlink] = useState(true);

const timerRef = useRef(null);
const onCompleteRef = useRef(onComplete);
onCompleteRef.current = onComplete;

useEffect(() => {
// Check reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
setRevealedChars(normalizedLines.map((l) => l.text.length));
setIsComplete(true);
setShowCursor(false);
if (onCompleteRef.current) onCompleteRef.current();
return;
}

// Initial start delay
const startTimer = setTimeout(() => {
setIsTypingActive(true);
}, delay);

return () => {
clearTimeout(startTimer);
if (timerRef.current) clearTimeout(timerRef.current);
};
}, [delay]);

// Cursor blinking loop
useEffect(() => {
if (isComplete || !showCursor) {
const fadeTimer = setTimeout(() => {
setShowCursor(false);
}, 350);
return () => clearTimeout(fadeTimer);
}

const blinkInterval = setInterval(() => {
setCursorBlink((prev) => !prev);
}, 480);

return () => clearInterval(blinkInterval);
}, [isComplete, showCursor]);

// Main typing engine with natural human speed variance
useEffect(() => {
if (!isTypingActive || isComplete) return;

const line = normalizedLines[currentLineIdx];
if (!line) return;

const currentLen = revealedChars[currentLineIdx] || 0;
const targetLen = line.text.length;

if (currentLen < targetLen) {
// Natural randomized cadence (35ms - 55ms)
const variance = (Math.random() - 0.5) * 16;
// Slight pause on punctuation
const char = line.text[currentLen];
const pause = char === '.' || char === ',' || char === '?' ? 80 : 0;
const nextDelay = Math.max(28, speed + variance + pause);

timerRef.current = setTimeout(() => {
setRevealedChars((prev) => {
const next = [...prev];
next[currentLineIdx] = currentLen + 1;
return next;
});
}, nextDelay);
} else {
// Move to next line or complete
if (currentLineIdx < normalizedLines.length - 1) {
// Line-break pause (~140ms)
timerRef.current = setTimeout(() => {
setCurrentLineIdx((prev) => prev + 1);
}, 140);
} else {
// Finished all lines!
setIsComplete(true);
if (onCompleteRef.current) {
onCompleteRef.current();
}
}
}

return () => {
if (timerRef.current) clearTimeout(timerRef.current);
};
}, [isTypingActive, currentLineIdx, revealedChars, isComplete, normalizedLines, speed]);

return (
<div className="typing-text-container" aria-label={normalizedLines.map((l) => l.text).join(' ')}>
{normalizedLines.map((line, idx) => {
const fullText = line.text;
const visibleCount = revealedChars[idx] || 0;
const visibleText = fullText.slice(0, visibleCount);
const invisibleText = fullText.slice(visibleCount);
const isCurrentActiveLine = currentLineIdx === idx && !isComplete;

return (
<span key={idx} className={`typing-line ${line.className || ''}`}>
{/* Visible typed characters */}
<span className="typed-visible">{visibleText}</span>

{/* Blinking inline cursor immediately after current text */}
{isCurrentActiveLine && showCursor && (
<span
className={`typing-cursor ${line.cursorClass || 'blue-cursor'} ${
cursorBlink ? 'cursor-visible' : 'cursor-hidden'
}`}
aria-hidden="true"
/>
)}

{/* Invisible ghost characters to reserve exact layout dimensions & prevent jump */}
<span className="typed-ghost" aria-hidden="true">
{invisibleText}
</span>
</span>
);
})}
</div>
);
};

export default TypingText;
