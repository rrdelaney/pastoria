/**
 * @generated SignedSource<<cf81a50707a20867893f276f0b575f42>>
 * @relayHash ebc8b7038e09dc4e90a6598c5b310536
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID ebc8b7038e09dc4e90a6598c5b310536

import { ConcreteRequest } from 'relay-runtime';
export type page_OptionalGreetQuery$variables = {
  name?: string | null | undefined;
};
export type page_OptionalGreetQuery$data = {
  readonly optionalGreet: string;
};
export type page_OptionalGreetQuery = {
  response: page_OptionalGreetQuery$data;
  variables: page_OptionalGreetQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "name"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "name",
        "variableName": "name"
      }
    ],
    "kind": "ScalarField",
    "name": "optionalGreet",
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
    "name": "page_OptionalGreetQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "page_OptionalGreetQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "ebc8b7038e09dc4e90a6598c5b310536",
    "metadata": {},
    "name": "page_OptionalGreetQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "2237709886f22f0130bf239a49bbb4c4";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
