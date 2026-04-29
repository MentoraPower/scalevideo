# Video Uploader

Página simples (fundo branco, sem navbar) para subir vídeos em sequência no Supabase Storage. Suporta arquivos de até **2GB** via TUS (resumable upload).

## Setup

1. **Rodar o SQL no Supabase**
   - Abra o projeto no [Supabase Dashboard](https://app.supabase.com).
   - Em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode.
   - Isso cria a tabela `videos`, o bucket `videos` (limite 2GB) e as policies necessárias.

2. **Instalar e rodar**
   ```bash
   cd video-uploader
   npm install
   npm run dev
   ```

3. **Abrir**: http://localhost:5173

## Como funciona

- Formulário pede **Nome** + **Arquivo de vídeo**.
- Ao enviar, o app:
  1. Pega o próximo número de `sequence` (max + 1).
  2. Faz upload via TUS (resumable, chunks de 6MB) para o bucket `videos`.
  3. Insere uma linha em `public.videos` com `name`, `storage_path`, `sequence`, `size_bytes`.
- Lista abaixo mostra os vídeos ordenados por sequência.

## Estrutura

```
src/
  App.tsx              # Página única
  App.css              # Estilo (fundo branco, sem navbar)
  lib/
    supabase.ts        # Cliente Supabase
    uploadVideo.ts     # Upload TUS + helpers de DB
supabase/
  schema.sql           # SQL de setup (rode 1x)
.env.local             # URL e anon key
```

## Notas

- O bucket está **público** para simplificar o setup. Se quiser privado, troque `public` para `false` no SQL e gere signed URLs no frontend.
- O upload usa a chave anon. Para restringir, ative auth no Supabase e ajuste as policies para `authenticated` apenas.
- Limite real é controlado pelo `file_size_limit` do bucket no SQL — se quiser aumentar/diminuir, edite lá.
