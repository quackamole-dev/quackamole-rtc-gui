import { IPlugin } from 'quackamole-shared-types';
import { Component } from 'solid-js';

export const PluginOverviewCard: Component<{plugin: IPlugin, onSelect: () => void}> = props => {

  return <>
    <div class="cursor-pointer snap-center q-card-lighter p-2 !bg-[url(https://via.placeholder.com/400x300)] bg-center bg-cover h-[250px]" onClick={() => props.onSelect()}>
      <div>{props.plugin.name}</div>
    </div>
  </>;
};
