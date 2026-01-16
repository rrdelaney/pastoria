/**
 * @generated SignedSource<<7820b633be1da57cca50a652a9c15584>>
 * @relayHash 8121184a0b5af318d403bea9ce55b729
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 8121184a0b5af318d403bea9ce55b729

import { ConcreteRequest } from 'relay-runtime';
export type HelloBannerQuery$variables = Record<PropertyKey, never>;
export type HelloBannerQuery$data = {
  readonly helloMessage: string;
};
export type HelloBannerQuery = {
  response: HelloBannerQuery$data;
  variables: HelloBannerQuery$variables;
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
    "name": "HelloBannerQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "HelloBannerQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "id": "8121184a0b5af318d403bea9ce55b729",
    "metadata": {},
    "name": "HelloBannerQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "df66845a80353f695facb3386617786c";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
