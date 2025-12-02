# ⚡ Quick Start - 5 Minutos

Comece a usar a Code Review Action em 5 minutos!

## 🎯 Passos Rápidos

### 1️⃣ Configure Azure OpenAI (2 min)

No [Azure Portal](https://portal.azure.com):
1. Vá para seu recurso Azure OpenAI
2. Copie **Key 1** e **Endpoint**
3. Anote o nome do **Deployment** (ex: `gpt-4`)

### 2️⃣ Configure Secrets no GitHub (1 min)

No seu repositório GitHub:
1. `Settings` → `Secrets and variables` → `Actions`
2. Adicione 2 secrets:
   ```
   AZURE_OPENAI_API_KEY = [sua Key 1]
   AZURE_OPENAI_ENDPOINT = https://seu-recurso.openai.azure.com
   ```

### 3️⃣ Adicione o Workflow (2 min)

Crie `.github/workflows/code-review.yml`:

```yaml
name: 🤖 AI Code Review

on:
  pull_request:
    types: [labeled]

jobs:
  review:
    runs-on: ubuntu-latest
    if: github.event.label.name == 'ai-review'
    permissions:
      contents: read
      pull-requests: write
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - uses: your-org/your-repo@main
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          azure_openai_api_key: ${{ secrets.AZURE_OPENAI_API_KEY }}
          azure_openai_endpoint: ${{ secrets.AZURE_OPENAI_ENDPOINT }}
          azure_openai_deployment: 'gpt-4'
```

### 4️⃣ Teste! (30 seg)

1. Crie um PR com alterações em arquivos `.cs`
2. Adicione a label `ai-review`
3. Aguarde a análise aparecer como comentário no PR

## ✅ Pronto!

Sua action está configurada e funcionando!

---

## 🎓 Próximos Passos

### Customize o Prompt

Adicione `system_prompt` no workflow:

```yaml
- uses: your-org/your-repo@main
  with:
    # ... outras configurações
    system_prompt: |
      Você é um especialista em segurança C#.
      Foque em: SQL Injection, XSS, e vulnerabilidades OWASP.
```

### Análise Automática

Remova a condição de label para analisar todos os PRs:

```yaml
on:
  pull_request:
    types: [opened, synchronize]  # Remove 'labeled'

jobs:
  review:
    runs-on: ubuntu-latest
    # Remove: if: github.event.label.name == 'ai-review'
```

### Múltiplas Extensões

Analise mais tipos de arquivo:

```yaml
file_extensions: '.cs,.cshtml,.razor,.vb,.fs,.xaml,.csproj'
```

---

## 🐛 Problemas Comuns

### ❌ "Invalid API Key"
**Solução**: Verifique se copiou a chave completa do Azure Portal

### ❌ "Resource not found"
**Solução**: Confirme que o endpoint não tem `/` no final

### ❌ "Deployment not found"
**Solução**: Verifique o nome exato do deployment no Azure OpenAI Studio

### ❌ Action não comenta
**Solução**: Verifique se o workflow tem `pull-requests: write` nas permissões

---

## 📚 Quer Saber Mais?

- **Configuração detalhada**: Veja [AZURE_SETUP.md](AZURE_SETUP.md)
- **Exemplos de prompts**: Veja [PROMPT_EXAMPLES.md](PROMPT_EXAMPLES.md)
- **Documentação completa**: Veja [README.md](README.md)
- **Testes locais**: Veja [TESTING.md](TESTING.md)

---

## 💬 Suporte

Encontrou um problema? [Abra uma issue](https://github.com/your-org/your-repo/issues)

---

**⏱️ Tempo total**: ~5 minutos  
**💰 Custo por revisão**: ~$0.01-0.30 (dependendo do modelo)  
**✨ Valor**: Inestimável!
