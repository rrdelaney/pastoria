import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Create Pastoria CLI',
      collapsed: false,
      items: [
        'cli/quickstart',
        'cli/workflow',
        'cli/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Starter Project Guide',
      collapsed: false,
      items: [
        'starter/overview',
        'starter/routing-and-entrypoints',
        'starter/graphql',
        'starter/styling',
      ],
    },
  ],
};

export default sidebars;
