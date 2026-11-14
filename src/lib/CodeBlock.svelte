<script lang="ts">
  import { highlightCode } from './code.js';
  let { code, language = 'typescript' }: { code: string; language?: string } = $props();
  const html = $derived(highlightCode(code, language));
</script>
<div class="code-component"><div class="code-block"><div class="snippet-language">{language === 'ini' ? '.ENV / CONFIGURATION' : language.toUpperCase()}</div><!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users must scroll wide code samples.) -->
<pre tabindex="0" aria-label={`${language} code example`}><code class="hljs">{@html html}</code></pre></div></div>
