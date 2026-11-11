# 📘 BIBICAR OS - MANUAL DO USUÁRIO
### Sistema Profissional de Gestão de Oficinas Mecânicas, Centros Automotivos e Vistoria
*Versão 1.0 — Guia Oficial no formato clássico de Ajuda e Manual de Operação*

---

## 📑 ÍNDICE DE TÓPICOS

1. [Apresentação do Sistema](#1-apresentação-do-sistema)
2. [Requisitos de Sistema e Instalação](#2-requisitos-de-sistema-e-instalação)
3. [Guia de Início Rápido (Primeiros Passos)](#3-guia-de-início-rápido-primeiros-passos)
4. [Painel Principal e Navegação](#4-painel-principal-e-navegação)
5. [Módulo de Ordens de Serviço & Orçamentos](#5-módulo-de-ordens-de-serviço--orçamentos)
6. [Quadro Kanban da Oficina](#6-quadro-kanban-da-oficina)
7. [Ficha de Vistoria e Checklist de Entrada](#7-ficha-de-vistoria-e-checklist-de-entrada)
8. [Etiqueta de Troca de Óleo (Para-brisa)](#8-etiqueta-de-troca-de-óleo-para-brisa)
9. [Controle de Estoque e Peças](#9-controle-de-estoque-e-peças)
10. [Comissões de Mecânicos](#10-comissões-de-mecânicos)
11. [Clientes & Prontuário Histórico do Veículo](#11-clientes--prontuário-histórico-do-veículo)
12. [Integração e Envio pelo WhatsApp](#12-integração-e-envio-pelo-whatsapp)
13. [Impressão e Geração de Documentos em PDF](#13-impressão-e-geração-de-documentos-em-pdf)
14. [Segurança, Backup e Exportação para Excel](#14-segurança-backup-e-exportação-para-excel)
15. [Perguntas Frequentes & Resolução de Problemas](#15-perguntas-frequentes--resolução-de-problemas)

---

## 1. APRESENTAÇÃO DO SISTEMA

O **Bibicar OS** foi desenvolvido para atender às necessidades reais do dia a dia de oficinas mecânicas, centros de reparação automotiva, autoelétricas e oficinas de suspensão e freios.

### Principais Pilares:
* **Funcionamento Local e Seguro:** Os dados ficam armazenados diretamente no computador da sua oficina. Não depende de conexão contínua com a internet para criar ou imprimir ordens de serviço.
* **Agilidade no Balcão:** Preenchimento rápido com autocompletar de serviços e peças, busca automática de endereço por CEP e formatação de placas Mercosul.
* **Documentação Jurídica Completa:** Ordem de serviço com termo de garantia conforme o Artigo 26 do Código de Defesa do Consumidor (CDC), registro de avarias pré-existentes e campos formais de assinatura.

---

## 2. REQUISITOS DE SISTEMA E INSTALAÇÃO

```
+--------------------------------------------------------------+
| [?] Assistente de Instalação do Bibicar OS                   |
+--------------------------------------------------------------+
| Bem-vindo ao Assistente de Instalação do Bibicar OS.         |
|                                                              |
| Este programa instalará o Bibicar OS no seu computador.      |
| Recomenda-se fechar outros aplicativos antes de continuar.   |
|                                                              |
| Clique em Avançar para prosseguir ou Cancelar para sair.     |
|                                                              |
|              [ < Voltar ]  [ Avançar > ]  [ Cancelar ]       |
+--------------------------------------------------------------+
```

### Requisitos Recomendados:
* **Sistema Operacional:** Microsoft Windows 10 ou Windows 11 (64 bits) / Distribuições Linux recentes.
* **Memória RAM:** Mínimo de 4 GB (recomendado 8 GB).
* **Espaço Livre em Disco:** 250 MB livres.
* **Impressora:** Qualquer impressora térmica ou jato de tinta/laser compatível com folha A4.

### Passo a Passo de Instalação no Windows:
1. Dê um duplo clique no executável de instalação gerado: `Bibicar OS Setup.exe`.
2. **Tela de Boas-vindas:** O instalador NSIS iniciará o assistente. Clique em **Avançar**.
3. **Local de Instalação:** O diretório padrão sugerido é `C:\Program Files\Bibicar OS`. Caso deseje instalar em outra pasta ou unidade, utilize o botão **Procurar**.
4. **Opções de Atalho:** Mantenha marcadas as opções:
   - `[X] Criar atalho na Área de Trabalho`
   - `[X] Criar atalho no Menu Iniciar`
5. **Instalação:** Clique em **Instalar**. O processo copiará os arquivos e registrará o aplicativo nativamente.
6. **Conclusão:** Marque `[X] Executar Bibicar OS` e clique em **Concluir**. O sistema abrirá em janela dedicada com o ícone oficial da marca.

---

## 3. GUIA DE INÍCIO RÁPIDO (PRIMEIROS PASSOS)

Antes de criar a sua primeira Ordem de Serviço, dedique 2 minutos para configurar a identidade da sua oficina:

1. Clique no botão de **Configurações** (ícone de engrenagem no canto superior direito).
2. Preencha os dados cadastrais da sua empresa:
   - **Nome da Oficina / Nome Fantasia:** Ex.: `Auto Mecânica São Jorge`
   - **Razão Social:** Ex.: `São Jorge Centro Automotivo LTDA`
   - **CNPJ e Inscrição Estadual:** Utilizados no cabeçalho das ordens impressas.
   - **Endereço Completo:** Rua, número, bairro, cidade e CEP.
   - **Telefone e WhatsApp:** Telefones que sairão impressos para contato do cliente.
   - **URL do Logotipo:** Link da sua logomarca (ou imagem em base64) para sair estampada no cabeçalho.
   - **Termo de Garantia:** O texto padrão do Art. 26 do CDC já vem redigido, mas você pode personalizá-lo livremente.
3. Clique em **Salvar Configurações**. A partir desse momento, todos os seus relatórios e orçamentos exibirão o cabeçalho oficial da sua empresa.

---

## 4. PAINEL PRINCIPAL E NAVEGAÇÃO

A barra superior do Bibicar OS organiza o trabalho da oficina em abas de fácil acesso:

* **📋 Lista de Ordens:** Tabela com busca geral por placa, cliente, número da OS ou modelo de veículo, com filtros por status e botões de ação rápida (Imprimir, Baixar PDF, WhatsApp, Editar, Histórico e Excluir).
* **📌 Quadro Oficina (Kanban):** Visão visual das etapas de atendimento do carro dentro da oficina.
* **👥 Clientes & Veículos:** Listagem organizada de todos os clientes atendidos e seus veículos vinculados.
* **📦 Estoque & Peças:** Catálogo de peças com quantidades em prateleira, preço de custo, preço de venda e alerta de reposição.
* **💰 Comissões:** Resumo de mão de obra e comissões automáticas para cada mecânico cadastrado.
* **⚙️ Botão de Configurações:** Parâmetros da oficina.
* **➕ Nova OS / Orçamento:** Botão vermelho destacado para iniciar um atendimento imediatamente.

---

## 5. MÓDULO DE ORDENS DE SERVIÇO & ORÇAMENTOS

O formulário de Ordem de Serviço foi estruturado para preenchimento em menos de 1 minuto:

### Passo 1: Dados do Cliente
* **Nome Completo e Documento (CPF/CNPJ):** Digite os números e o sistema aplica a pontuação automaticamente.
* **Telefone / Celular:** O número informado será utilizado diretamente no disparo de mensagens via WhatsApp.
* **CEP com Busca Automática:** Ao digitar os 8 dígitos do CEP, o sistema consulta a base do ViaCEP e preenche rua, bairro, cidade e estado em fração de segundos.

### Passo 2: Dados do Veículo
* **Placa do Carro:** Formata automaticamente placas padrão antigo (`ABC-1234`) e padrão Mercosul (`ABC1D23`).
* **Marca e Modelo:** Ex.: `Chevrolet Onix 1.0 Turbo`, `Fiat Strada 1.4`.
* **Ano / Modelo e Cor:** Identificação precisa do veículo.
* **Quilometragem (KM Entrada):** Essencial para garantias e histórico de revisões.
* **Nível de Combustível:** Marcador rápido (Reserva, 1/4, 1/2, 3/4, Cheio).
* **Mecânico Responsável:** Atribuição do profissional que liderará o diagnóstico.

### Passo 3: Checklist de Entrada & Vistoria de Avarias
* Verificação com 1 clique de itens de segurança: Estepe, Macaco, Chave de Roda, Triângulo, Manual e Documento.
* **Campo de Avarias Pré-Existentes:** Descreva arranhões, mossas ou trincas já presentes no veículo para evitar reclamações indevidas na entrega.
* **Pertences Deixados:** Registre objetos deixados no veículo (óculos, ferramentas, cabos, etc.).

### Passo 4: Mão de Obra e Serviços
* Adicione os serviços a serem executados. Conforme você digita, o sistema sugere opções populares do catálogo (ex.: Alinhamento 3D, Troca de Correia, Limpeza de Bicos).
* Atribua cada serviço ao mecânico responsável.
* O sistema totaliza a mão de obra automaticamente.

### Passo 5: Peças, Óleos e Materiais Aplicados
* Lance peças com quantidade, unidade (UN, L, JG, KIT) e valor unitário.
* Sugestões automáticas com preços puxados do seu estoque.
* Subtotal de peças calculado em tempo real.

### Passo 6: Condições de Pagamento e Finalização
* Selecione a forma de pagamento (Dinheiro, PIX, Cartão de Crédito, Cartão de Débito, Boleto Faturado).
* Defina as parcelas (À Vista, 2x, 3x, etc.).
* Campo para concessão de descontos e observações técnicas.
* Selecione o Status: `ORÇAMENTO`, `ABERTO`, `EM ANDAMENTO`, `AGUARDANDO PEÇAS`, `PRONTO` ou `CONCLUÍDO`.
* Clique em **Salvar Registro** ou **Salvar e Imprimir**.

---

## 6. QUADRO KANBAN DA OFICINA

O Kanban oferece uma visão panorâmica do pátio da oficina:

```
+---------------+---------------+---------------+---------------+---------------+
| ORÇAMENTO     | ABERTO        | EM ANDAMENTO  | AG. PEÇAS     | PRONTO        |
+---------------+---------------+---------------+---------------+---------------+
| [OS #04419]   | [OS #04421]   | [OS #04418]   | [OS #04420]   | [OS #04417]   |
| T-Cross 1.4   | HB20 1.6      | Onix Turbo    | Fiorino Evo   | Renegade 1.8  |
| Placa: FDS8H44| Placa: BRA2E19| Placa: ABC1D23| Placa: FIO4K12| Placa: REN7A90|
| Resp: Marcos  | Resp: Beto    | Resp: Beto    | Resp: Beto    | Resp: Marcos  |
| R$ 740,00     | R$ 1.140,00   | R$ 1.250,00   | R$ 1.620,00   | R$ 420,00     |
+---------------+---------------+---------------+---------------+---------------+
```

* Cada cartão exibe: Número da OS, veículo, placa, mecânico responsável e valor total.
* Permite alterar o status do atendimento com agilidade sem necessidade de reabrir o formulário completo.

---

## 7. FICHA DE VISTORIA E CHECKLIST DE ENTRADA

Para oficinas que utilizam prancheta física no pátio antes de digitar no computador:

1. Na lista de ordens ou no menu superior, clique em **Imprimir Vistoria** (ou use a opção dentro de uma OS existente).
2. O sistema gera uma folha A4 com:
   - Diagrama de inspeção da lataria (Frente, Laterais, Teto, Traseira) com legenda para marcar amassados (A), riscos (R) e trincas (T).
   - Grade com 30 itens de checagem técnica (Lubrificação, Freios, Suspensão, Segurança, Elétrica e Acessórios).
   - Termo formal de autorização para testes práticos de rodagem em via pública assinado pelo proprietário.

---

## 8. ETIQUETA DE TROCA DE ÓLEO (PARA-BRISA)

Fidelize os clientes da sua oficina garantindo que eles saibam exatamente quando retornar para a próxima troca de lubrificante:

1. Na linha da OS correspondente, clique no ícone de gota d'água (**Etiqueta de Óleo**).
2. Defina o intervalo desejado:
   - `5.000 km` (ou 6 meses) — Uso severo / óleo mineral.
   - `7.000 km` (ou 6 meses) — Uso misto / semissintético.
   - `10.000 km` (ou 12 meses) — Uso rodoviário / 100% sintético.
3. O sistema calcula a data futura e a quilometragem exata da próxima troca.
4. Marque os filtros substituídos (Óleo, Ar, Combustível, Cabine).
5. Escolha entre:
   - **Imprimir Etiqueta:** Envia diretamente para impressora adesiva ou convencional no formato padrão de 90 x 60 mm.
   - **Baixar PDF:** Salva o arquivo em PDF para armazenamento ou impressão posterior.

---

## 9. CONTROLE DE ESTOQUE E PEÇAS

Localizado na aba **Estoque & Peças**:

* **Cadastro de Itens:** Código de referência da peça (SKU), descrição, categoria, unidade de medida, preço de custo e preço de venda.
* **Estoque Mínimo Inteligente:** O sistema calcula a margem de lucro de cada item e destaca em amarelo/vermelho quando a quantidade em prateleira atinge o limite crítico de reposição.
* **Baixa Automática:** Ao adicionar peças em uma Ordem de Serviço, o estoque reflete o uso dos materiais aplicados.

---

## 10. COMISSÕES DE MECÂNICOS

Gerencie a produtividade da equipe sem planilhas complexas:

* Na aba **Comissões**, visualize o ranking de produção da oficina.
* Cada mecânico tem sua comissão calculada com base no percentual cadastrado sobre a mão de obra dos serviços concluídos por ele.
* Filtre por período para realizar os pagamentos semanais, quinzenais ou mensais com precisão e transparência.

---

## 11. CLIENTES & PRONTUÁRIO HISTÓRICO DO VEÍCULO

O Bibicar OS mantém a memória técnica de todos os carros atendidos:

1. Ao abrir uma nova OS, ao digitar o nome ou telefone do cliente, o sistema reconhece cadastros existentes e preenche os dados do veículo instantaneamente.
2. Na aba **Clientes & Veículos** ou no botão de histórico de cada linha, abra o **Prontuário Completo do Veículo**:
   - Linha do tempo de todas as passagens daquele carro pela oficina.
   - Quilometragens anteriores registradas.
   - Histórico de peças substituídas no passado (evitando trocas redundantes ou permitindo cobrar garantias de fabricantes).

---

## 12. INTEGRAÇÃO E ENVIO PELO WHATSAPP

Comunique-se profissionalmente com seus clientes com apenas 1 clique:

* **Envio de Orçamento:** O sistema redige uma mensagem limpa, contendo a discriminação de serviços, peças, prazos e valor total com link direto para o WhatsApp do cliente.
* **Aviso de Carro Pronto:** Na tela de visualização de documento, clique em **Avisar Pronto no WhatsApp**. Uma mensagem formal parabeniza a conclusão dos serviços, informa os horários de funcionamento da oficina e solicita a retirada do veículo.

---

## 13. IMPRESSÃO E GERAÇÃO DE DOCUMENTOS EM PDF

O sistema possui um gerador de PDF vetorial nativo (em memória) que não sofre interferências de zoom ou configurações de navegador:

```
+--------------------------------------------------------------+
| [PDF] Central de Impressão e Visualização                    |
+--------------------------------------------------------------+
| Ordem de Serviço #04417 - CARLOS EDUARDO SILVA               |
| Formato: A4 Oficial (210 x 297 mm) - Resolução: 300 DPI      |
|                                                              |
| [ WhatsApp ]  [ Nova Guia ]  [ Baixar PDF ]  [ Imprimir ]    |
|--------------------------------------------------------------|
| [  Visualizador de PDF integrado de Alta Resolução        ]  |
+--------------------------------------------------------------+
```

* **Baixar PDF (.pdf):** Salva o documento no computador com nome padronizado (Ex.: `OS_04417_CARLOS_EDUARDO_SILVA.pdf`).
* **Imprimir Agora:** Dispara o comando de impressão formatado perfeitamente para folha A4.
* **Nova Guia:** Abre o PDF em tela cheia no visualizador nativo do navegador para uso do atalho universal `Ctrl + P`.

---

## 14. SEGURANÇA, BACKUP E EXPORTAÇÃO PARA EXCEL

Seus dados são o maior patrimônio da sua oficina:

### Como Fazer Backup dos Dados:
1. No menu superior da oficina, clique no botão **Backup**.
2. Um arquivo `.json` com todas as suas ordens de serviço, clientes, histórico e configurações será baixado imediatamente no seu computador.
3. Guarde esse arquivo em um pen drive ou serviço de nuvem (Google Drive, OneDrive, etc.).

### Como Restaurar um Backup:
1. No menu superior, clique em **Importar Backup**.
2. Selecione o arquivo `.json` salvo anteriormente. O sistema restaurará todos os registros de forma instantânea.

### Exportação para Excel (.xlsx):
* Clique em **Exportar Excel** para gerar uma planilha com colunas detalhadas de faturamento, peças, serviços e clientes para envio à sua contabilidade ou análise financeira gerencial.

---

## 15. PERGUNTAS FREQUENTES & RESOLUÇÃO DE PROBLEMAS

### P: O sistema precisa de internet para funcionar?
**R:** Não. O Bibicar OS foi construído para funcionar de maneira 100% autônoma no computador da oficina. A internet só é utilizada para a consulta automática de CEP (ViaCEP) e para o redirecionamento de mensagens do WhatsApp Web.

### P: Troquei de computador na oficina. Como transfiro o sistema e os dados?
**R:** Simples e rápido:
1. No computador antigo, clique em **Backup** no topo da tela e guarde o arquivo baixado.
2. No computador novo, instale o **Bibicar OS**.
3. Abra o programa e clique em **Importar Backup**, selecionando o arquivo do pen drive. Todos os clientes, peças e ordens estarão no mesmo lugar.

### P: Como configurar minha impressora para que a OS saia em apenas 1 folha?
**R:** No diálogo de impressão:
* Selecione tamanho do papel: **A4**.
* Margens: **Padrão** ou **Mínimas**.
* Escala: **100%** ou **Ajustar à página**.

---

*Bibicar OS — Gestão de Oficina Mecânica*  
*Documento gerado para a versão Desktop & Local.*
