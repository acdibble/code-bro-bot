import respond from '../../../requests/respond';
import { CodeBro } from '../../../types';

const generateText = (): string => {
  const commands = Object.values(CodeBro.Command);
  return `Available commands:\n${commands.join('\n')}`;
};

export default (url: string): Promise<void> => respond(url, {
  text: generateText(),
  response_type: 'ephemeral',
});
