import {Accessor, Component} from 'solid-js';
import {useClipboard} from 'solidjs-use';

export const TextCopyOutput: Component<{ text: Accessor<string> }> = props => {
  const {copy, copied} = useClipboard({source: props.text});
  return <div>
    <input type="text" value={props.text()} disabled/>
    <button onClick={() => copy()}>{copied() ? 'copied' : 'copy'}</button>
  </div>;
};
