/**
 * @generated SignedSource<<1d648e55ef7ffef8f643cf6bad3c2fad>>
 * @relayHash d03c19a9dab11b6c007a14da9688c904
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID d03c19a9dab11b6c007a14da9688c904

import {ConcreteRequest} from 'relay-runtime';
export type helloWorld_HelloBannerQuery$variables = Record<PropertyKey, never>;
export type helloWorld_HelloBannerQuery$data = {
  readonly helloMessage: string;
};
export type helloWorld_HelloBannerQuery = {
  response: helloWorld_HelloBannerQuery$data;
  variables: helloWorld_HelloBannerQuery$variables;
};

const node: ConcreteRequest = (function () {
  var v0 = [
    {
      alias: null,
      args: null,
      kind: 'ScalarField',
      name: 'helloMessage',
      storageKey: null,
    },
  ];
  return {
    fragment: {
      argumentDefinitions: [],
      kind: 'Fragment',
      metadata: {
        throwOnFieldError: true,
      },
      name: 'helloWorld_HelloBannerQuery',
      selections: v0 /*: any*/,
      type: 'Query',
      abstractKey: null,
    },
    kind: 'Request',
    operation: {
      argumentDefinitions: [],
      kind: 'Operation',
      name: 'helloWorld_HelloBannerQuery',
      selections: v0 /*: any*/,
    },
    params: {
      id: 'd03c19a9dab11b6c007a14da9688c904',
      metadata: {},
      name: 'helloWorld_HelloBannerQuery',
      operationKind: 'query',
      text: null,
    },
  };
})();

(node as any).hash = '233a6782a639d8a526aaf209bcce30e0';

import {PreloadableQueryRegistry} from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
