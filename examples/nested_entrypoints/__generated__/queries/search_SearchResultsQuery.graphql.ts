/**
 * @generated SignedSource<<1bd8161867cfd4ddd277fa60c52728ff>>
 * @relayHash 976a7f67a139b2c31e8e83558b5e3660
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 976a7f67a139b2c31e8e83558b5e3660

import { ConcreteRequest } from 'relay-runtime';
export type search_SearchResultsQuery$variables = {
  query: string;
};
export type search_SearchResultsQuery$data = {
  readonly cities: ReadonlyArray<{
    readonly name: string;
  }>;
};
export type search_SearchResultsQuery = {
  response: search_SearchResultsQuery$data;
  variables: search_SearchResultsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "query"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "query",
        "variableName": "query"
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
    "name": "search_SearchResultsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "search_SearchResultsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "976a7f67a139b2c31e8e83558b5e3660",
    "metadata": {},
    "name": "search_SearchResultsQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "439b17d006161a5e54d8f6f4b864c9e6";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
