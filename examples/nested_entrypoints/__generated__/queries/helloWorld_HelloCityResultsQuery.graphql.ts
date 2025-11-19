/**
 * @generated SignedSource<<1bc7c7bba55492832b900d23436a3935>>
 * @relayHash d0d4c4f69a4432c5b2aaae71e8bf7726
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID d0d4c4f69a4432c5b2aaae71e8bf7726

import {ConcreteRequest} from 'relay-runtime';
export type helloWorld_HelloCityResultsQuery$variables = {
  q?: string | null | undefined;
};
export type helloWorld_HelloCityResultsQuery$data = {
  readonly cities: ReadonlyArray<{
    readonly name: string;
  }>;
};
export type helloWorld_HelloCityResultsQuery = {
  response: helloWorld_HelloCityResultsQuery$data;
  variables: helloWorld_HelloCityResultsQuery$variables;
};

const node: ConcreteRequest = (function () {
  var v0 = [
      {
        defaultValue: null,
        kind: 'LocalArgument',
        name: 'q',
      },
    ],
    v1 = [
      {
        alias: null,
        args: [
          {
            kind: 'Variable',
            name: 'query',
            variableName: 'q',
          },
        ],
        concreteType: 'City',
        kind: 'LinkedField',
        name: 'cities',
        plural: true,
        selections: [
          {
            alias: null,
            args: null,
            kind: 'ScalarField',
            name: 'name',
            storageKey: null,
          },
        ],
        storageKey: null,
      },
    ];
  return {
    fragment: {
      argumentDefinitions: v0 /*: any*/,
      kind: 'Fragment',
      metadata: {
        throwOnFieldError: true,
      },
      name: 'helloWorld_HelloCityResultsQuery',
      selections: v1 /*: any*/,
      type: 'Query',
      abstractKey: null,
    },
    kind: 'Request',
    operation: {
      argumentDefinitions: v0 /*: any*/,
      kind: 'Operation',
      name: 'helloWorld_HelloCityResultsQuery',
      selections: v1 /*: any*/,
    },
    params: {
      id: 'd0d4c4f69a4432c5b2aaae71e8bf7726',
      metadata: {},
      name: 'helloWorld_HelloCityResultsQuery',
      operationKind: 'query',
      text: null,
    },
  };
})();

(node as any).hash = 'f7126fe50498432a8f53417aec61d5ae';

import {PreloadableQueryRegistry} from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
