# 📌 Backend Roadmap & TODO List — Financial Manager API

Este documento detalha o plano de ação técnico para a evolução da API do **Financial Manager**. As tarefas estão divididas por fases de prioridade e complexidade.

---

## 🎯 Fase 1: Segurança, Validação e Autenticação

> **Objetivo:** Reforçar a segurança da API e garantir a integridade dos dados trafegados.

- **Validação de Schemas e Data Sanitization**
  - [x] Integrar biblioteca de validação `Zod`.
  - [x] Validar payload das requisições no middleware de entrada para login, registro e criação de registros.
- **Mecanismo de Refresh Tokens**
  - [x] Reduzir o tempo de expiração do `JWT_SECRET` (ex: 15 a 30 minutos).
  - [x] Implementar `refreshToken` (armazenado no banco ou em HTTP-only Cookies) para renovar a sessão sem deslogar o usuário.
- [ ] **Fluxo de Recuperação de Senha**
  - [ ] Criar rota `POST /auth/forgot-password` para envio de e-mail com token temporário (usando _Resend_ ou _Nodemailer_).
  - [ ] Criar rota `POST /auth/reset-password` para troca de senha validadas pelo token.
- **Proteção contra Abuso (Rate Limiting)**
  - [ ] Adicionar `express-rate-limit` para prevenir ataques de força bruta nas rotas `/login` e `/register`.

---

## 📂 Fase 2: Categorização, Orçamentos e Filtros

> **Objetivo:** Dar flexibilidade para o usuário organizar e consultar suas finanças com precisão.

- [ ] **Gerenciamento de Categorias (CRUD)**
  - [ ] Criar tabela `Category` no `schema.prisma` com campos: `id`, `name`, `color`, `icon`, `userId`.
  - [ ] Vincular `Gasto` e `Renda` às categorias.
  - [ ] Implementar rotas `/categorias` (`GET`, `POST`, `PUT`, `DELETE`).
- [ ] **Orçamentos Mensais (Metas por Categoria)**
  - [ ] Criar tabela `Budget` no `schema.prisma` com limite de gastos estipulado pelo usuário.
  - [ ] Criar rota de consulta de status do orçamento (`/budgets/status`) que calcula gastos atuais vs. limite definido.
- [ ] **Filtros Avançados e Paginação**
  - [ ] Atualizar rotas de listagem (`/gastos`, `/investimentos`, `/assinaturas`) para suportar _query params_:
    - `page` e `limit` (paginação de resultados).
    - `startDate` e `endDate` (filtro por intervalo de datas).
    - `categoryId` (filtro por categoria específica).
    - `sortBy` e `order` (ordenação por valor, data, etc.).

---

## 🔄 Fase 3: Automações e Agendamento (Cron Jobs)

> **Objetivo:** Automatizar tarefas repetitivas e garantir atualização em tempo real sem intervenção manual.

- [ ] **Processamento de Assinaturas Recorrentes**
  - [ ] Integrar biblioteca de agendamento de tarefas (`node-cron`).
  - [ ] Criar rotina diária (executada à meia-noite) que verifica assinaturas ativas com vencimento no dia e lança o valor automaticamente na tabela de `Gasto`.
- [ ] **Notificações por E-mail / Push**
  - [ ] Enviar lembretes prévios de vencimento de assinaturas e faturas ativas 3 dias antes do vencimento.

---

## 📊 Fase 4: Relatórios Avançados e Exportação

> **Objetivo:** Permitir ao usuário extrair relatórios detalhados da sua saúde financeira.

- [ ] **Endpoint Consolidado de Análise (`GET /resumo/analitico`)**
  - [ ] Calcular taxa de poupança mensal (`(Renda Total - Gastos Totais) / Renda Total * 100`).
  - [ ] Agrupar gastos por categoria em formato pronto para gráficos de rosca (`pie chart`).
  - [ ] Retornar evolução patrimonial dos últimos 6 meses.
- [ ] **Exportação de Dados**
  - [ ] Criar rota `GET /export/csv` para download da planilha de movimentações em formato CSV.
  - [ ] Criar rota `GET /export/pdf` para geração de relatório financeiro formatado em PDF (utilizando `pdfkit` ou `puppeteer`).

---

## 🏛️ Fase 5: Expansão de Arquitetura (Múltiplas Contas & Cartões)

> **Objetivo:** Evoluir o modelo de dados para suportar gerenciamento de múltiplas bancas e faturas de cartão.

- [ ] **Gestão de Contas (`Account`)**
  - [ ] Modelar contas no Prisma (ex: Banco Inter, Nubank, Carteira de Dinheiro).
  - [ ] Permitir vincular receitas e despesas a uma conta específica com atualização dinâmica de saldo.
- [ ] **Gestão de Cartões de Crédito**
  - [ ] Modelar controle de faturas (data de fechamento e data de vencimento).
  - [ ] Agrupar compras parceladas distribuindo os lançamentos nos meses subsequentes.

---

## 🧪 Fase 6: Testes, Documentação e Observabilidade

> **Objetivo:** Manter o código testável, documentado e monitorado no Render.

- [ ] **Documentação da API com Swagger/OpenAPI**
  - [ ] Configurar `swagger-ui-express` para documentar todos os endpoints, corpos de requisição e respostas.
- [ ] **Testes Automatizados**
  - [ ] Configurar ambiente de testes com `Jest` ou `Vitest` + `Supertest`.
  - [ ] Escrever testes unitários para a lógica de autenticação e controllers.
  - [ ] Escrever testes de integração para as rotas principais.
- [ ] **Monitoramento de Logs e Erros**
  - [ ] Integrar sistema de logging como `Winston` ou `Pino`.
  - [ ] Configurar `Sentry` para captura e alerta automático de erros em produção no Render.
