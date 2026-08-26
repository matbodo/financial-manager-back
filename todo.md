markdown_content = """# 📋 Financial Manager Backend - Plano de Ação e Segurança

Este documento contém o checklist de implementações necessárias para refatorar, proteger e escalar a API do seu gerenciador financeiro. As tarefas estão divididas por prioridade e contexto.

---

## 🏗️ 1. Arquitetura e Organização (Refatoração)

_Atualmente, o projeto concentra responsabilidades no `server.js`. O objetivo aqui é separar as camadas da aplicação._

- [ ] **Implementar Padrão de Arquitetura (MVC/Modular):**
  - Criar pasta `src/` na raiz do projeto.
  - Criar subpastas: `routes/`, `controllers/`, `services/`, e `middlewares/`.
- [ ] **Desacoplar Rotas do Servidor:**
  - Mover as definições de rotas (`app.get`, `app.post`, etc.) do `server.js` para arquivos dentro de `src/routes/`.
- [ ] **Isolar Regras de Negócio:**
  - Garantir que os _controllers_ apenas recebam a requisição e devolvam a resposta.
  - A lógica pesada (cálculos, chamadas ao Prisma) deve ficar na camada de _services_.

---

## 🔒 2. Segurança da Informação (Crítico)

_Tratando-se de um sistema financeiro, as defesas contra invasões e vazamento de dados devem ser prioridade._

- [ ] **Ocultar Headers do Express (Helmet):**
  - Instalar: `npm install helmet`
  - Implementar no `server.js`: `app.use(helmet())`
- [ ] **Validação Estrita de Dados (Sanitization):**
  - Instalar biblioteca de validação (ex: **Zod** ou **Joi**).
  - Criar _middlewares_ para validar `req.body` antes de chegar no controller (garantir que valores de transações sejam estritamente numéricos e que não haja injeção de scripts).
- [ ] **Autenticação e Criptografia:**
  - Implementar hash de senhas de usuários com `bcrypt`. **Nunca** salvar senhas em texto puro.
  - Configurar emissão e validação de tokens JWT (`jsonwebtoken`) para proteger as rotas financeiras.
- [ ] **Limitação de Taxa de Requisições (Rate Limiting):**
  - Instalar: `npm install express-rate-limit`
  - Configurar um limite (ex: 100 requisições por IP a cada 15 minutos) para evitar ataques de força bruta ou DDoS.
- [ ] **Revisão do CORS:**
  - Confirmar se o `FRONTEND_URL` configurado aceita requisições _apenas_ do domínio oficial de produção e do `localhost` durante o desenvolvimento.

---

## 💾 3. Banco de Dados e Funcionalidades (Prisma)

_Melhorias no `schema.prisma` para tornar a aplicação mais robusta para relatórios e gestão._

- [ ] **Relacionamentos e Categorização:**
  - Criar tabela `Category` (Categorias de receita/despesa).
  - Estabelecer relação 1:N entre Categorias e Transações.
- [ ] **Exclusão Lógica (Soft Delete):**
  - Adicionar o campo `deletedAt DateTime?` nos modelos principais.
  - Alterar as rotas de `DELETE` para apenas atualizar este campo, preservando o histórico financeiro sem excluir definitivamente a linha do banco.
- [ ] **Paginação de Dados:**
  - Implementar parâmetros `page` e `limit` nas rotas de listagem (GET).
  - Utilizar `skip` e `take` no Prisma para não travar a API ao carregar grandes volumes de dados de uma vez.

---

## 🛠️ 4. Fluxo de Trabalho (Dica de Produtividade)

- [ ] **Gestão de Tarefas:** Adicione estes itens ao seu board no **Jira** ou como _Issues_ no repositório do **GitHub** para acompanhar o progresso das sprints do projeto.
- [ ] **Desenvolvimento Ágil:** Ao implementar ferramentas padrão como Zod, Bcrypt ou middlewares de JWT, lembre-se de que assistentes de IA (como o **GitHub Copilot**) podem gerar o _boilerplate_ inicial dessas configurações rapidamente, economizando tempo para você focar na lógica de negócios financeira.

"""

with open("/mnt/data/financial-manager-todo.md", "w", encoding="utf-8") as file:
file.write(markdown_content)

print("File generated successfully.")
