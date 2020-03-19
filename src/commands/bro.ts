import { Request, Response } from 'express';
// import getGeneral from '../channels/getGeneral';
import { Slack } from '../types';
import hookRequest from '../requests/hookRequest';

export default async (req: Request, res: Response): Promise<void> => {
  const { body }: { body: Slack.CommandRequest } = req;

  if (body.channel_name === 'directmessage') {
    await hookRequest(body.response_url, { text: 'thanks bro, will do' });
    // res.end();
  } else {
    // const general = await getGeneral();
  }

  console.log(req.body);
  res.end();
};
