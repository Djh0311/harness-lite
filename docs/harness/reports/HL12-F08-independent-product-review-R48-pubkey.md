# HL12F08 R48 pre-registered reviewer key

This public key is registered before the R48 final evidence/attestation. It is
not a product or release key. The corresponding private key remains in the
independent reviewer's disposable `/tmp` directory and is not written to the
workspace or candidate.

reviewer: `hl12-f08-independent-reviewer-r48`
algorithm: Ed25519
fingerprint: `sha256:bd245407e5bc90a4a77878b30b97ff58a04cfaf302bb1601cdd7eec8634cb6d1`

```text
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAITJS5sMVV8hOwe4aLAnVcvx+3O2SzF36mBoM/fqjLbY=
-----END PUBLIC KEY-----
```

The key is only valid for a fresh R48 review bound to the new 0.12 candidate;
it must not be used to re-sign the dba60/R44 historical evidence.
