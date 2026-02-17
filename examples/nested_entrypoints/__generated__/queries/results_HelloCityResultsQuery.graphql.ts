/**
 * @generated SignedSource<<1a25482df84348a731eb6f7d25690b66>>
 * @relayHash e63b243daf6f267a15613c8f923bacd0
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID e63b243daf6f267a15613c8f923bacd0

import { ConcreteRequest } from 'relay-runtime';
export type results_HelloCityResultsQuery$variables = {
  q?: string | null | undefined;
};
export type results_HelloCityResultsQuery$data = {
  readonly cities: ReadonlyArray<{
    readonly name: string;
  }>;
};
export type results_HelloCityResultsQuery = {
  response: results_HelloCityResultsQuery$data;
  variables: results_HelloCityResultsQuery$variables;
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
    "name": "results_HelloCityResultsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "results_HelloCityResultsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "id": "e63b243daf6f267a15613c8f923bacd0",
    "metadata": {},
    "name": "results_HelloCityResultsQuery",
    "operationKind": "query",
    "text": null
  }
};
})();

(node as any).hash = "0b4d4b12aebed5521648d7dca0450805";

import { PreloadableQueryRegistry } from 'relay-runtime';
PreloadableQueryRegistry.set(node.params.id, node);

export default node;
