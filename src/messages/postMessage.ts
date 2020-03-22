import slackRequest from '../requests/slackRequest';
import { Slack } from '../types';

type PostMessage = (message: Slack.Requests.PostMessage) => Promise<Slack.Responses.PostMessage>;

const postMessage: PostMessage = (message) => slackRequest(Slack.Method.PostMessage, message);

export default postMessage;
