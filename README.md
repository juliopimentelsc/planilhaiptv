# IPTV Base

Aplicação para organizar clientes, credenciais, painéis, planos e vencimentos de IPTV. O acesso é feito com e-mail e senha; os dados são sincronizados no Supabase e separados por conta.

## Recursos

- Cadastro, consulta, edição e exclusão de clientes
- Acompanhamento do painel, login, senha, plano, compra, vencimento, aplicativo, link de renovação, preço e conexões
- Painéis Atmos, Cinemax, Luma TV, Nexus, Espace One Play, Slim Plus e Aura TV+, com opção de adicionar outros
- Busca e filtros por painel, situação e vencimento
- Cadastro e login por e-mail e senha
- Sincronização entre dispositivos com políticas de acesso por usuário
- Importação opcional dos cadastros antigos salvos neste navegador

## Conectar ao Supabase

1. Crie um projeto no Supabase.
2. No SQL Editor do projeto, execute o conteúdo de [`supabase/migrations/20261010000000_create_customer_manager.sql`](supabase/migrations/20261010000000_create_customer_manager.sql).
3. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os valores do seu projeto. Em Lovable, configure as mesmas variáveis no ambiente do app.
4. Reinicie o app e crie uma conta na tela de acesso. Se a confirmação de e-mail estiver ativa no Supabase, confirme a mensagem recebida antes de entrar.

Use apenas a chave pública `publishable` (ou a antiga `anon`) no navegador. Nunca coloque uma chave `service_role` no código do app. O banco aplica Row Level Security para que cada conta consulte e altere apenas seus próprios painéis e clientes.

## Desenvolvimento

Este projeto está conectado ao [Lovable](https://lovable.dev). Alterações enviadas à branch `main` aparecem no editor.

~~~sh
npm install
npm run dev
~~~

