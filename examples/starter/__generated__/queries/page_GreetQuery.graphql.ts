/**
 * @generated SignedSource<<564b5d0831445647e2907defc91bf77f>>
 * @relayHash f4bed0ce754342516a491a8536b2a9f7
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID f4bed0ce754342516a491a8536b2a9f7

import { ConcreteRequest } from 'relay-runtime';
export type page_GreetQuery$variables = {
  name: string;
};
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
    "name": "greet",
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
    "name": "page_GreetQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "page_GreetQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "f4bed0ce754342516a491a8536b2a9f7",
    "metadata": {},
    "name": "page_GreetQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "a26df08116bf1842db5c00da147fcccc";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
