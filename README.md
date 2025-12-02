# DevOps Templates & Actions

Este repositório contém uma coleção de templates de pipelines CI/CD e GitHub Actions customizadas para facilitar a automação de processos de DevOps.

## 📂 Estrutura do Repositório

### ☁️ Azure DevOps (`/azure_devops`)

Templates focados em pipelines do Azure DevOps (YAML).

- **`buildimageanddeployacr.yml`**: Template reutilizável para:
  - Build de imagem Docker.
  - Scan de vulnerabilidades com Trivy.
  - Deploy no Azure Container Registry (ACR).
  - (Opcional) Reinício automático de Azure Container Apps.
  - Autenticação via Service Connection.

### 🐙 GitHub (`/github`)

Recursos para GitHub Actions e Workflows.

#### 📄 Templates de Workflow (`/github`)
- **`buildimageanddeployacr.yml`**: Workflow reutilizável (`workflow_call`) para:
  - Build de imagem Docker.
  - Scan de segurança com Trivy.
  - Deploy no ACR.
  - Suporte a autenticação via OIDC/Secrets.

#### ⚡ Actions Customizadas (`/github/actions`)

##### 🤖 Code Review AI (`/github/actions/code_review_act`)
Uma GitHub Action que utiliza **Azure OpenAI** para realizar revisão automática de código em Pull Requests.

- **Principais recursos:**
  - Análise automática de arquivos alterados no PR.
  - Identificação de bugs, falhas de segurança e melhorias de performance.
  - Comentários automáticos no PR com o feedback da IA.
  - Altamente configurável via `system_prompt` e extensões de arquivo.
  - [Guia Rápido (Quick Start)](github/actions/code_review_act/QUICKSTART.md)
  - [Exemplos de Prompts](github/actions/code_review_act/PROMPT_EXAMPLES.md)

---

## 🚀 Como Usar

### Templates de Pipeline
Consulte a documentação interna de cada arquivo YAML para entender os `inputs` (parâmetros) e `secrets` necessários para utilização.

### Code Review Action
Para utilizar a action de Code Review, adicione o seguinte step ao seu workflow:

```yaml
- uses: seu-usuario/devops/github/actions/code_review_act@main
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    azure_openai_api_key: ${{ secrets.AZURE_OPENAI_API_KEY }}
    azure_openai_endpoint: ${{ secrets.AZURE_OPENAI_ENDPOINT }}
    azure_openai_deployment: 'gpt-4'
```

---

**Glauber 2025**
