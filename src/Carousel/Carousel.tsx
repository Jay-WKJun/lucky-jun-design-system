import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import classNames from 'classnames';

import useInterval from '../hooks/useInterval';
import styles from './Carousel.module.scss';

const TRANSFORM = 'transform';
let widthOfEachContent = 0;
let initialPos = -1;
let currentPos = -1;

function calcPercentageNumber(number: number) {
  return number * 100;
}

function calcPercentageOfTouchMoveOffsetX(
  current: number,
  initial: number,
  totalWidth: number,
) {
  return Math.round(calcPercentageNumber(current - initial) / totalWidth);
}

function getTranslateXStyle(xPositionPercentage: number) {
  return `transform: translateX(${xPositionPercentage}%); `;
}

function getTransitionStyle(transitionOption: string) {
  return `transition: ${transitionOption}; `;
}

export interface ForwardingRefs {
  setTranslateXStyleInCarousel: (page: number, transitionOption: string) => void
}

interface CarouselProps {
  pageIndicator?: 'dot' | 'counter'
  className?: string
  autoPaging?: boolean
  children: React.ReactChild[]
  transitionDuration?: number
  pageState?: [number, React.Dispatch<React.SetStateAction<number>>]
  needHeightResizing?: boolean
}

const Carousel = forwardRef<ForwardingRefs, CarouselProps>(({
  pageIndicator,
  className,
  children,
  autoPaging = false,
  transitionDuration = 0.5,
  pageState,
  needHeightResizing = false,
}, forwardingRef) => {
  const localState = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const carouselRef = useRef<HTMLUListElement>(null);
  const carouselOuterRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useMemo(() => (
    pageState || localState
  ), [pageState, localState]);

  useEffect(() => {
    if (carouselRef.current) {
      widthOfEachContent = carouselRef.current.clientWidth;
    }
  }, []);

  const setTranslateXStyleInCarousel = useCallback((
    page: number,
    transitionOption: string,
  ) => {
    carouselRef.current?.setAttribute('style', `
      ${getTranslateXStyle(-calcPercentageNumber(page))}
      ${getTransitionStyle(transitionOption)}
    `);
  }, [carouselRef]);

  useImperativeHandle(forwardingRef, () => ({
    setTranslateXStyleInCarousel,
  }));

  useInterval(() => {
    if (
      autoPaging
      && !isDragging
    ) {
      setCurrentPage((prev) => {
        const transitionOption = `${TRANSFORM} ${transitionDuration}s`;
        const nextPage = prev >= carouselRef.current!.children.length - 1 ? 0 : prev + 1;
        setTranslateXStyleInCarousel(nextPage, transitionOption);

        return nextPage;
      });
    }
  }, 5000);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (carouselRef.current) {
      initialPos = e.changedTouches[0].clientX;
      currentPos = e.changedTouches[0].clientX;
      setTranslateXStyleInCarousel(currentPage, 'none');
      setIsDragging(true);
    }
  }, [currentPage, setTranslateXStyleInCarousel]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (carouselRef.current) {
      currentPos = e.changedTouches[0].clientX;
      setTranslateXStyleInCarousel(
        -calcPercentageNumber(currentPage) + calcPercentageOfTouchMoveOffsetX(
          currentPos,
          initialPos,
          widthOfEachContent,
        ),
        'none',
      );
      carouselRef.current.setAttribute('style', `${getTranslateXStyle(
        -calcPercentageNumber(currentPage) + calcPercentageOfTouchMoveOffsetX(
          currentPos,
          initialPos,
          widthOfEachContent,
        ),
      )
      })`);
    }
  }, [currentPage, setTranslateXStyleInCarousel]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (carouselRef.current) {
      const offsetX = Math.round(((currentPos - initialPos) / widthOfEachContent) * 100);
      const transitionOption = `${TRANSFORM} ${transitionDuration}s`;

      if (offsetX > 30) {
        // go to left side
        if (currentPage <= 0) {
          setTranslateXStyleInCarousel(currentPage, transitionOption);
        } else {
          setTranslateXStyleInCarousel(currentPage - 1, transitionOption);
          setCurrentPage(currentPage - 1);
        }
      } else if (offsetX < -30) {
        // go to right side
        if (currentPage >= carouselRef.current.children.length - 1) {
          setTranslateXStyleInCarousel(currentPage, transitionOption);
        } else {
          setTranslateXStyleInCarousel(currentPage + 1, transitionOption);
          setCurrentPage(currentPage + 1);
        }
      } else {
        setTranslateXStyleInCarousel(currentPage, transitionOption);
      }

      setIsDragging(false);
      initialPos = -1;
      currentPos = -1;
    }
  }, [
    currentPage,
    setCurrentPage,
    transitionDuration,
    setTranslateXStyleInCarousel,
  ]);

  const ChildrenComponents = useMemo(() => (
    children.map((child, i) => (
      <li
        className={classNames(
          styles.content,
          needHeightResizing && (currentPage !== i)
            ? 'h-0'
            : 'h-full',
        )}
        // @ts-ignore
        key={child.key}
      >
        {child}
      </li>
    ))
  ), [children, currentPage, needHeightResizing]);

  // TODO: 인디케이터들 모듈처럼 빼기
  const DotComponent = useMemo(() => (
    children.map((child, i) => (
      <li
        className={classNames([
          styles.dot,
          { [styles['dot--selected']]: i === currentPage },
        ])}
        // @ts-ignore
        key={`dot_${child.key}`}
      />
    ))
  ), [children, currentPage]);

  const PageIndicatorComponent = useMemo(() => {
    switch (pageIndicator) {
      case ('dot'):
        return (
          <ul className={styles.dots}>
            { DotComponent }
          </ul>
        );
      case ('counter'):
        return (
          <div className={styles.counter}>
            {`${currentPage + 1}/${children.length}`}
          </div>
        );
      default:
        return null;
    }
  }, [
    pageIndicator,
    DotComponent,
    currentPage,
    children.length,
  ]);

  return (
    <div
      className={classNames(className, styles.wrapper)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={carouselOuterRef}
    >
      <ul
        className={classNames(styles.contents, 'h-auto')}
        ref={carouselRef}
      >
        { ChildrenComponents }
      </ul>

      { PageIndicatorComponent }

    </div>
  );
});

export default Carousel;
