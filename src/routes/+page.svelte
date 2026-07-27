<script lang="ts">
  type Message = { role: 'system' | 'user' | 'assistant'; content: string; turn?: number };

  let turnSeed = 0;
  function nextTurn() {
    turnSeed++;
    return turnSeed;
  }

  let messages = $state<Message[]>([
    { role: 'system', content: 'Du er en hjælpsom assistent.' },
    { role: 'assistant', content: 'Hej! Hvad kan jeg hjælpe med i dag?', turn: nextTurn() }
  ]);
  let input = $state('');
  let loading = $state(false);
  let textareaEl = $state<HTMLTextAreaElement>();
  let transcriptEl = $state<HTMLDivElement>();

  function timeNow() {
    return new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  }

  function autosize() {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, 110) + 'px';
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      transcriptEl?.scrollTo({ top: transcriptEl.scrollHeight, behavior: 'smooth' });
    });
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    messages.push({ role: 'user', content: trimmed, turn: nextTurn() });
    input = '';
    autosize();
    loading = true;
    scrollToBottom();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      if (!res.ok) throw new Error('Anmodningen fejlede');

      const data = await res.json();
      messages.push({ role: 'assistant', content: data.reply, turn: nextTurn() });
    } catch {
      messages.push({
        role: 'assistant',
        content: 'Beklager, noget gik galt. Prøv venligst igen.',
        turn: nextTurn()
      });
    } finally {
      loading = false;
      scrollToBottom();
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="flex h-screen items-center justify-center bg-[#F3F5F7] p-6">
  <div
    class="flex h-[min(760px,92vh)] w-full max-w-md flex-col overflow-hidden rounded-[20px] border border-[#E1E4E8] bg-white shadow-[0_30px_60px_-24px_rgba(28,33,39,0.28)]"
  >
    <!-- Header -->
    <header class="border-b border-[#E1E4E8] px-5 pb-4 pt-5">
      <div class="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-[#6B7280]">
        <span class="h-1.5 w-1.5 rounded-full bg-[#5B5BD6] shadow-[0_0_0_3px_#EEEEFC]"></span>
        Online
      </div>
      <h1 class="mt-2 font-sans text-[20px] font-semibold tracking-tight text-[#1C2127]">Chatbot</h1>
      <p class="text-[13px] text-[#6B7280]">Svarer typisk med det samme</p>
    </header>

    <!-- Transcript: a thin thread line connects each turn -->
    <div bind:this={transcriptEl} class="transcript relative flex-1 space-y-4 overflow-y-auto py-4 pl-10 pr-5">
      {#each messages.filter((m) => m.role !== 'system') as msg}
        <div class="relative flex max-w-[82%] flex-col {msg.role === 'user' ? 'ml-auto items-end' : 'items-start'}">
          <span
            class="absolute -left-7 top-2 h-2.5 w-2.5 rounded-full border-2 bg-white {msg.role === 'user'
              ? 'border-[#6B7280]'
              : 'border-[#5B5BD6]'}"
          ></span>
          <div
            class="rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-snug
            {msg.role === 'user'
              ? 'rounded-br-[4px] bg-[#1C2127] text-[#F5F6F7]'
              : 'rounded-bl-[4px] bg-[#EEEEFC] text-[#1C2127]'}"
          >
            {msg.content}
          </div>
          <div class="mt-1 px-0.5 font-mono text-[10.5px] text-[#6B7280]">
            {timeNow()} · #{msg.turn}
          </div>
        </div>
      {/each}

      {#if loading}
        <div class="flex w-fit gap-1 rounded-2xl rounded-bl-[4px] bg-[#EEEEFC] px-3.5 py-3">
          <span class="dot"></span><span class="dot" style="animation-delay:.15s"></span><span class="dot" style="animation-delay:.3s"></span>
        </div>
      {/if}
    </div>

    <!-- Composer -->
    <form
      onsubmit={(e) => { e.preventDefault(); sendMessage(); }}
      class="flex items-end gap-2 border-t border-[#E1E4E8] bg-white px-4 pb-4 pt-3.5"
    >
      <textarea
        bind:this={textareaEl}
        bind:value={input}
        oninput={autosize}
        onkeydown={onKeydown}
        rows="1"
        placeholder="Skriv en besked..."
        aria-label="Skriv en besked"
        class="max-h-[110px] min-h-[42px] flex-1 resize-none rounded-xl border border-[#E1E4E8] bg-[#F3F5F7] px-3.5 py-2.5 text-[14.5px] text-[#1C2127] outline-none transition focus:border-[#5B5BD6] focus:ring-2 focus:ring-[#5B5BD6]/15"
      ></textarea>
      <button
        type="submit"
        disabled={loading || !input.trim()}
        aria-label="Send besked"
        class="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-[#1C2127] text-white transition hover:bg-black active:scale-95 disabled:bg-[#C6CAD0] disabled:cursor-not-allowed"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M3 11.5L21 3l-8.5 18-2.5-7.5L3 11.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />
        </svg>
      </button>
    </form>
  </div>
</div>

<style>
  /* Signature: a thin thread line running behind the turn nodes */
  .transcript::before {
    content: '';
    position: absolute;
    top: 24px;
    bottom: 24px;
    left: 20px;
    width: 1px;
    background: #E1E4E8;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: #5B5BD6;
    opacity: 0.5;
    animation: bounce 1.1s infinite ease-in-out;
  }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-4px); opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .dot { animation: none; opacity: 0.7; }
  }
</style>