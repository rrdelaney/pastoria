import type {PropsWithChildren} from 'react';

import './globals.css';

/**
 * @appRoot
 */
export function AppRoot({children}: PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pastoria Starter</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
