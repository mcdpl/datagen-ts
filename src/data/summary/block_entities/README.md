# Block entity schemas

Arquivos `.mcdoc` copiados de [SpyglassMC/vanilla-mcdoc](https://github.com/SpyglassMC/vanilla-mcdoc)
(`java/world/block/*.mcdoc`), licenciados sob MIT.

Eles são usados por `scripts/generate-block-entities.ts` para gerar
`src/data/enums/BlockEntityData.ts`. Para atualizar:

```sh
bun scripts/generate-block-entities.ts --refresh
bun scripts/generate-blocks.ts
```

O script filtra os campos pelas anotações `#[since]` / `#[until]` para a
versão alvo (`MCDOC_TARGET_VERSION`, padrão `26.3`).
