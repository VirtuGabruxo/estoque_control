# 🛒 Mercadinho Control — Sistema de Gestão de Estoque

Sistema web profissional e moderno de controle de estoque desenvolvido especificamente para mercadinhos e comércios de pequeno/médio porte. Focado em agilidade operacional, facilidade de uso, controle rigoroso de validade (FEFO) e gestão de contas fiadas.

---

## 🚀 Stack Tecnológica

- **Front-end**: Next.js 14 (App Router) + React 18 + Tailwind CSS + Lucide Icons + Recharts
- **Back-end & Banco de Dados**: Supabase (PostgreSQL + Auth + Row Level Security + Stored Functions)
- **Áudio no Front-end**: Web Audio API (síntese sonora para bipes de código de barras sem arquivos externos)
- **Hospedagem Recomendada**: Vercel

---

## ✨ Funcionalidades Implementadas

### 2.0. Login e Registro com Atribuição Automática de Papéis
- Ao abrir o sistema, o operador acessa a tela de Login (E-mail e Senha).
- Aba **"Registrar-se"**: Nome, Sobrenome, E-mail, Telefone e Senha (mínimo 6 dígitos).
- **Regra de Negócio de Papéis**:
  - O **primeiro usuário** registrado no sistema recebe automaticamente privilégios de **`administrador`**.
  - Os usuários subsequentes recebem o papel **`convidado`** (ajustável no banco/painel).
  - Vínculo direto e seguro com o schema `auth.users` e `public.usuarios`.

### 2.1. Estrutura Geral e Identidade Visual
- **Menu Lateral Suspenso (Esquerda)**: Recolhido por padrão exibindo apenas ícones; ao passar o mouse (`hover`), expande com transição fluida mostrando todos os rótulos.
  - Ordem especificada:
    1. Dashboard
    2. Movimentação de Estoque
    3. Produtos
    4. Clientes (Vendas Fiadas)
    5. Relatórios
    6. Histórico
    7. Configurações
- **Canto Superior Direito**: Badge do usuário logado (Nome + Papel Administrador/Convidado), abrindo painel de perfil com botão de logout.
- **Sino de Notificações**: Badge dinâmico de contagem. Alerta automático para lotes que vencem **em 2 dias** e **no dia do vencimento**. Permite marcar como lidas individualmente ou todas de uma vez.
- **Identidade Visual**: Tema escuro com traços elegantes e tema claro suave. A cor primária padrão (Azul Oceano) pode ser trocada por qualquer outra paleta (Esmeralda, Roxo, Índigo, Rubi, Âmbar) em Configurações.

### 2.2. Dashboard (Tela Inicial)
- **Estoque Total**: Contador consolidado de todas as unidades físicas disponíveis.
- **Gráfico de Barras Verticais**: Quantidade de produtos vencendo por dia da semana nos próximos 7 dias (destaque visual em vermelho para vencimento hoje/amanhã).
- **Indicadores Complementares**:
  - Unidades vencendo nos próximos 7 dias.
  - Movimentações de hoje (entradas vs. saídas).
  - Top 5 categorias com maior volume de estoque.
  - Lista de produtos cadastrados recentemente e lotes em situação de atenção.

### 2.3. Movimentação de Estoque (Entrada e Saída)
- Duas abas: **Entrada** e **Saída**.
- Campo de busca preparado para **leitor físico de código de barras** (dispara automaticamente na tecla Enter) ou digitação manual.
- Feedback sonoro sintetizado via Web Audio API:
  - Bipe padrão (1760 Hz) para item novo.
  - Bipe duplo alegre (1760 Hz + 2200 Hz) para bipagem repetida agregada.
  - Chime de sucesso na confirmação da movimentação.
- **🆕 Regra de Agregação por Bipagem (Ambas as Abas)**:
  - Se o mesmo código for bipado mais de uma vez na mesma tela, o sistema **não duplica a linha**: ele soma a quantidade na linha existente, atualizando o campo "Quantidade".
  - A quantidade permanece 100% editável manualmente antes de confirmar.
- **Fluxo de Entrada**:
  - Primeira vez do código: exibe campos obrigatórios (Nome, Categoria e Validade).
  - Códigos já cadastrados: preenche nome e categoria automaticamente e solicita a validade do novo lote.
  - Acumula múltiplos itens antes da confirmação em lote único.
