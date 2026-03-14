/**
 * @generated SignedSource<<a9a70b9803bd3333432ac1eafb43e459>>
 * @relayHash 26a7eec3a0542d5711702ad93d3b77c2
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 26a7eec3a0542d5711702ad93d3b77c2

import { ConcreteRequest } from 'relay-runtime';
export type page_GreetQuery$variables = Record<PropertyKey, never>;
export type page_GreetQuery$data = {
  readonly greet: string;
};
export type page_GreetQuery = {
  response: page_GreetQuery$data;
  variables: page_GreetQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Literal",
        "name": "name",
        "value": "Pastoria"
      }
    ],
    "kind": "ScalarField",
    "name": "greet",
    "storageKey": "greet(name:\"Pastoria\")"
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": {
      "throwOnFieldError": true
    },
    "name": "page_GreetQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "page_GreetQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "id": "26a7eec3a0542d5711702ad93d3b77c2",
    "metadata": {},
    "name": "page_GreetQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "ce41dc61a1bd1a9f994d7ffa5d893d20";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
