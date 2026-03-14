/**
 * @generated SignedSource<<9b7b7450fb45ff7167e5681c54bea61b>>
 * @relayHash c1de6c84d2d454fa6273358bb44f5565
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID c1de6c84d2d454fa6273358bb44f5565

import { ConcreteRequest } from 'relay-runtime';
export type page_SearchResultsQuery$variables = {
  q?: string | null | undefined;
};
export type page_SearchResultsQuery$data = {
  readonly cities: ReadonlyArray<{
    readonly name: string;
  }>;
};
export type page_SearchResultsQuery = {
  response: page_SearchResultsQuery$data;
  variables: page_SearchResultsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "q"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "query",
        "variableName": "q"
      }
    ],
    "concreteType": "City",
    "kind": "LinkedField",
    "name": "cities",
    "plural": true,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "name",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": {
      "throwOnFieldError": true
    },
    "name": "page_SearchResultsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "page_SearchResultsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "c1de6c84d2d454fa6273358bb44f5565",
    "metadata": {},
    "name": "page_SearchResultsQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "84157378e602b7cc612bfffe976e1da2";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
