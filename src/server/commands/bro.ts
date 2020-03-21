import { Response } from 'express';
// import getGeneral from '../channels/getGeneral';
import { Slack } from '../../types';
import hookRequest from '../../requests/hookRequest';
import postMessage from '../../messages/postMessage';

export default async (
  req: Slack.IncomingRequest<Slack.CommandRequest>,
  res: Response,
): Promise<void> => {
  res.end();
  const {
    channel_name: channelName,
    user_id: userId,
    response_url: responseUrl,
  } = req.body;

  if (channelName === 'directmessage') {
    await hookRequest(responseUrl, { text: "bro you can't do that here bro" });
    res.end();
  } else {
    await postMessage(userId, 'test');
  }
};
