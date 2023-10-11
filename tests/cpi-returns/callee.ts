export type Callee = {
  "version": "0.1.0",
  "name": "callee",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "account",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "returnU64",
      "accounts": [
        {
          "name": "account",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": "u64"
    },
    {
      "name": "returnStruct",
      "accounts": [
        {
          "name": "account",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": {
        "defined": "StructReturn"
      }
    },
    {
      "name": "returnVec",
      "accounts": [
        {
          "name": "account",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": "bytes"
    },
    {
      "name": "returnU64FromAccount",
      "accounts": [
        {
          "name": "account",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": "u64"
    }
  ],
  "accounts": [
    {
      "name": "cpiReturnAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "StructReturn",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "u64"
          }
        ]
      }
    }
  ]
};

export const IDL: Callee = {
  "version": "0.1.0",
  "name": "callee",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "account",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "returnU64",
      "accounts": [
        {
          "name": "account",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": "u64"
    },
    {
      "name": "returnStruct",
      "accounts": [
        {
          "name": "account",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": {
        "defined": "StructReturn"
      }
    },
    {
      "name": "returnVec",
      "accounts": [
        {
          "name": "account",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": "bytes"
    },
    {
      "name": "returnU64FromAccount",
      "accounts": [
        {
          "name": "account",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [],
      "returns": "u64"
    }
  ],
  "accounts": [
    {
      "name": "cpiReturnAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "StructReturn",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "value",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
