/**
 * @generated SignedSource<<1217ab0cbdfa7d105aac8dae1661b0a8>>
 * @relayHash a096353c012198ad990cf0791d4cd266
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID a096353c012198ad990cf0791d4cd266

import { ConcreteRequest } from 'relay-runtime';
export type banner_HelloBannerQuery$variables = Record<PropertyKey, never>;
export type banner_HelloBannerQuery$data = {
  readonly helloMessage: string;
};
export type banner_HelloBannerQuery = {
  response: banner_HelloBannerQuery$data;
  variables: banner_HelloBannerQuery$variables;
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
    "name": "banner_HelloBannerQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "banner_HelloBannerQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "id": "a096353c012198ad990cf0791d4cd266",
    "metadata": {},
    "name": "banner_HelloBannerQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "23198b8c9dc047cd5e24efa6b0f85f61";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
