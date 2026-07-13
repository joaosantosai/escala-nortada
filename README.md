# Nortada

Publicação cifrada do calendário familiar Nortada.

O repositório público contém apenas a página cifrada em `docs/`. O HTML original é privado e está excluído pelo `.gitignore`.

## Atualizar o site

No computador que contém o HTML original, executar:

```powershell
powershell -ExecutionPolicy Bypass -File tools/prompt-and-build.ps1
```

Será pedida localmente a palavra-passe. Depois de gerar `docs/index.html`, publicar a alteração no GitHub.

Não adicionar o ficheiro `escala-nortada-2026-2028.html` ao Git.

