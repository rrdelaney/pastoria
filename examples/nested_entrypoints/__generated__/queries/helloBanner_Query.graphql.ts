/**
 * @generated SignedSource<<d3fdeba81bac3084ffbd447a8a046f01>>
 * @relayHash ecab468d08eff088a39b7c3055094b7c
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID ecab468d08eff088a39b7c3055094b7c

import { ConcreteRequest } from 'relay-runtime';
export type helloBanner_Query$variables = Record<PropertyKey, never>;
export type helloBanner_Query$data = {
  readonly helloMessage: string | null | undefined;
};
export type helloBanner_Query = {
  response: helloBanner_Query$data;
  variables: helloBanner_Query$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "helloMessage",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": {
      "throwOnFieldError": true
    },
    "name": "helloBanner_Query",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "helloBanner_Query",
    "selections": (v0/*: any*/)
  },
  "params": {
    "id": "ecab468d08eff088a39b7c3055094b7c",
    "metadata": {},
    "name": "helloBanner_Query",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "fb2d47bf9b3a262a2670407f26962063";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
