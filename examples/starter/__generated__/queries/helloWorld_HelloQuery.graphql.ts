/**
 * @generated SignedSource<<688500ab1d469e62a37d54b4f880a087>>
 * @relayHash a21287b6dcc6ef6400fe8857e1ed2a58
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID a21287b6dcc6ef6400fe8857e1ed2a58

import { ConcreteRequest } from 'relay-runtime';
export type helloWorld_HelloQuery$variables = {
  name: string;
};
export type helloWorld_HelloQuery$data = {
  readonly greet: string;
};
export type helloWorld_HelloQuery = {
  response: helloWorld_HelloQuery$data;
  variables: helloWorld_HelloQuery$variables;
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
    "name": "helloWorld_HelloQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "helloWorld_HelloQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "a21287b6dcc6ef6400fe8857e1ed2a58",
    "metadata": {},
    "name": "helloWorld_HelloQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "007441579a01808cd643834407fdedc0";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
