/**
 * @generated SignedSource<<dfcdfce04e4f0cc9e66be602a924b085>>
 * @relayHash c3ae55d1215512a4fa3ec7dbe986e35c
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID c3ae55d1215512a4fa3ec7dbe986e35c

import { ConcreteRequest } from 'relay-runtime';
export type searchResults_Query$variables = {
  query?: string | null | undefined;
};
export type searchResults_Query$data = {
  readonly cities: ReadonlyArray<{
    readonly name: string;
  }>;
};
export type searchResults_Query = {
  response: searchResults_Query$data;
  variables: searchResults_Query$variables;
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
    "name": "searchResults_Query",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "searchResults_Query",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "c3ae55d1215512a4fa3ec7dbe986e35c",
    "metadata": {},
    "name": "searchResults_Query",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "a7bb6d0fa31fb85e520b67b0946c7b2c";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
