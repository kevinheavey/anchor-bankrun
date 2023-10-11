export type Caller = {
  "version": "0.1.0",
  "name": "caller",
  "instructions": [
    {
      "name": "cpiCallReturnU64",
      "accounts": [
        {
          "name": "cpiReturn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "cpiReturnProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cpiCallReturnStruct",
      "accounts": [
        {
          "name": "cpiReturn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "cpiReturnProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cpiCallReturnVec",
      "accounts": [
        {
          "name": "cpiReturn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "cpiReturnProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "returnU64",
      "accounts": [],
      "args": [],
      "returns": "u64"
    },
    {
      "name": "returnStruct",
      "accounts": [],
      "args": [],
      "returns": {
        "defined": "Struct"
      }
    },
    {
      "name": "returnVec",
      "accounts": [],
      "args": [],
      "returns": {
        "vec": "u64"
      }
    }
  ],
  "types": [
    {
      "name": "Struct",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "a",
            "type": "u64"
          },
          {
            "name": "b",
            "type": "u64"
          }
        ]
      }
    }
  ]
};

export const IDL: Caller = {
  "version": "0.1.0",
  "name": "caller",
  "instructions": [
    {
      "name": "cpiCallReturnU64",
      "accounts": [
        {
          "name": "cpiReturn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "cpiReturnProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cpiCallReturnStruct",
      "accounts": [
        {
          "name": "cpiReturn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "cpiReturnProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cpiCallReturnVec",
      "accounts": [
        {
          "name": "cpiReturn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "cpiReturnProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "returnU64",
      "accounts": [],
      "args": [],
      "returns": "u64"
    },
    {
      "name": "returnStruct",
      "accounts": [],
      "args": [],
      "returns": {
        "defined": "Struct"
      }
    },
    {
      "name": "returnVec",
      "accounts": [],
      "args": [],
      "returns": {
        "vec": "u64"
      }
    }
  ],
  "types": [
    {
      "name": "Struct",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "a",
            "type": "u64"
          },
          {
            "name": "b",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
