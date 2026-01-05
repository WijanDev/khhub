import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import { getRouter } from './router';

// @ts-ignore - Type definitions may be incorrect for TanStack Start v1.145
export default createStartHandler(() => getRouter())(defaultStreamHandler);
