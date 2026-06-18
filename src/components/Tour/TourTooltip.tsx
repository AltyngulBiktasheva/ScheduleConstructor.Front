import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Button } from '../Button/Button';
import type { Placement, TourStep } from './types';
import styles from './TourTooltip.module.scss';

interface Props {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
}

function useTargetRect(selector: string | undefined): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    let attempts = 0;
    const poll = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => {
          setRect(el.getBoundingClientRect());
        }, 300);
        clearInterval(poll);
      }
      if (++attempts > 20) clearInterval(poll);
    }, 100);

    return () => clearInterval(poll);
  }, [selector]);

  useEffect(() => {
    if (!selector) return;
    const update = () => {
      const el = document.querySelector(selector);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [selector]);

  return rect;
}

const GAP = 12;
const TOOLTIP_WIDTH = 380;

function calcPosition(
  targetRect: DOMRect,
  tooltipH: number,
  placement: Placement,
): { top: number; left: number; actualPlacement: Placement } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0;
  let left = 0;
  let actual = placement;

  const centerX = targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2;

  switch (placement) {
    case 'bottom':
      top = targetRect.bottom + GAP;
      left = centerX;
      if (top + tooltipH > vh) {
        top = targetRect.top - tooltipH - GAP;
        actual = 'top';
      }
      break;
    case 'top':
      top = targetRect.top - tooltipH - GAP;
      left = centerX;
      if (top < 0) {
        top = targetRect.bottom + GAP;
        actual = 'bottom';
      }
      break;
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipH / 2;
      left = targetRect.right + GAP;
      if (left + TOOLTIP_WIDTH > vw) {
        left = targetRect.left - TOOLTIP_WIDTH - GAP;
        actual = 'left';
      }
      break;
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipH / 2;
      left = targetRect.left - TOOLTIP_WIDTH - GAP;
      if (left < 0) {
        left = targetRect.right + GAP;
        actual = 'right';
      }
      break;
  }

  left = Math.max(8, Math.min(left, vw - TOOLTIP_WIDTH - 8));
  top = Math.max(8, Math.min(top, vh - tooltipH - 8));

  return { top, left, actualPlacement: actual };
}

export const TourTooltip: React.FC<Props> = ({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onStop,
}) => {
  const targetRect = useTargetRect(step.target);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipH, setTooltipH] = useState(200);

  useLayoutEffect(() => {
    if (tooltipRef.current) {
      setTooltipH(tooltipRef.current.offsetHeight);
    }
  });

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!step.target) {
    return null;
  }

  if (!targetRect) {
    return (
      <div className={styles.backdrop}>
        <div className={styles.loading}>Ищем элемент...</div>
      </div>
    );
  }

  const padding = step.highlightPadding ?? 8;
  const cutout = {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  const placement = step.placement || 'bottom';
  const { top, left, actualPlacement } = calcPosition(targetRect, tooltipH, placement);

  const arrowStyle = getArrowStyle(actualPlacement, targetRect, left, top, tooltipH);

  return (
    <>
      <div className={styles.backdrop} onClick={handleBackdropClick} />
      <div
        className={styles.cutout}
        style={{
          top: cutout.top,
          left: cutout.left,
          width: cutout.width,
          height: cutout.height,
        }}
      />
      <div
        ref={tooltipRef}
        className={`${styles.tooltip} ${styles[`placement-${actualPlacement}`]}`}
        style={{ top, left, width: TOOLTIP_WIDTH }}
      >
        <div className={styles.arrow} style={arrowStyle} />

        <div className={styles.header}>
          <span className={styles.counter}>
            Шаг {stepIndex + 1} из {totalSteps}
          </span>
          <button className={styles.closeBtn} onClick={onStop} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.title}>{step.title}</div>
        <div className={styles.content}>{step.content}</div>

        <div className={styles.footer}>
          <Button variant="ghost" size="sm" onClick={onPrev} disabled={stepIndex === 0}>
            Назад
          </Button>
          <div className={styles.footerRight}>
            <Button variant="secondary" size="sm" onClick={onStop}>
              Закончить тур
            </Button>
            <Button variant="primary" size="sm" onClick={onNext}>
              {step.nextLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

function getArrowStyle(
  placement: Placement,
  targetRect: DOMRect,
  tooltipLeft: number,
  tooltipTop: number,
  tooltipH: number,
): React.CSSProperties {
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  switch (placement) {
    case 'bottom':
      return { top: -6, left: Math.max(16, Math.min(targetCenterX - tooltipLeft, TOOLTIP_WIDTH - 16)) };
    case 'top':
      return { bottom: -6, left: Math.max(16, Math.min(targetCenterX - tooltipLeft, TOOLTIP_WIDTH - 16)) };
    case 'right':
      return { left: -6, top: Math.max(16, Math.min(targetCenterY - tooltipTop, tooltipH - 16)) };
    case 'left':
      return { right: -6, top: Math.max(16, Math.min(targetCenterY - tooltipTop, tooltipH - 16)) };
  }
}

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