- **Fluxo de Saída (FEFO)**:
  - Ao bipar, adiciona à lista exibindo **apenas nome do produto e quantidade** (sem subtrair e sem exibir estoque anterior/atual antecipadamente).
  - Ao clicar em **"Confirmar Saída"**: processa todos os itens de uma vez no banco via FEFO (deduz primeiro do lote mais próximo da validade).
  - **Exibição do Resultado Final**: modal/tabela transparente informando **Nome do Produto, Quantidade Baixada, Estoque Anterior e Estoque Atual**.
- **Campo de Responsável**: Obrigatório em ambas as abas (seletor inteligente caso haja funcionários cadastrados, ou digitação livre).

### 2.4. Catálogo de Produtos
- Tela inicial limpa com apenas os **cards das categorias fixas** e total de itens.
- Clicar em uma categoria abre a lista detalhada com **Nome, Código de Barras, Próxima Validade e Estoque Atual**.
- **Botão Flutuante "+"** no canto inferior direito para cadastro manual rápido de novos produtos.

### 2.5. Clientes (Vendas Fiadas)
- Guia dedicada a controle de fiado (pode ser ativada/desativada em Configurações).
- Lista de clientes com status e total de dívida pendente.
- **Botão Flutuante "+"** para cadastrar novos clientes (Nome e Telefone/WhatsApp).
- Ao clicar em um cliente, abre a ficha financeira detalhada:
  - Tabela com histórico de compras: Descrição/produto, Data da compra, Quantidade, Valor total, Forma de pagamento (Dinheiro, Pix, Cartão de crédito, Cartão de débito).
  - Botão de alternância instantânea entre **Pago** e **Pendente**.
  - Edição e exclusão de lançamentos.
  - **Filtro por mês** (mês de referência).
  - **Somatório de dívidas**: soma automática de todos os valores pendentes (`pago = false`).

### 2.6. Relatórios
- **Modos de Análise**:
  - **Relatório Geral**: Histórico de entradas e saídas no período com totais consolidados.
  - **Relatório por Prazo de Validade (FEFO)**: Lotes ordenados do vencimento mais próximo ao mais distante, com dias restantes e badges de urgência.
- **Filtros Flexíveis**:
  - Atalhos de período: 7, 15, 30, 60 e 90 dias.
  - Período personalizado via calendário (Data Início até Data Fim).
  - Escopo: Todos os produtos ou por categoria específica.
- **Exportação & Impressão**:
  - Botão de **Impressão** com folha de estilo limpa otimizada para impressora/PDF (`@media print`).
  - Botão de **Exportação CSV** com formatação brasileira (ponto e vírgula e UTF-8 BOM).

### 2.7. Histórico de Movimentações
- Lista cronológica completa de entradas e saídas.
- Mostra tipo da operação, responsável assinado, produtos movimentados com quantidades consolidadas e estoque antes/depois.
- Filtro rápido por tipo: **Tudo**, **Entradas** ou **Saídas**.

### 2.8. Configurações
- **Tema**: Claro ou Escuro.
- **Cor Primária**: Paleta interativa com 6 cores (Azul Oceano, Esmeralda, Roxo Real, Índigo Profundo, Rosa Rubi, Âmbar Dourado).
- **Módulo Clientes**: Chave liga/desliga para ocultar ou exibir a guia de fiado no menu.
- **Gestão de Funcionários**: Cadastrar, ativar/desativar ou excluir colaboradores.
- **Gestão de Categorias**: Cadastrar novas categorias ou excluir (com proteção de segurança impedindo exclusão de categorias com produtos vinculados).
- **Restrição de Papel**: Usuários com perfil `convidado` recebem aviso e não podem alterar parâmetros de configuração.

---

## 🛠️ Como Executar Localmente

1. **Instalar dependências** (caso ainda não tenha feito):
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:3000`

---

## ☁️ Como Fazer Deploy na Vercel

1. Suba o código para o seu repositório no GitHub ou GitLab.
2. Na [Vercel](https://vercel.com), clique em **"Add New Project"** e selecione o repositório.
3. Nas **Environment Variables** (Variáveis de Ambiente), configure:
   - `DATABASE_URL`: `postgresql://postgres.azeebasbdzsrjobmevjp:Xj8KU0XkvSJByYpe@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://azeebasbdzsrjobmevjp.supabase.co`
   - `JWT_SECRET`: uma chave secreta de sua escolha (ex: `mercadinho_estoque_control_jwt_secret_2026_secure`)
4. Clique em **Deploy**. A aplicação estará no ar em poucos segundos!
