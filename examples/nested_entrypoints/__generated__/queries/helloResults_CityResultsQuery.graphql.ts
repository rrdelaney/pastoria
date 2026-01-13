/**
 * @generated SignedSource<<573e1ea6d330eeea5f57a2ecb591f1f2>>
 * @relayHash 247b4b9e8b2b50c2e9fa0e24efa219ae
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 247b4b9e8b2b50c2e9fa0e24efa219ae

import { ConcreteRequest } from 'relay-runtime';
export type helloResults_CityResultsQuery$variables = {
  q?: string | null | undefined;
};
export type helloResults_CityResultsQuery$data = {
  readonly cities: ReadonlyArray<{
    readonly name: string | null | undefined;
  }> | null | undefined;
};
export type helloResults_CityResultsQuery = {
  response: helloResults_CityResultsQuery$data;
  variables: helloResults_CityResultsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "q"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "query",
        "variableName": "q"
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
    "name": "helloResults_CityResultsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "helloResults_CityResultsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "247b4b9e8b2b50c2e9fa0e24efa219ae",
    "metadata": {},
    "name": "helloResults_CityResultsQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "fd799769fa3d4da485b718bd097a74b8";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
