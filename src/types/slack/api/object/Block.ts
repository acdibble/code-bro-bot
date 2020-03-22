export interface Section {
  type: 'section';
  text: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
  };
}

type Block = Section;

// eslint-disable-next-line no-undef
export default Block;
