import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';

export default function HomepageFeatures(): ReactNode {
  return (
    <section>
      <div
        className="padding-vert--lg container"
        style={{display: 'flex', justifyContent: 'center'}}
      >
        <div className="row">
          <Heading as="h2">Pastoria!</Heading>
        </div>
      </div>
    </section>
  );
}
