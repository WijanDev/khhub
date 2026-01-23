import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/react-start/client';
import { getRouter } from './router';

const router = getRouter();

// @ts-ignore - StartClient types might be missing router prop in this version
hydrateRoot(document, <StartClient router={router} />);
