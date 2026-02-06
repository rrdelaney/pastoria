/**
 * @generated SignedSource<<f07e93f279084534644669cf0a2f61e2>>
 * @relayHash 46474a227b655d6473567b481144bf2e
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 46474a227b655d6473567b481144bf2e

import { ConcreteRequest } from 'relay-runtime';
export type page_DetailsQuery$variables = {
  name: string;
};
export type page_DetailsQuery$data = {
  readonly greet: string | null | undefined;
};
export type page_DetailsQuery = {
  response: page_DetailsQuery$data;
  variables: page_DetailsQuery$variables;
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
    "metadata": null,
    "name": "page_DetailsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "page_DetailsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "46474a227b655d6473567b481144bf2e",
    "metadata": {},
    "name": "page_DetailsQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "c1c7a13df08cf2afee1d5dfdffc350cf";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
