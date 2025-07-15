// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock Swiper components for testing
jest.mock('swiper/react', () => ({
  Swiper: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'swiper', ...props }, children),
  SwiperSlide: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'swiper-slide', ...props }, children),
}));

jest.mock('swiper/modules', () => ({
  Navigation: {},
  Pagination: {},
  Mousewheel: {},
  Keyboard: {},
}));

// Mock Swiper CSS imports
jest.mock('swiper/css', () => {});
jest.mock('swiper/css/navigation', () => {});
jest.mock('swiper/css/pagination', () => {});
jest.mock('swiper/css/mousewheel', () => {});
