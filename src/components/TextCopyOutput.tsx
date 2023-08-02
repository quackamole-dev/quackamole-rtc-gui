import { Accessor, Component } from 'solid-js';
import { useClipboard } from 'solidjs-use';
import { TbClipboardCheck, TbClipboardText } from 'solid-icons/tb';

export const TextCopyOutput: Component<{ text: Accessor<string> }> = props => {
  const { copy, copied } = useClipboard({ source: props.text });
  return <>
    <div class="relative mb-2 w-full">
      <input type="text" class="q-input-text !h-auto !pr-10 text-ellipsis" value={props.text()} disabled={true} aria-label={'Guest URL'} />
      <button class="absolute right-0 top-1/2 h-full text-2xl w-12 -translate-y-1/2 flex justify-center items-center" onClick={() => copy()}>
        {copied() ? <TbClipboardCheck /> : <TbClipboardText />}
      </button>
    </div>
  </>;
};
