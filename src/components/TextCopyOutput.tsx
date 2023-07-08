import { Accessor, Component } from 'solid-js';
import { useClipboard } from 'solidjs-use';
import { TbClipboardCheck, TbClipboardText } from 'solid-icons/tb';

export const TextCopyOutput: Component<{ text: Accessor<string> }> = props => {
  const { copy, copied } = useClipboard({ source: props.text });
  return <>
    <div class="relative mb-4">
      <div class="w-full h-full pr-11 pl-5 py-2 rounded bg-stone-700 text-ellipsis overflow-hidden whitespace-nowrap border border-stone-600">
        <span>{props.text()}</span>
      </div>
      <button class="absolute right-0 top-1/2 h-full text-2xl w-12 -translate-y-1/2 flex justify-center items-center" onClick={() => copy()}>
        {copied() ? <TbClipboardCheck /> : <TbClipboardText />}
      </button>
    </div>
  </>;
};
