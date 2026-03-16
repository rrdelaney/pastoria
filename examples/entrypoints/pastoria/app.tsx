import type {PropsWithChildren} from 'react';

import './globals.css';

export default function AppRoot({children}: PropsWithChildren) {
  return (
    <>
      <title>Pastoria Starter</title>
      {children}
    </>
  );
}
