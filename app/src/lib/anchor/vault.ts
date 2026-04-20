/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/vault.json`.
 */
export type Vault = {
  "address": "7qmi9b1z7DvDMRDhFf6nzahtCkuA5xRaesv3QphT4gQJ",
  "metadata": {
    "name": "vault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Arena vault — USDC LP pool with LMSR backstop"
  },
  "instructions": [
    {
      "name": "initializePool",
      "discriminator": [
        95,
        180,
        10,
        172,
        84,
        174,
        232,
        40
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "market"
        },
        {
          "name": "collateralMint"
        },
        {
          "name": "yesMint"
        },
        {
          "name": "noMint"
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "admin"
              }
            ]
          }
        },
        {
          "name": "lpMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "usdcVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  100,
                  99,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "yesReserves",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  101,
                  115,
                  95,
                  114,
                  101,
                  115,
                  101,
                  114,
                  118,
                  101,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "noReserves",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  95,
                  114,
                  101,
                  115,
                  101,
                  114,
                  118,
                  101,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "provideLiquidity",
      "discriminator": [
        40,
        110,
        107,
        116,
        174,
        127,
        97,
        204
      ],
      "accounts": [
        {
          "name": "provider",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "pool.market",
                "account": "pool"
              },
              {
                "kind": "account",
                "path": "pool.admin",
                "account": "pool"
              }
            ]
          }
        },
        {
          "name": "collateralMint"
        },
        {
          "name": "yesMint"
        },
        {
          "name": "noMint"
        },
        {
          "name": "lpMint",
          "writable": true
        },
        {
          "name": "usdcVault",
          "writable": true
        },
        {
          "name": "yesReserves",
          "writable": true
        },
        {
          "name": "noReserves",
          "writable": true
        },
        {
          "name": "providerUsdc",
          "writable": true
        },
        {
          "name": "providerYes",
          "writable": true
        },
        {
          "name": "providerNo",
          "writable": true
        },
        {
          "name": "providerLp",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "provider"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "lpMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amountUsdc",
          "type": "u64"
        },
        {
          "name": "amountYes",
          "type": "u64"
        },
        {
          "name": "amountNo",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "discriminator": [
        248,
        198,
        158,
        145,
        225,
        117,
        135,
        200
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "pool.market",
                "account": "pool"
              },
              {
                "kind": "account",
                "path": "pool.admin",
                "account": "pool"
              }
            ]
          }
        },
        {
          "name": "collateralMint"
        },
        {
          "name": "yesMint"
        },
        {
          "name": "usdcVault",
          "writable": true
        },
        {
          "name": "yesReserves",
          "writable": true
        },
        {
          "name": "noReserves",
          "docs": [
            "No-leg reserve is read only in this MVP (not transferred). Virtual."
          ]
        },
        {
          "name": "userUsdc",
          "writable": true
        },
        {
          "name": "userYes",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "yesMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "isBuyYes",
          "type": "bool"
        },
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "provider",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "pool.market",
                "account": "pool"
              },
              {
                "kind": "account",
                "path": "pool.admin",
                "account": "pool"
              }
            ]
          }
        },
        {
          "name": "collateralMint"
        },
        {
          "name": "yesMint"
        },
        {
          "name": "noMint"
        },
        {
          "name": "lpMint",
          "writable": true
        },
        {
          "name": "usdcVault",
          "writable": true
        },
        {
          "name": "yesReserves",
          "writable": true
        },
        {
          "name": "noReserves",
          "writable": true
        },
        {
          "name": "providerLp",
          "writable": true
        },
        {
          "name": "providerUsdc",
          "writable": true
        },
        {
          "name": "providerYes",
          "writable": true
        },
        {
          "name": "providerNo",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "vlpAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "zeroAmount",
      "msg": "amount must be greater than zero"
    },
    {
      "code": 6001,
      "name": "alreadySeeded",
      "msg": "pool already seeded; use proportional deposit"
    },
    {
      "code": 6002,
      "name": "notSeeded",
      "msg": "pool not yet seeded"
    },
    {
      "code": 6003,
      "name": "mathOverflow",
      "msg": "math overflow"
    },
    {
      "code": 6004,
      "name": "slippage",
      "msg": "slippage: output below min_out"
    },
    {
      "code": 6005,
      "name": "insufficientReserve",
      "msg": "insufficient reserve"
    },
    {
      "code": 6006,
      "name": "unauthorized",
      "msg": "only admin allowed"
    }
  ],
  "types": [
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market",
            "type": "pubkey"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "collateralMint",
            "type": "pubkey"
          },
          {
            "name": "yesMint",
            "type": "pubkey"
          },
          {
            "name": "noMint",
            "type": "pubkey"
          },
          {
            "name": "lpMint",
            "type": "pubkey"
          },
          {
            "name": "usdcVault",
            "type": "pubkey"
          },
          {
            "name": "yesReserves",
            "type": "pubkey"
          },
          {
            "name": "noReserves",
            "type": "pubkey"
          },
          {
            "name": "lpSupply",
            "type": "u64"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "lpMintBump",
            "type": "u8"
          },
          {
            "name": "usdcVaultBump",
            "type": "u8"
          },
          {
            "name": "yesReservesBump",
            "type": "u8"
          },
          {
            "name": "noReservesBump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
