/**
 * @generated SignedSource<<a5e7699bc53a76dfb324e8e29fa450fb>>
 * @relayHash 6e4592e98191f38107831ae55433bee1
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 6e4592e98191f38107831ae55433bee1

import { ConcreteRequest } from 'relay-runtime';
export type searchResults_SearchResultsQuery$variables = {
  query: string;
};
export type searchResults_SearchResultsQuery$data = {
  readonly cities: ReadonlyArray<{
    readonly name: string;
  }>;
};
export type searchResults_SearchResultsQuery = {
  response: searchResults_SearchResultsQuery$data;
  variables: searchResults_SearchResultsQuery$variables;
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
    "name": "searchResults_SearchResultsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "searchResults_SearchResultsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "6e4592e98191f38107831ae55433bee1",
    "metadata": {},
    "name": "searchResults_SearchResultsQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "9a8ffb6b99f0ba9032d9071aebdd8bc5";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
