const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Obtém os arquivos alterados no PR comparando com a branch base
 */
async function getChangedFiles(octokit, owner, repo, prNumber, fileExtensions) {
  try {
    console.log('🔍 Obtendo arquivos alterados no PR...');
    
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100
    });

    // Filtra por extensões especificadas
    const extensions = fileExtensions.split(',').map(ext => ext.trim());
    const changedFiles = files
      .filter(file => {
        const fileExt = path.extname(file.filename);
        return extensions.some(ext => fileExt === ext || file.filename.endsWith(ext));
      })
      .filter(file => file.status !== 'removed') // Ignora arquivos removidos
      .map(file => file.filename);

    console.log(`📄 Encontrados ${changedFiles.length} arquivos alterados`);
    changedFiles.forEach(file => console.log(`  - ${file}`));

    return changedFiles;
  } catch (error) {
    console.error('Erro ao obter arquivos alterados:', error);
    throw error;
  }
}

/**
 * Lê o conteúdo dos arquivos alterados
 */
function readFileContents(files) {
  console.log('📖 Lendo conteúdo dos arquivos...');
  
  let combinedContent = '';
  let filesRead = 0;
  let totalSize = 0;
  const maxSize = 100000; // Limite de ~100KB para evitar exceder limites da API

  for (const file of files) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const fileSize = Buffer.byteLength(content, 'utf8');
        
        // Verifica se adicionar este arquivo excederia o limite
        if (totalSize + fileSize > maxSize) {
          console.log(`⚠️  Limite de tamanho atingido. Ignorando: ${file}`);
          continue;
        }

        combinedContent += `\n\n>>>>> ${file}\n`;
        combinedContent += content;
        filesRead++;
        totalSize += fileSize;
      } else {
        console.log(`⚠️  Arquivo não encontrado: ${file}`);
      }
    } catch (error) {
      console.log(`⚠️  Erro ao ler arquivo ${file}:`, error.message);
    }
  }

  console.log(`✅ ${filesRead} arquivos lidos (${(totalSize / 1024).toFixed(2)} KB)`);
  return combinedContent;
}

/**
 * Envia o código para análise no Azure OpenAI
 */
async function analyzeWithAzureOpenAI(code, apiKey, endpoint, deploymentName, systemPrompt) {
  try {
    console.log('🤖 Enviando código para análise no Azure OpenAI...');
    
    const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;
    
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Analise o seguinte código e forneça uma revisão detalhada:\n\n${code}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API retornou erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Resposta inválida da API Azure OpenAI');
    }

    const review = data.choices[0].message.content;
    console.log('✅ Análise concluída com sucesso!');
    
    return review;
  } catch (error) {
    console.error('❌ Erro ao chamar Azure OpenAI:', error);
    throw error;
  }
}

/**
 * Adiciona comentário no PR
 */
async function commentOnPR(octokit, owner, repo, prNumber, comment) {
  try {
    console.log('💬 Adicionando comentário no PR...');
    
    const response = await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment
    });

    console.log(`✅ Comentário adicionado! ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error('❌ Erro ao adicionar comentário:', error);
    throw error;
  }
}

/**
 * Função principal
 */
async function run() {
  try {
    console.log('🚀 Iniciando Code Review com Azure OpenAI...\n');

    // Obtem os inputs da action
    const githubToken = core.getInput('github_token', { required: true });
    const azureApiKey = core.getInput('azure_openai_api_key', { required: true });
    const azureEndpoint = core.getInput('azure_openai_endpoint', { required: true });
    const deploymentName = core.getInput('azure_openai_deployment', { required: true });
    const fileExtensions = core.getInput('file_extensions') || '.cs,.vb,.fs,.xaml,.csproj,.config';
    const systemPrompt = core.getInput('system_prompt') || 
      'Você é um especialista em revisão de código C#/.NET. Analise o código fornecido e identifique: 1) Problemas de segurança, 2) Bugs potenciais, 3) Violações de boas práticas, 4) Oportunidades de melhoria de performance, 5) Sugestões de refatoração. Seja específico e construtivo nas suas recomendações.';

    // Obtem o contexto do GitHub
    const context = github.context;
    const { owner, repo } = context.repo;
    
    // Verifica se é um evento de Pull Request
    if (!context.payload.pull_request) {
      core.setFailed('Esta action deve ser executada apenas em eventos de Pull Request');
      return;
    }

    const prNumber = context.payload.pull_request.number;
    console.log(`📋 PR #${prNumber} - ${owner}/${repo}\n`);

    // Inicializa o cliente do GitHub
    const octokit = github.getOctokit(githubToken);

    // 1. Obtem arquivos alterados
    const changedFiles = await getChangedFiles(octokit, owner, repo, prNumber, fileExtensions);

    if (changedFiles.length === 0) {
      console.log('ℹ️  Nenhum arquivo relevante alterado. Encerrando...');
      const noFilesComment = '🤖 **Revisão de Código Azure OpenAI**\n\n' +
        '> ℹ️ Nenhum arquivo relevante foi alterado neste PR para revisão.\n\n' +
        `Extensões monitoradas: \`${fileExtensions}\``;
      
      await commentOnPR(octokit, owner, repo, prNumber, noFilesComment);
      return;
    }

    // 2. Lê o conteúdo dos arquivos
    const codeContent = readFileContents(changedFiles);

    if (!codeContent || codeContent.trim().length === 0) {
      console.log('⚠️  Conteúdo vazio. Encerrando...');
      return;
    }

    // 3. Analisa com Azure OpenAI
    const review = await analyzeWithAzureOpenAI(
      codeContent,
      azureApiKey,
      azureEndpoint,
      deploymentName,
      systemPrompt
    );

    // 4. Formata o comentário
    const commentBody = `🤖 **Revisão de Código - Azure OpenAI**

---

${review}

---

<details>
<summary>📊 Informações da Análise</summary>

- **Arquivos analisados**: ${changedFiles.length}
- **Modelo**: ${deploymentName}
- **Data**: ${new Date().toLocaleString('pt-BR')}

</details>`;

    // 5. Comenta no PR
    const commentId = await commentOnPR(octokit, owner, repo, prNumber, commentBody);

    // 6. Define outputs
    core.setOutput('comment_id', commentId);
    core.setOutput('files_analyzed', changedFiles.length);
    core.setOutput('review_summary', review.substring(0, 200) + '...');

    console.log('\n✨ Revisão concluída com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro na execução:', error);
    core.setFailed(`Erro ao executar revisão: ${error.message}`);
  }
}

// Executa a action
run();