/**
 * @generated SignedSource<<e6dbaafa8e6827fddc6f79b05c444193>>
 * @relayHash f3c9f8095b88d8ae99732233554f7fa1
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID f3c9f8095b88d8ae99732233554f7fa1

import { ConcreteRequest } from 'relay-runtime';
export type page_HelloQuery$variables = {
  name: string;
};
export type page_HelloQuery$data = {
  readonly greet: string | null | undefined;
};
export type page_HelloQuery = {
  response: page_HelloQuery$data;
  variables: page_HelloQuery$variables;
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
    "name": "page_HelloQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "page_HelloQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "f3c9f8095b88d8ae99732233554f7fa1",
    "metadata": {},
    "name": "page_HelloQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "c40f3dac746aff09c77dfd5912e4f66e";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
