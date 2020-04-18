import { Slack, CodeBro } from '../../../types';
import bro from './bro';
import help from './help';
import Queue from '../../../Queue';

interface CommandEvent {
  command: string | undefined;
  requestBody: Slack.Payloads.Command;
}

const commands = new Queue<CommandEvent>();

(async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  for await (const { command, requestBody } of commands) {
    switch (command) {
      case CodeBro.Command.Bro:
        await bro(requestBody);
        break;
      case CodeBro.Command.Help:
      default:
        await help(requestBody.response_url);
    }
  }
})();

export default commands;
